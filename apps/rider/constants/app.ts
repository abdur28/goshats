import type { OrderStatus, RiderTier } from "@goshats/types";

export const APP_ROLE = "rider" as const;

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
  pending: "Pending",
  accepted: "Accepted",
  arrived_pickup: "Arrived at Pickup",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const RIDER_TIERS: { value: RiderTier; label: string }[] = [
  { value: "standard", label: "Standard" },
  { value: "premium", label: "Premium" },
  { value: "express", label: "Express" },
];

export const DEFAULT_MAP_REGION = {
  latitude: 9.082,
  longitude: 8.6753,
  latitudeDelta: 8,
  longitudeDelta: 8,
};

export const LOCATION_BROADCAST_INTERVAL = 5000;

// Rider auto-offline timer for graceful background. RTDB onDisconnect handles
// sudden disconnects within ~30s; this timer covers cases where the OS keeps
// the app alive in background longer than we want.
export const INACTIVITY_OFFLINE_MS = 30 * 60 * 1000;

export const SUPPORT_EMAIL = "riders@goshats.com";
export const SUPPORT_PHONE = "+2348000000000"; // TODO: replace with real support number before launch
export const SUPPORT_PHONE_DISPLAY = "0800 000 0000";

export const COMPANY_NAME = "GoShats";
