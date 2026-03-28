import { create } from "zustand";
import type { PricingSettings } from "@goshats/types";
import { Timestamp } from "firebase/firestore";

const DEFAULT_SETTINGS: PricingSettings = {
  baseFareKobo: 50000, // ₦500
  perKmRateKobo: 15000, // ₦150/km
  perStopFeeKobo: 20000, // ₦200/extra stop
  bookingFeePercent: 10,
  minimumFareKobo: 70000, // ₦700
  surgeMultiplier: 1.0,
  tipOptionsKobo: [10000, 20000, 50000],
  tierMultipliers: { standard: 1.0, premium: 1.15, express: 1.25 },
  premiumThreshold: { minRating: 4.7, minTrips: 500 },
  updatedAt: Timestamp.now(),
  updatedBy: "default",
};

interface PricingState {
  settings: PricingSettings;
  isLoaded: boolean;
  setSettings: (settings: PricingSettings) => void;
}

export const usePricingStore = create<PricingState>((set) => ({
  settings: DEFAULT_SETTINGS,
  isLoaded: false,
  setSettings: (settings) => set({ settings, isLoaded: true }),
}));
