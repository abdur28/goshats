import { Timestamp } from "firebase/firestore";

export type DisputeReason =
  | "item_damaged"
  | "item_missing"
  | "wrong_item"
  | "not_delivered"
  | "rider_behaviour"
  | "customer_behaviour"
  | "other";

export type DisputeStatus = "open" | "under_review" | "resolved" | "dismissed";

export interface Dispute {
  id: string;
  orderId: string;
  reportedBy: "customer" | "rider";
  reporterId: string;

  reason: DisputeReason;
  description: string;
  pickupPhotoUrl: string | null;

  status: DisputeStatus;
  resolution: string | null;
  refundAmountKobo: number | null;

  resolvedAt: Timestamp | null;
  resolvedBy: string | null;

  createdAt: Timestamp;
}
