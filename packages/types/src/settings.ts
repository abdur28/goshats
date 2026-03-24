import { Timestamp } from "firebase/firestore";

export interface TierMultipliers {
  standard: number; // always 1.0
  premium: number; // e.g. 1.15
  express: number; // e.g. 1.25
}

export interface PremiumThreshold {
  minRating: number; // e.g. 4.7
  minTrips: number; // e.g. 500
}

export interface PricingSettings {
  baseFareKobo: number;
  perKmRateKobo: number;
  perStopFeeKobo: number;
  bookingFeePercent: number;
  minimumFareKobo: number;
  surgeMultiplier: number;
  tipOptionsKobo: number[];

  tierMultipliers: TierMultipliers;
  premiumThreshold: PremiumThreshold;

  updatedAt: Timestamp;
  updatedBy: string;
}

export interface AppSettings {
  minimumCustomerAppVersion: string;
  minimumRiderAppVersion: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  supportPhone: string;
  supportEmail: string;
  disputePhotoRetentionDays: number;
  referralRewardKobo: number;
  updatedAt: Timestamp;
}
