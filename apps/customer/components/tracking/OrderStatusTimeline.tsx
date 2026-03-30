import { COLORS } from "@/constants/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { OrderStatus, OrderTimelineEvent } from "@goshats/types";
import { Timestamp } from "firebase/firestore";
import React from "react";
import { Text, View } from "react-native";

const STATUS_CONFIG: Record<
  OrderStatus,
  {
    label: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
  }
> = {
  pending: { label: "Order Placed", icon: "clock-outline" },
  accepted: { label: "Rider Accepted", icon: "check-circle-outline" },
  arrived_pickup: { label: "Arrived at Pickup", icon: "map-marker-check-outline" },
  picked_up: { label: "Package Picked Up", icon: "package-up" },
  in_transit: { label: "In Transit", icon: "truck-fast-outline" },
  delivered: { label: "Delivered", icon: "check-decagram-outline" },
  cancelled: { label: "Cancelled", icon: "close-circle-outline" },
};

const ORDERED_STATUSES: OrderStatus[] = [
  "pending",
  "accepted",
  "arrived_pickup",
  "picked_up",
  "in_transit",
  "delivered",
];

function toDate(ts: Timestamp | any): Date | null {
  if (!ts) return null;
  if (ts instanceof Timestamp) return ts.toDate();
  if (ts?.seconds) return new Date(ts.seconds * 1000);
  return null;
}

function formatTime(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  currentStatus: OrderStatus;
  timeline: OrderTimelineEvent[];
}

export default function OrderStatusTimeline({ currentStatus, timeline }: Props) {
  const isCancelled = currentStatus === "cancelled";
  const steps = isCancelled ? [...ORDERED_STATUSES, "cancelled" as OrderStatus] : ORDERED_STATUSES;

  const timelineMap = new Map<string, OrderTimelineEvent>();
  for (const event of timeline) {
    timelineMap.set(event.status, event);
  }

  const currentIndex = steps.indexOf(currentStatus);

  return (
    <View>
      {steps.map((status, idx) => {
        const config = STATUS_CONFIG[status];
        const event = timelineMap.get(status);
        const isDone = idx < currentIndex || currentStatus === status;
        const isActive = status === currentStatus;
        const isFuture = idx > currentIndex;
        const isLast = idx === steps.length - 1;

        let iconColor = "#D1D5DB";
        let iconBg = "#F3F4F6";
        if (isActive && isCancelled) {
          iconColor = "#EF4444";
          iconBg = "#FEE2E2";
        } else if (isActive) {
          iconColor = "#FFFFFF";
          iconBg = COLORS.primary;
        } else if (isDone) {
          iconColor = COLORS.primary;
          iconBg = COLORS.primary + "18";
        }

        return (
          <View key={status} style={{ flexDirection: "row", gap: 14 }}>
            {/* Line + Icon column */}
            <View style={{ alignItems: "center", width: 36 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: iconBg,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialCommunityIcons
                  name={config.icon}
                  size={18}
                  color={iconColor}
                />
              </View>
              {!isLast && (
                <View
                  style={{
                    width: 2,
                    flex: 1,
                    minHeight: 24,
                    backgroundColor: isDone && !isFuture ? COLORS.primary + "30" : "#E5E7EB",
                    marginVertical: 3,
                  }}
                />
              )}
            </View>

            {/* Text column */}
            <View style={{ flex: 1, paddingBottom: isLast ? 0 : 20 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: isActive ? "PolySans-Bulky" : "PolySans-Median",
                  color: isFuture ? "#D1D5DB" : isActive && isCancelled ? "#EF4444" : "#111827",
                  marginTop: 8,
                }}
              >
                {config.label}
              </Text>
              {event && (
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: "PolySans-Neutral",
                    color: "#9CA3AF",
                    marginTop: 2,
                  }}
                >
                  {formatTime(toDate(event.timestamp))}
                  {event.note ? ` · ${event.note}` : ""}
                </Text>
              )}
              {isActive && !event && (
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: "PolySans-Neutral",
                    color: COLORS.primary,
                    marginTop: 2,
                  }}
                >
                  Now
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}
