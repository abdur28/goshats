import { logger } from "firebase-functions";
import { onSchedule } from "firebase-functions/v2/scheduler";
import admin, { firestore } from "./admin";
import { storeNotification, sendToExpo, getPushTokens } from "./utils";

// ── Daily Check (Consolidated Scheduled Function) ───────────────────────────

/**
 * Runs daily at 09:00 WAT (Africa/Lagos).
 * Consolidates all maintenance tasks into a single scheduled function
 * for cost efficiency (one cold start instead of many).
 */
export const dailyCheck = onSchedule(
  {
    schedule: "every day 09:00",
    timeZone: "Africa/Lagos",
    retryCount: 1,
  },
  async () => {
    logger.info("🕐 Starting daily check...");

    const results = await Promise.allSettled([
      cancelStaleOrders(),
      cleanupInvalidTokens(),
      autoUpgradeRiderTiers(),
      processReferralRewards(),
    ]);

    // Log results
    results.forEach((result, index) => {
      const tasks = [
        "cancelStaleOrders",
        "cleanupInvalidTokens",
        "autoUpgradeRiderTiers",
        "processReferralRewards",
      ];
      if (result.status === "fulfilled") {
        logger.info(`✅ ${tasks[index]} completed`, { result: result.value });
      } else {
        logger.error(`❌ ${tasks[index]} failed`, {
          error: result.reason?.message,
        });
      }
    });

    logger.info("🕐 Daily check completed");
  }
);

// ── Cancel Stale Orders ─────────────────────────────────────────────────────

/**
 * Cancel orders that have been "pending" for more than 30 minutes
 * (no rider accepted them).
 */
