import { Timestamp } from "firebase/firestore";

export type RaterRole = "customer" | "rider";

export interface Rating {
  id: string;
  orderId: string;
  raterRole: RaterRole;
  raterId: string;
  ratedId: string;
  stars: number; // 1-5
  review: string | null;
  tipAmountKobo: number;
  createdAt: Timestamp;
}
