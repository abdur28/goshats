import * as crypto from "crypto";
import axios from "axios";
import { logger } from "firebase-functions";
import { onRequest, type Request } from "firebase-functions/v2/https";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import admin, { firestore } from "./admin";
import { storeNotification, sendToExpo, getPushTokens, decryptAccountNumber } from "./utils";
import { storePaymentReceipt } from "./receipts";

// ── Paystack Webhook ────────────────────────────────────────────────────────

/**
 * HTTP POST endpoint for Paystack webhook events.
 * Verifies HMAC-SHA512 signature before processing.
 *
 * Events handled:
 *   - charge.success   → payment confirmed, save card if requested, update order
 *   - refund.processed  → update order payment status
 *   - transfer.success  → confirm rider payout
 */
export const paystackWebhook = onRequest(
  { cors: false },
  async (req: Request, res) => {
    // Only accept POST
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
    if (!PAYSTACK_SECRET) {
      logger.error("PAYSTACK_SECRET_KEY not configured");
      res.status(500).send("Server configuration error");
      return;
    }

    // ── Verify signature ──────────────────────────────────────────────────
    const signature = req.headers["x-paystack-signature"] as string;
    if (!signature) {
      logger.warn("Webhook received without signature");
      res.status(401).send("Unauthorized");
      return;
    }

    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== signature) {
      logger.warn("Invalid webhook signature");
      res.status(401).send("Unauthorized");
      return;
    }

    // ── Process event ─────────────────────────────────────────────────────
    const { event, data } = req.body;

    logger.info(`📩 Paystack webhook: ${event}`, {
      reference: data?.reference,
      amount: data?.amount,
    });

    try {
      switch (event) {
        case "charge.success":
          await handleChargeSuccess(data);
          break;
        case "refund.processed":
          await handleRefundProcessed(data);
          break;
        case "transfer.success":
          await handleTransferSuccess(data);
          break;
        case "transfer.failed":
        case "transfer.reversed":
          await handleTransferFailed(data);
          break;
        default:
          logger.info(`Unhandled Paystack event: ${event}`);
      }

      res.status(200).send("OK");
    } catch (error: any) {
      logger.error(`Error processing ${event}:`, error);
      // Still return 200 to prevent Paystack retries for known errors
      res.status(200).send("OK");
    }
  }
);

// ── Handle charge.success ────────────────────────────────────────────

