import type { OrderStatus, RiderTier } from "@goshats/types";

export const APP_ROLE = "customer" as const;

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "accepted",
  "arrived_pickup",
  "picked_up",
  "in_transit",
  "delivered",
  "cancelled",
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Order Placed",
  accepted: "Rider Assigned",
  arrived_pickup: "Rider Arrived",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const RIDER_TIERS: { value: RiderTier; label: string; multiplier: number }[] = [
  { value: "standard", label: "Standard", multiplier: 1.0 },
  { value: "premium", label: "Premium", multiplier: 1.15 },
  { value: "express", label: "Express", multiplier: 1.25 },
];

export const DEFAULT_MAP_REGION = {
  latitude: 9.082,
  longitude: 8.6753,
  latitudeDelta: 8,
  longitudeDelta: 8,
};

export const MAX_EXTRA_STOPS = 5;
