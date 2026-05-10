/**
 * GoShats Cloud Functions
 *
 * Modules:
 *   notifications   — Order status, chat, rating triggers
 *   payments        — Paystack webhook, chargeCard callable
 *   daily-check     — Scheduled maintenance (09:00 WAT daily)
 *   rider-presence  — RTDB → Firestore presence mirror
 */

// Notification triggers
export {
  onOrderCreated,
  onOrderStatusChanged,
  onChatMessage,
  onRatingSubmitted,
} from "./notifications";

// Payments & Payouts
export { paystackWebhook, chargeCard, payoutOnDelivery } from "./payments";

// Scheduled maintenance
export { dailyCheck } from "./daily-check";

// Rider presence mirror (RTDB → Firestore)
export { mirrorRiderPresence } from "./rider-presence";