async function handleChargeSuccess(data: Record<string, any>): Promise<void> {
  const reference = data.reference as string;
  const metadata = data.metadata || {};
  const authorization = data.authorization || {};
  const amountKobo = data.amount as number;
  const userId = metadata.userId as string | undefined;

  // ── Idempotency check ─────────────────────────────────────────────────
  const existingPayment = await firestore
    .collection("payment_receipts")
    .where("reference", "==", reference)
    .limit(1)
    .get();

  if (!existingPayment.empty) {
    logger.info("Duplicate webhook — already processed", { reference });
    return;
  }

  // ── Card tokenization flow (₦50 from settings/payments) ──────────────
  if (metadata.tokenization === true && userId) {
    logger.info("🔐 Card tokenization charge", { userId, reference });

    // Save the card to user's paymentMethods subcollection
    if (authorization.reusable && authorization.authorization_code) {
      await savePaymentMethod(userId, authorization);
    }

    // Credit ₦50 (5000 kobo) to user's referralCredits
    await firestore
      .collection("users")
      .doc(userId)
      .update({
        referralCredits: admin.firestore.FieldValue.increment(5000),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    // Notify user
    const notifId = `card_saved_${reference}`;
    await storeNotification("users", userId, {
      id: notifId,
      title: "Card Saved Successfully 💳",
      body: "Your card has been saved. ₦50 has been credited to your wallet!",
      type: "system",
      data: { screen: "payments" },
    });

    const tokens = await getPushTokens("users", userId);
    if (tokens.length > 0) {
      await sendToExpo(
        tokens,
        "Card Saved Successfully 💳",
        "Your card has been saved. ₦50 has been credited to your wallet!",
        { screen: "payments", type: "system" }
      );
    }

    // Store tokenization receipt
    await storePaymentReceipt(userId, data, "tokenization", {
      userId,
      cardLast4: authorization.last4,
      creditedToWallet: true,
      creditAmount: 5000,
    });

    logger.info("✅ Card saved + ₦50 credited", { userId });
    return;
  }

  // ── Order payment flow ────────────────────────────────────────────────
  const orderId = metadata.orderId as string | undefined;

  if (orderId && userId) {
    logger.info("💰 Order payment confirmed", { orderId, reference, amountKobo });

    // Update order payment status
    await firestore
      .collection("orders")
      .doc(orderId)
      .update({
        paymentStatus: "paid",
        "payment.paystackReference": reference,
        "payment.amount": amountKobo,
        "payment.channel": data.channel || "card",
        "payment.paidAt": admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    // Save card if user opted in
    if (
      metadata.saveCard === true &&
      authorization.reusable &&
      authorization.authorization_code
    ) {
      await savePaymentMethod(userId, authorization);
      logger.info("💳 Card saved from order payment", { userId });
    }

    // Handle promo code usage
    const promoCode = metadata.promoCode as string | undefined;
    if (promoCode) {
      try {
        // Increment usage count
        await firestore
          .collection("promoCodes")
          .doc(promoCode)
          .update({
            usedCount: admin.firestore.FieldValue.increment(1),
          });

        // Record user usage
        await firestore
          .collection("promoCodes")
          .doc(promoCode)
          .collection("usages")
          .doc(userId)
          .set(
            {
              usedAt: admin.firestore.FieldValue.serverTimestamp(),
              orderId,
            },
            { merge: true }
          );

        logger.info("🎟️ Promo usage recorded", { promoCode, userId });
      } catch (error) {
        logger.error("Error recording promo usage:", error);
      }
    }

    // Handle referral credits deduction (already deducted from totalAmountKobo on client)
    const referralCreditsApplied = metadata.referralCreditsAppliedKobo as number | undefined;
    if (referralCreditsApplied && referralCreditsApplied > 0) {
      await firestore
        .collection("users")
        .doc(userId)
        .update({
          referralCredits: admin.firestore.FieldValue.increment(-referralCreditsApplied),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      logger.info("💸 Referral credits deducted", {
        userId,
        amount: referralCreditsApplied,
      });
    }

    // Store payment receipt
    await storePaymentReceipt(orderId, data, "order", {
      userId,
      orderId,
      promoCode: promoCode || null,
      referralCreditsApplied: referralCreditsApplied || 0,
    });

    logger.info("✅ Order payment processed", { orderId, reference });
  }
}

// ── Handle refund.processed ──────────────────────────────────────────

async function handleRefundProcessed(data: Record<string, any>): Promise<void> {
  const { reference, amount, transaction_reference, refund_reference, status } =
    data;

  if (status !== "processed") {
    logger.info("Refund not processed", { status });
    return;
  }

  const refundAmountNaira = amount / 100;

  logger.info(`💰 Refund processed: ₦${refundAmountNaira.toLocaleString()}`, {
    refundReference: refund_reference,
    transactionReference: transaction_reference,
  });

  // Find order by original payment reference
  const ordersSnapshot = await firestore
    .collection("orders")
    .where("payment.paystackReference", "==", transaction_reference)
    .limit(1)
    .get();

  if (ordersSnapshot.empty) {
    logger.warn("No order found for refund", { transaction_reference });
    return;
  }

  const orderDoc = ordersSnapshot.docs[0];
  const orderData = orderDoc.data();

  // Update order
  await firestore
    .collection("orders")
    .doc(orderDoc.id)
    .update({
      paymentStatus: "refunded",
      "payment.refundReference": refund_reference,
      "payment.refundAmount": amount,
      "payment.refundedAt": admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

  // Notify customer
  const customerId = orderData.customerId as string;
  const notifId = `refund_${orderDoc.id}_${Date.now()}`;

  await storeNotification("users", customerId, {
    id: notifId,
    title: "Refund Processed 💸",
    body: `₦${refundAmountNaira.toLocaleString()} has been refunded to your account.`,
    type: "order_update",
    data: { orderId: orderDoc.id, screen: "orders" },
  });

  const tokens = await getPushTokens("users", customerId);
  if (tokens.length > 0) {
    await sendToExpo(
      tokens,
      "Refund Processed 💸",
      `₦${refundAmountNaira.toLocaleString()} has been refunded to your account.`,
      { orderId: orderDoc.id, screen: "orders", type: "order_update" }
    );
  }

  // Store refund receipt
  await storePaymentReceipt(orderDoc.id, data, "refund", {
    userId: customerId,
    originalReference: transaction_reference,
    refundReference: refund_reference,
  });

  logger.info("✅ Refund processed for order", { orderId: orderDoc.id });
}

// ── Handle transfer.success (Rider Payout) ───────────────────────────

async function handleTransferSuccess(data: Record<string, any>): Promise<void> {
  const { reference, amount, recipient, transfer_code, status } = data;

  if (status !== "success") {
    logger.info("Transfer not successful", { status });
    return;
  }

  const transferAmountNaira = amount / 100;

  logger.info(
    `✅ Transfer successful: ₦${transferAmountNaira.toLocaleString()}`,
    { recipient: recipient?.name, transferCode: transfer_code, reference }
  );

  // Find payout record by reference
  const payoutSnapshot = await firestore
    .collection("rider_payouts")
    .where("paystackReference", "==", reference)
    .limit(1)
    .get();

  if (payoutSnapshot.empty) {
    logger.warn("No payout record found for transfer", { reference });
    return;
  }

  const payoutDoc = payoutSnapshot.docs[0];
  const payoutData = payoutDoc.data();
  const riderId = payoutData.riderId as string;

  // Update payout record
  await firestore.collection("rider_payouts").doc(payoutDoc.id).update({
    status: "completed",
    completedAt: admin.firestore.FieldValue.serverTimestamp(),
    transferCode: transfer_code,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Update rider earnings (move from processing to completed)
  if (riderId) {
    await firestore
      .collection("riders")
      .doc(riderId)
      .update({
        processingPayoutsKobo: admin.firestore.FieldValue.increment(-amount),
        completedPayoutsKobo: admin.firestore.FieldValue.increment(amount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    // Notify rider
    const notifId = `payout_${payoutDoc.id}`;

    await storeNotification("riders", riderId, {
      id: notifId,
      title: "Payout Completed! 💰",
      body: `₦${transferAmountNaira.toLocaleString()} has been transferred to your bank account.`,
      type: "order_update",
      data: { screen: "earnings" },
    });

    const tokens = await getPushTokens("riders", riderId);
    if (tokens.length > 0) {
      await sendToExpo(
        tokens,
        "Payout Completed! 💰",
        `₦${transferAmountNaira.toLocaleString()} has been transferred to your bank account.`,
        { screen: "earnings", type: "order_update" }
      );
    }
  }

  // Store transfer receipt
  await storePaymentReceipt(payoutDoc.id, data, "transfer", {
    userId: riderId,
    payoutId: payoutDoc.id,
    orderId: payoutData.orderId,
    recipientName: recipient?.name,
  });

  logger.info("✅ Transfer processed for payout", { payoutId: payoutDoc.id });
}

// ── Handle transfer.failed / transfer.reversed ────────────────────────────

async function handleTransferFailed(data: Record<string, any>): Promise<void> {
  const { reference, amount, reason } = data;
  const transferAmountNaira = amount / 100;

  logger.warn(`❌ Transfer failed/reversed: ₦${transferAmountNaira.toLocaleString()}`, { 
    reference, 
    reason 
  });

  const payoutSnapshot = await firestore
    .collection("rider_payouts")
    .where("paystackReference", "==", reference)
    .limit(1)
    .get();

  if (payoutSnapshot.empty) return;

  const payoutDoc = payoutSnapshot.docs[0];
  const payoutData = payoutDoc.data();
  const riderId = payoutData.riderId as string;

  // Mark payout as failed
  await firestore.collection("rider_payouts").doc(payoutDoc.id).update({
    status: "failed",
    failureReason: reason || "Unknown error",
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Revert earnings: from processing back to withdrawable
  if (riderId) {
    await firestore
      .collection("riders")
      .doc(riderId)
      .update({
        processingPayoutsKobo: admin.firestore.FieldValue.increment(-amount),
        withdrawableBalanceKobo: admin.firestore.FieldValue.increment(amount),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    // Notify Rider
    const notifId = `payout_failed_${payoutDoc.id}`;
    await storeNotification("riders", riderId, {
      id: notifId,
      title: "Payout Failed ⚠️",
      body: "Your recent payout failed. The funds have been returned to your wallet. You can withdraw manually.",
      type: "system",
      data: { screen: "earnings" },
    });
    
    const tokens = await getPushTokens("riders", riderId);
    if (tokens.length > 0) {
      await sendToExpo(
        tokens,
        "Payout Failed ⚠️",
        "Your recent payout failed. The funds have been returned to your wallet.",
        { screen: "earnings", type: "system" }
      );
    }
  }
}

// ── Save Payment Method ─────────────────────────────────────────────────────

async function savePaymentMethod(
  userId: string,
  authorization: Record<string, any>
): Promise<void> {
  try {
    const signature = authorization.signature as string;

    // Check if card with same signature already exists (prevent duplicates)
    const existing = await firestore
      .collection("users")
      .doc(userId)
      .collection("paymentMethods")
      .where("signature", "==", signature)
      .limit(1)
      .get();

    if (!existing.empty) {
      logger.info("Card already saved", { userId, signature });
      return;
    }

    // Count existing methods to set isPrimary for first card
    const methodsSnap = await firestore
      .collection("users")
      .doc(userId)
      .collection("paymentMethods")
      .get();

    const isFirst = methodsSnap.empty;

    await firestore
      .collection("users")
      .doc(userId)
      .collection("paymentMethods")
      .add({
        authorizationCode: authorization.authorization_code,
        last4: authorization.last4 || "",
        bank: authorization.bank || "",
        cardType: authorization.card_type || "",
        expiryMonth: authorization.exp_month || "",
        expiryYear: authorization.exp_year || "",
        brand: authorization.brand || "",
        signature: authorization.signature || "",
        bin: authorization.bin || "",
        reusable: authorization.reusable || false,
        isPrimary: isFirst,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    logger.info("💳 Payment method saved", {
      userId,
      last4: authorization.last4,
      isPrimary: isFirst,
    });
  } catch (error) {
    logger.error("Error saving payment method:", error);
  }
}

// ── chargeCard Callable ─────────────────────────────────────────────────────

/**
 * Callable function to charge a saved card via Paystack authorization code.
 * Replaces the Expo API route /api/paystack-charge-authorization.
 */
export const chargeCard = onCall(async (request) => {
  // Verify authenticated
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be logged in");
  }

  const { authorizationCode, email, amount, reference } = request.data;

  if (!authorizationCode || !email || !amount || !reference) {
    throw new HttpsError(
      "invalid-argument",
      "Missing required fields: authorizationCode, email, amount, reference"
    );
  }

  const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
  if (!PAYSTACK_SECRET) {
    throw new HttpsError("internal", "Payment service not configured");
  }

  try {
    const response = await axios.post(
      "https://api.paystack.co/transaction/charge_authorization",
      {
        authorization_code: authorizationCode,
        email,
        amount,
        reference,
        metadata: request.data.metadata || {},
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );

    const tx = response.data.data;

    return {
      status: true,
      data: {
        reference: tx.reference,
        status: tx.status,
        amount: tx.amount,
      },
    };
  } catch (error: any) {
    logger.error("Error charging card:", error.response?.data || error.message);
    throw new HttpsError(
      "internal",
      error.response?.data?.message || "Charge failed"
    );
  }
});

// ── Payout On Delivery ──────────────────────────────────────────────────────

/**
 * Fires when an order is updated. If the status changes to "delivered",
 * it immediately initiates a Paystack transfer to the rider's bank account.
 */
export const payoutOnDelivery = onDocumentUpdated(
  "orders/{orderId}",
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();

    if (!before || !after) return;
    if (before.status === "delivered" || after.status !== "delivered") return;

    const orderId = event.params.orderId;
    const riderId = after.riderId as string | undefined;

    // Only pay out if the customer paid online (card or wallet). 
    // If cash on delivery, the rider already collected the money.
    const paymentMethod = after.paymentMethod as string;
    if (paymentMethod === "cash") {
      logger.info(`Order ${orderId} was paid in cash. No Paystack payout needed.`);
      return;
    }

    if (!riderId) {
      logger.error(`Delivered order ${orderId} has no riderId.`);
      return;
    }

    const fareKobo = (after.fareAmountKobo as number) || 0;
    const tipKobo = (after.tipAmountKobo as number) || 0;
    const amountKobo = fareKobo + tipKobo;

    if (amountKobo <= 0) return;

    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
    if (!PAYSTACK_SECRET) {
      logger.error("PAYSTACK_SECRET_KEY not configured for payouts");
      return;
    }

    // Track whether wallet was updated so the catch block can revert if needed
    let walletUpdated = false;

    try {
      // 1. Fetch rider's primary payout details
      let detailsSnap = await firestore
        .collection("riders")
        .doc(riderId)
        .collection("payoutDetails")
        .where("isPrimary", "==", true)
        .limit(1)
        .get();

      // Fallback: If no primary found, pick any available detail
      if (detailsSnap.empty) {
        detailsSnap = await firestore
          .collection("riders")
          .doc(riderId)
          .collection("payoutDetails")
          .limit(1)
          .get();
      }

      if (detailsSnap.empty) {
        logger.error(`No payout details found for rider ${riderId}`);
        return;
      }

      const payoutDoc = detailsSnap.docs[0];
      const payoutData = payoutDoc.data();
      const encryptedAccount = payoutData.encryptedAccountNumber as string;
      const bankCode = payoutData.bankCode as string;
      const accountName = payoutData.accountName as string;
      
      let recipientCode = payoutData.recipientCode as string | undefined;

      // 2. Decrypt account number
      const accountNumber = decryptAccountNumber(encryptedAccount);
      if (!accountNumber) throw new Error("Could not decrypt account number");

      // 3. Create or get Transfer Recipient via Paystack
      if (!recipientCode) {
        const recipientResp = await axios.post(
          "https://api.paystack.co/transferrecipient",
          {
            type: "nuban",
            name: accountName,
            account_number: accountNumber,
            bank_code: bankCode,
            currency: "NGN",
          },
          {
            headers: {
              Authorization: `Bearer ${PAYSTACK_SECRET}`,
              "Content-Type": "application/json",
            },
          }
        );
        recipientCode = recipientResp.data.data.recipient_code as string;
        
        // Save back for future use to avoid duplicating recipients
        await payoutDoc.ref.update({ recipientCode });
      }

      // 4. Update Rider Wallet (Pre-transfer)
      // Increment total earnings unconditionally.
      // We also temporarily increment withdrawable balance, but since we are initiating
      // the transfer *right now*, we will immediately move it to processingPayouts directly.
      await firestore.collection("riders").doc(riderId).update({
        totalEarningsKobo: admin.firestore.FieldValue.increment(amountKobo),
        withdrawableBalanceKobo: admin.firestore.FieldValue.increment(amountKobo),
      });
      walletUpdated = true;

      // 5. Create local pending payout record
      const payoutRef = firestore.collection("rider_payouts").doc();
      await payoutRef.set({
        riderId,
        orderId,
        amountKobo,
        status: "processing",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Move funds from withdrawable to processing
      await firestore.collection("riders").doc(riderId).update({
        withdrawableBalanceKobo: admin.firestore.FieldValue.increment(-amountKobo),
        processingPayoutsKobo: admin.firestore.FieldValue.increment(amountKobo),
      });

      // 6. Initiate Transfer
      const transferResp = await axios.post(
        "https://api.paystack.co/transfer",
        {
          source: "balance",
          amount: amountKobo, // Kobo
          recipient: recipientCode,
          reason: `GoShats Delivery Earning: Order ${orderId.substring(0, 8)}`,
          reference: payoutRef.id, // Let Paystack know our generated payout ID
        },
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET}`,
            "Content-Type": "application/json",
          },
        }
      );

      // 6. Update payout record with Paystack init data
      await payoutRef.update({
        paystackReference: transferResp.data.data.reference, // Same as our payout ID unless overridden
        transferCode: transferResp.data.data.transfer_code,
        status: "processing", // webhook will update to "completed" later
      });

      logger.info(`Initiated transfer of ₦${amountKobo / 100} to ${riderId}`, {
        transferCode: transferResp.data.data.transfer_code,
      });
      
    } catch (error: any) {
      logger.error("Error initiating payout:", error.response?.data || error.message);
      // Revert wallet changes to prevent funds being stuck in processing state
      if (walletUpdated) {
        await firestore.collection("riders").doc(riderId as string).update({
          totalEarningsKobo: admin.firestore.FieldValue.increment(-amountKobo),
          withdrawableBalanceKobo: admin.firestore.FieldValue.increment(-amountKobo),
          processingPayoutsKobo: admin.firestore.FieldValue.increment(-amountKobo),
        }).catch((revertErr: any) => {
          logger.error(`CRITICAL: Failed to revert wallet for rider ${riderId} — manual fix needed`, revertErr);
        });
      }
    }
  }
);
