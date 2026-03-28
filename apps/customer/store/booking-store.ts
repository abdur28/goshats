import { create } from "zustand";
import type { DeliveryStop, LoadType, RiderTier } from "@goshats/types";

interface BookingState {
  pickup: DeliveryStop | null;
  dropoff: DeliveryStop | null;
  extraStops: DeliveryStop[];
  isMultiStop: boolean;

  loadType: LoadType | null;
  loadDescription: string;
  isHighValue: boolean;
  declaredValueKobo: number | null;

  selectedRiderId: string | null;
  selectedRiderTier: RiderTier;
  tierMultiplier: number;

  isScheduled: boolean;
  scheduledPickupAt: Date | null;

  fareAmountKobo: number;
  bookingFeeKobo: number;
  promoCode: string | null;
  promoDiscountKobo: number;
  totalAmountKobo: number;
  estimatedDistanceMeters: number;
  estimatedDurationSeconds: number;

  setPickup: (stop: DeliveryStop) => void;
  setDropoff: (stop: DeliveryStop) => void;
  addStop: (stop: DeliveryStop) => void;
  removeStop: (index: number) => void;
  reorderStops: (stops: DeliveryStop[]) => void;
  setLoadDetails: (
    loadType: LoadType,
    description: string,
    isHighValue: boolean,
    declaredValueKobo: number | null
  ) => void;
  setRider: (riderId: string, tier: RiderTier, multiplier: number) => void;
  setSchedule: (isScheduled: boolean, date?: Date) => void;
  setPricing: (pricing: {
    fareAmountKobo: number;
    bookingFeeKobo: number;
    totalAmountKobo: number;
    estimatedDistanceMeters: number;
    estimatedDurationSeconds: number;
  }) => void;
  setPromo: (code: string, discountKobo: number) => void;
  clearPromo: () => void;
  resetBooking: () => void;
}

const initialState = {
  pickup: null,
  dropoff: null,
  extraStops: [],
  isMultiStop: false,
  loadType: null,
  loadDescription: "",
  isHighValue: false,
  declaredValueKobo: null,
  selectedRiderId: null,
  selectedRiderTier: "standard" as RiderTier,
  tierMultiplier: 1.0,
  isScheduled: false,
  scheduledPickupAt: null,
  fareAmountKobo: 0,
  bookingFeeKobo: 0,
  promoCode: null,
  promoDiscountKobo: 0,
  totalAmountKobo: 0,
  estimatedDistanceMeters: 0,
  estimatedDurationSeconds: 0,
};

export const useBookingStore = create<BookingState>((set) => ({
  ...initialState,

  setPickup: (pickup) => set({ pickup }),
  setDropoff: (dropoff) => set({ dropoff }),
  addStop: (stop) =>
    set((state) => ({
      extraStops: [...state.extraStops, stop],
      isMultiStop: true,
    })),
  removeStop: (index) =>
    set((state) => {
      const extraStops = state.extraStops.filter((_, i) => i !== index);
      return { extraStops, isMultiStop: extraStops.length > 0 };
    }),
  reorderStops: (extraStops) => set({ extraStops }),
  setLoadDetails: (loadType, loadDescription, isHighValue, declaredValueKobo) =>
    set({ loadType, loadDescription, isHighValue, declaredValueKobo }),
  setRider: (selectedRiderId, selectedRiderTier, tierMultiplier) =>
    set({ selectedRiderId, selectedRiderTier, tierMultiplier }),
  setSchedule: (isScheduled, scheduledPickupAt) =>
    set({ isScheduled, scheduledPickupAt: scheduledPickupAt ?? null }),
  setPricing: (pricing) => set(pricing),
  setPromo: (promoCode, promoDiscountKobo) =>
    set((state) => ({
      promoCode,
      promoDiscountKobo,
      totalAmountKobo: Math.max(
        0,
        state.fareAmountKobo + state.bookingFeeKobo - promoDiscountKobo,
      ),
    })),
  clearPromo: () =>
    set((state) => ({
      promoCode: null,
      promoDiscountKobo: 0,
      totalAmountKobo: state.fareAmountKobo + state.bookingFeeKobo,
    })),
  resetBooking: () => set(initialState),
}));