async function cancelStaleOrders(): Promise<{ cancelled: number }> {
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);

  const staleOrders = await firestore
    .collection("orders")
    .where("status", "==", "pending")
    .where("createdAt", "<", thirtyMinAgo)
    .get();

  if (staleOrders.empty) {
    logger.info("No stale orders found");
    return { cancelled: 0 };
  }

  let cancelled = 0;
  const batch = firestore.batch();

  for (const doc of staleOrders.docs) {
    batch.update(doc.ref, {
      status: "cancelled",
      cancellationReason: "No rider available — automatically cancelled",
      timeline: admin.firestore.FieldValue.arrayUnion({
        status: "cancelled",
        timestamp: new Date(),
        note: "Auto-cancelled: no rider accepted within 30 minutes",
      }),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Notify customer
    const orderData = doc.data();
    const customerId = orderData.customerId as string;

    await storeNotification("users", customerId, {
      id: `auto_cancel_${doc.id}`,
      title: "Order Auto-Cancelled",
      body: "No riders were available to accept your order. Please try again.",
      type: "order_update",
      data: { orderId: doc.id, screen: "orders" },
    });

    const tokens = await getPushTokens("users", customerId);
    if (tokens.length > 0) {
      await sendToExpo(
        tokens,
        "Order Auto-Cancelled",
        "No riders were available. Please try again.",
        { orderId: doc.id, type: "order_update" }
      );
    }

    cancelled++;
  }

  await batch.commit();
  logger.info(`📋 Cancelled ${cancelled} stale orders`);

  return { cancelled };
}

// ── Cleanup Invalid Tokens ──────────────────────────────────────────────────

/**
 * Remove invalid/expired Expo push tokens from users and riders.
 */
async function cleanupInvalidTokens(): Promise<{
  usersCleared: number;
  ridersCleared: number;
}> {
  let usersCleared = 0;
  let ridersCleared = 0;

  // Clean user tokens
  const usersWithTokens = await firestore
    .collection("users")
    .where("fcmTokens", "!=", [])
    .get();

  for (const userDoc of usersWithTokens.docs) {
    const data = userDoc.data();
    const tokens = (data.fcmTokens || []) as string[];

    const invalidTokens = tokens.filter(
      (token) =>
        typeof token !== "string" || !token.startsWith("ExponentPushToken[")
    );

    if (invalidTokens.length > 0) {
      await userDoc.ref.update({
        fcmTokens: admin.firestore.FieldValue.arrayRemove(...invalidTokens),
      });
      usersCleared++;
    }
  }

  // Clean rider tokens
  const ridersWithTokens = await firestore
    .collection("riders")
    .where("fcmTokens", "!=", [])
    .get();

  for (const riderDoc of ridersWithTokens.docs) {
    const data = riderDoc.data();
    const tokens = (data.fcmTokens || []) as string[];

    const invalidTokens = tokens.filter(
      (token) =>
        typeof token !== "string" || !token.startsWith("ExponentPushToken[")
    );

    if (invalidTokens.length > 0) {
      await riderDoc.ref.update({
        fcmTokens: admin.firestore.FieldValue.arrayRemove(...invalidTokens),
      });
      ridersCleared++;
    }
  }

  logger.info(
    `🧹 Token cleanup: ${usersCleared} users, ${ridersCleared} riders`
  );
  return { usersCleared, ridersCleared };
}

// ── Auto-Upgrade Rider Tiers ────────────────────────────────────────────────

/**
 * Automatically upgrade riders to "premium" tier if they meet thresholds:
 *   - averageRating >= 4.7
 *   - totalTrips >= 500
 *
 * Never auto-assign "express" (admin-only).
 */
async function autoUpgradeRiderTiers(): Promise<{ upgraded: number }> {
  // Get threshold settings (fallback to defaults)
  let ratingThreshold = 4.7;
  let tripsThreshold = 500;

  try {
    const settingsDoc = await firestore
      .collection("settings")
      .doc("pricing")
      .get();
    if (settingsDoc.exists) {
      const settings = settingsDoc.data()!;
      ratingThreshold = settings.premiumRatingThreshold || 4.7;
      tripsThreshold = settings.premiumTripsThreshold || 500;
    }
  } catch (error) {
    logger.warn("Could not load pricing settings, using defaults");
  }

  // Find eligible riders (standard tier, meet thresholds)
  const eligibleRiders = await firestore
    .collection("riders")
    .where("tier", "==", "standard")
    .where("averageRating", ">=", ratingThreshold)
    .get();

  let upgraded = 0;

  for (const riderDoc of eligibleRiders.docs) {
    const riderData = riderDoc.data();
    const totalTrips = (riderData.totalTrips as number) || 0;

    if (totalTrips >= tripsThreshold) {
      await riderDoc.ref.update({
        tier: "premium",
        tierUpgradedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Notify rider
      await storeNotification("riders", riderDoc.id, {
        id: `tier_upgrade_${riderDoc.id}_${Date.now()}`,
        title: "Tier Upgrade! 🌟",
        body: "Congratulations! You've been upgraded to Premium tier based on your excellent performance.",
        type: "system",
        data: { screen: "profile" },
      });

      const tokens = await getPushTokens("riders", riderDoc.id);
      if (tokens.length > 0) {
        await sendToExpo(
          tokens,
          "Tier Upgrade! 🌟",
          "You've been upgraded to Premium tier!",
          { screen: "profile", type: "system" }
        );
      }

      upgraded++;
    }
  }

  logger.info(`⬆️ Upgraded ${upgraded} riders to premium tier`);
  return { upgraded };
}

// ── Process Referral Rewards ────────────────────────────────────────────────

/**
 * Find pending referrals where the referred user has completed at least
 * one delivery. Credit the referrer with the referral reward amount.
 */
async function processReferralRewards(): Promise<{ processed: number }> {
  // Get reward amount from settings
  let referralRewardKobo = 100000; // ₦1,000 default

  try {
    const settingsDoc = await firestore
      .collection("settings")
      .doc("app")
      .get();
    if (settingsDoc.exists) {
      const settings = settingsDoc.data()!;
      referralRewardKobo = settings.referralRewardKobo || 100000;
    }
  } catch (error) {
    logger.warn("Could not load app settings, using default reward");
  }

  // Find pending referrals
  const pendingReferrals = await firestore
    .collection("referrals")
    .where("status", "==", "pending")
    .get();

  if (pendingReferrals.empty) {
    return { processed: 0 };
  }

  let processed = 0;

  for (const refDoc of pendingReferrals.docs) {
    const refData = refDoc.data();
    const referredId = refData.referredId as string;
    const referrerId = refData.referrerId as string;

    // Check if referred user has completed at least 1 order
    const completedOrders = await firestore
      .collection("orders")
      .where("customerId", "==", referredId)
      .where("status", "==", "delivered")
      .limit(1)
      .get();

    if (completedOrders.empty) continue;

    // Use a transaction to atomically check status and credit the referrer.
    // This prevents double-crediting if the cron fires concurrently.
    let alreadyRewarded = false;
    await firestore.runTransaction(async (tx) => {
      const freshSnap = await tx.get(refDoc.ref);
      if (!freshSnap.exists || freshSnap.data()?.status !== "pending") {
        alreadyRewarded = true;
        return;
      }
      const userRef = firestore.collection("users").doc(referrerId);
      tx.update(userRef, {
        referralCredits: admin.firestore.FieldValue.increment(referralRewardKobo),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      tx.update(refDoc.ref, {
        status: "rewarded",
        rewardedAt: admin.firestore.FieldValue.serverTimestamp(),
        rewardAmount: referralRewardKobo,
      });
    });

    if (alreadyRewarded) continue;

    // Notify referrer
    const rewardNaira = (referralRewardKobo / 100).toLocaleString("en-NG");

    await storeNotification("users", referrerId, {
      id: `referral_reward_${refDoc.id}`,
      title: `₦${rewardNaira} Referral Bonus! 🎉`,
      body: `Your friend completed their first delivery. ₦${rewardNaira} has been credited to your wallet!`,
      type: "referral_reward",
      data: { screen: "wallet" },
    });

    const tokens = await getPushTokens("users", referrerId);
    if (tokens.length > 0) {
      await sendToExpo(
        tokens,
        `₦${rewardNaira} Referral Bonus! 🎉`,
        `Your friend completed their first delivery. ₦${rewardNaira} credited!`,
        { screen: "wallet", type: "referral_reward" }
      );
    }

    processed++;
  }

  logger.info(`🎁 Processed ${processed} referral rewards`);
  return { processed };
}
