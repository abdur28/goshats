import { Timestamp } from "firebase/firestore";

export type ReferralStatus = "pending" | "rewarded" | "expired";

export interface Referral {
  id: string;
  referralCode: string;
  referrerId: string;
  referredId: string;
  status: ReferralStatus;
  rewardAmountKobo: number;
  rewardedAt: Timestamp | null;
  createdAt: Timestamp;
}
