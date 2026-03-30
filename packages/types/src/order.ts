import { Timestamp } from "firebase/firestore";
import type { RiderTier } from "./rider";

export type OrderStatus =
  | "pending"
  | "accepted"
  | "arrived_pickup"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "cancelled";

export type LoadType = "food" | "parcel" | "document" | "other";
export type PaymentStatus = "pending" | "paid" | "refunded" | "failed";
export type PaymentMethodType = "cash" | "card";
export type ConditionAtPickup = "good" | "damaged" | "refused";

export interface DeliveryStop {
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  contactName: string;
  contactPhone: string; // "+234XXXXXXXXXX"
  notes: string;
}

export interface OrderTimelineEvent {
  status: string;
  timestamp: Timestamp;
  note: string | null;
}

export interface Order {
  id: string;
  customerId: string;
  riderId: string | null;

  // Load details
  loadType: LoadType;
  loadDescription: string;
  isHighValue: boolean;
  declaredValueKobo: number | null;

  // Delivery locations
  isMultiStop: boolean;
  pickup: DeliveryStop;
  dropoff: DeliveryStop;

  // Scheduling
  isScheduled: boolean;
  scheduledPickupAt: Timestamp | null;

  // Rider tier snapshot
  riderTier: RiderTier;
  tierMultiplier: number;

  // Pricing (all in kobo)
  fareAmountKobo: number;
  bookingFeeKobo: number;
  promoDiscountKobo: number;
  referralCreditsAppliedKobo: number;
  tipAmountKobo: number;
  totalAmountKobo: number;

  // Promo
  promoCode: string | null;

  // Status
  status: OrderStatus;

  // Pickup condition
  conditionAtPickup: ConditionAtPickup | null;

  // Timeline
  timeline: OrderTimelineEvent[];

  // Payment
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethodType;
  paystackReference: string | null;

  // Distance & ETA
  estimatedDistanceMeters: number;
  estimatedDurationSeconds: number;

  // Actual timestamps
  actualPickupAt: Timestamp | null;
  actualDeliveryAt: Timestamp | null;

  // Post-delivery
  hasDispute: boolean;
  customerRatingId: string | null;
  riderRatingId: string | null;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface OrderStop {
  id: string;
  sequence: number;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  contactName: string;
  contactPhone: string;
  notes: string;
  stopFareKobo: number;
  status: "pending" | "delivered" | "skipped";
  deliveredAt: Timestamp | null;
}
