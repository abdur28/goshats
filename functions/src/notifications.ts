import { logger } from "firebase-functions";
import {
  onDocumentUpdated,
  onDocumentCreated,
} from "firebase-functions/v2/firestore";
import admin, { firestore } from "./admin";
import { storeNotification, sendToExpo, getPushTokens } from "./utils";

// ── Order Status Changed ────────────────────────────────────────────────────

/**
 * Fires when any order document is updated.
 * Detects status changes and sends notifications to customer and/or rider.
 */
export const onOrderStatusChanged = onDocumentUpdated(
  "orders/{orderId}",
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();

    if (!before || !after) return;

    // Only trigger on status changes
    if (before.status === after.status) return;

    const orderId = event.params.orderId;
    const newStatus = after.status as string;
    const customerId = after.customerId as string;
    const riderId = after.riderId as string | undefined;

    logger.info(`Order ${orderId} status: ${before.status} → ${newStatus}`);

    // Build notification based on new status
    const notification = getStatusNotification(newStatus, after);
    if (!notification) return;

    // ── Notify customer ─────────────────────────────────────────────────────
    if (notification.customer) {
      const notifId = `order_${newStatus}_${orderId}_${Date.now()}`;

      await storeNotification("users", customerId, {
        id: notifId,
        title: notification.customer.title,
        body: notification.customer.body,
        type: "order_update",
        data: { orderId, screen: "tracking" },
      });

      // Push notification
      const tokens = await getPushTokens("users", customerId);
      if (tokens.length > 0) {
        await sendToExpo(tokens, notification.customer.title, notification.customer.body, {
          orderId,
          screen: "tracking",
          type: "order_update",
        });
      }
    }

    // ── Notify rider ────────────────────────────────────────────────────────
    if (notification.rider && riderId) {
      const notifId = `order_${newStatus}_${orderId}_${Date.now()}`;

      await storeNotification("riders", riderId, {
        id: notifId,
        title: notification.rider.title,
        body: notification.rider.body,
        type: "order_update",
        data: { orderId, screen: "active-delivery" },
      });

      const tokens = await getPushTokens("riders", riderId);
      if (tokens.length > 0) {
        await sendToExpo(tokens, notification.rider.title, notification.rider.body, {
          orderId,
          screen: "active-delivery",
          type: "order_update",
        });
      }

      // Also increment total trips if delivered
      if (newStatus === "delivered") {
        await firestore.collection("riders").doc(riderId).update({
          totalTrips: admin.firestore.FieldValue.increment(1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }
  }
);

// ── Chat Message ────────────────────────────────────────────────────────────

/**
 * Fires when a new chat message is created in an order's chat subcollection.
 * Sends push notification to the other party (not the sender).
 */
export const onChatMessage = onDocumentCreated(
  "orders/{orderId}/chat/{messageId}",
  async (event) => {
    const message = event.data?.data();
    if (!message) return;

    const orderId = event.params.orderId;
    const senderId = message.senderId as string;
    const text = message.text as string;
    const senderName = (message.senderName as string) || "Someone";

    // Get the order to find the other party
    const orderDoc = await firestore.collection("orders").doc(orderId).get();
    if (!orderDoc.exists) return;

    const order = orderDoc.data()!;
    const customerId = order.customerId as string;
    const riderId = order.riderId as string | undefined;

    // Determine recipient
    let recipientId: string | undefined;
    let recipientCollection: "users" | "riders";

    if (senderId === customerId && riderId) {
      recipientId = riderId;
      recipientCollection = "riders";
    } else if (senderId === riderId) {
      recipientId = customerId;
      recipientCollection = "users";
    } else {
      return; // Unknown sender
    }

    if (!recipientId) return;

    const notifId = `chat_${orderId}_${event.params.messageId}`;

    // Store in-app notification
    await storeNotification(recipientCollection, recipientId, {
      id: notifId,
      title: `New message from ${senderName}`,
      body: text.length > 80 ? text.substring(0, 80) + "..." : text,
      type: "chat_message",
      data: { orderId, screen: "chat" },
    });

    // Push notification
    const tokens = await getPushTokens(recipientCollection, recipientId);
    if (tokens.length > 0) {
      await sendToExpo(
        tokens,
        `New message from ${senderName}`,
        text.length > 80 ? text.substring(0, 80) + "..." : text,
        { orderId, screen: "chat", type: "chat_message" }
      );
    }
  }
);

// ── Rating Submitted ────────────────────────────────────────────────────────

/**
 * Fires when a new rating document is created.
 * Updates the rated user/rider's aggregate stats and notifies them.
 */
export const onRatingSubmitted = onDocumentCreated(
  "ratings/{ratingId}",
  async (event) => {
    const rating = event.data?.data();
    if (!rating) return;

    const ratingId = event.params.ratingId;
    const rateeId = (rating.ratedId ?? rating.rateeId) as string;
    const raterRole = rating.raterRole as "customer" | "rider";
    const rateeType = raterRole === "customer" ? "rider" : "customer";
    const stars = rating.stars as number;
    const orderId = rating.orderId as string;

    if (!rateeId || !rateeId.trim()) {
      logger.error(`Rating ${ratingId} has empty ratedId — skipping`);
      return;
    }

    const collectionName = rateeType === "rider" ? "riders" : "users";

    // Update aggregate rating on the ratee's document
    try {
      const rateeDoc = await firestore
        .collection(collectionName)
        .doc(rateeId)
        .get();

      if (rateeDoc.exists) {
        const rateeData = rateeDoc.data()!;
        const currentRating = (rateeData.averageRating as number) || 0;
        const totalRatings = (rateeData.totalRatings as number) || 0;

        // Calculate new average
        const newTotalRatings = totalRatings + 1;
        const newAverageRating =
          (currentRating * totalRatings + stars) / newTotalRatings;

        await firestore
          .collection(collectionName)
          .doc(rateeId)
          .update({
            averageRating: Math.round(newAverageRating * 100) / 100,
            totalRatings: newTotalRatings,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

        logger.info(`Updated ${collectionName}/${rateeId} rating`, {
          newAverage: newAverageRating,
          totalRatings: newTotalRatings,
        });
      }
    } catch (error) {
      logger.error("Error updating aggregate rating:", error);
    }

    // Notify the rated party
    const notifId = `rating_${ratingId}`;
    const starsText = stars >= 4 ? "⭐" : "";

    await storeNotification(
      rateeType === "rider" ? "riders" : "users",
      rateeId,
      {
        id: notifId,
        title: `New ${stars}-star rating ${starsText}`,
        body: `You received a ${stars}-star rating for your recent delivery.`,
        type: "order_update",
        data: { orderId, screen: "orders" },
      }
    );

    const tokens = await getPushTokens(
      rateeType === "rider" ? "riders" : "users",
      rateeId
    );
    if (tokens.length > 0) {
      await sendToExpo(
        tokens,
        `New ${stars}-star rating ${starsText}`,
        `You received a ${stars}-star rating for your recent delivery.`,
        { orderId, screen: "orders", type: "order_update" }
      );
    }
  }
);

// ── Helpers ─────────────────────────────────────────────────────────────────

interface StatusNotification {
  customer?: { title: string; body: string };
  rider?: { title: string; body: string };
}

function getStatusNotification(
  status: string,
  orderData: FirebaseFirestore.DocumentData
): StatusNotification | null {
  // Build pickup/dropoff label for notifications
  const pickupLabel =
    (orderData.pickup?.label as string) || "pickup location";
  const dropoffLabel =
    (orderData.dropoff?.label as string) || "drop-off location";

  // Rider earnings for delivery completed
  const fareKobo = (orderData.fareAmountKobo as number) || 0;
  const tipKobo = (orderData.tipAmountKobo as number) || 0;
  const riderEarnings = ((fareKobo + tipKobo) / 100).toLocaleString("en-NG");

  switch (status) {
    case "accepted":
      return {
        customer: {
          title: "Rider Assigned 🏍️",
          body: "A rider has accepted your order and is heading to the pickup location.",
        },
      };

    case "arrived_pickup":
      return {
        customer: {
          title: "Rider Has Arrived 📍",
          body: `Your rider has arrived at ${pickupLabel}. Please hand over your package.`,
        },
      };

    case "picked_up":
      return {
        customer: {
          title: "Package Picked Up 📦",
          body: "Your package has been picked up and is on its way!",
        },
      };

    case "in_transit":
      return {
        customer: {
          title: "Package In Transit 🚀",
          body: `Your package is on its way to ${dropoffLabel}.`,
        },
      };

    case "delivered":
      return {
        customer: {
          title: "Package Delivered! ✅",
          body: `Your package has been delivered to ${dropoffLabel}. Tap to view receipt.`,
        },
        rider: {
          title: "Delivery Completed! 💰",
          body: `Great job! You earned ₦${riderEarnings} for this delivery.`,
        },
      };

    case "cancelled":
      return {
        customer: {
          title: "Order Cancelled",
          body: "Your order has been cancelled.",
        },
        rider: {
          title: "Order Cancelled",
          body: "The order you were assigned has been cancelled.",
        },
      };

    default:
      return null;
  }
}
