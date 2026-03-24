import { Timestamp } from "firebase/firestore";

export type DiscountType = "fixed" | "percentage";

export interface PromoCode {
  code: string; // "RAMADAN20"
  description: string;
  discountType: DiscountType;
  discountValueKobo: number;
  maxDiscountKobo: number | null;
  minOrderKobo: number;
  usageLimit: number;
  usedCount: number;
  perUserLimit: number;
  isActive: boolean;
  expiresAt: Timestamp;
  createdAt: Timestamp;
  createdBy: string;
}

export interface PromoCodeUsage {
  uid: string;
  usedCount: number;
  lastUsedAt: Timestamp;
}
