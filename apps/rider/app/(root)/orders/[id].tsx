import BookingMapView from "@/components/map/BookingMapView";
import OrderStatusTimeline from "@/components/tracking/OrderStatusTimeline";
import { COLORS } from "@/constants/theme";
import { formatNaira } from "@/lib/format";
import { listenToOrder } from "@goshats/firebase/src/firestore/orders";
import type { Order } from "@goshats/types";
import { Header, Skeleton } from "@goshats/ui";
import { router, useLocalSearchParams } from "expo-router";
import {
  Box,
  Category2,
  DocumentText,
  Location,
  Reserve,
  Routing,
} from "iconsax-react-native";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const LOAD_ICONS: Record<string, React.ReactNode> = {
  food: <Reserve size={32} color={COLORS.primary} variant="Bulk" />,
  parcel: <Box size={32} color={COLORS.primary} variant="Bulk" />,
  document: <DocumentText size={32} color={COLORS.primary} variant="Bulk" />,
  other: <Category2 size={32} color={COLORS.primary} variant="Bulk" />,
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#F59E0B",
  accepted: COLORS.primary,
  arrived_pickup: COLORS.primary,
  picked_up: COLORS.primary,
  in_transit: COLORS.primary,
  delivered: COLORS.success,
  cancelled: "#EF4444",
};

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Simple real-time listener for the order
  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    const unsub = listenToOrder(id, (data) => {
      setOrder(data);
      setIsLoading(false);
    });
    return () => unsub();
  }, [id]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F9FAFB]" edges={["top"]}>
        <Header title="Order" onBack={() => router.back()} />
        <ScrollView
          contentContainerStyle={{ padding: 20, gap: 12 }}
          showsVerticalScrollIndicator={false}
        >
          <Skeleton height={180} borderRadius={24} />
          <Skeleton height={80} borderRadius={20} />
          <Skeleton height={120} borderRadius={20} />
          <Skeleton height={100} borderRadius={20} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView
        className="flex-1 bg-gray-50 items-center justify-center"
        edges={["top"]}
      >
        <Header title="Order" onBack={() => router.back()} />
        <Text style={{ fontFamily: "PolySans-Neutral", color: "#6B7280" }}>
          Order not found.
        </Text>
      </SafeAreaView>
    );
  }

  const statusColor = STATUS_COLORS[order.status] ?? "#6B7280";

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <Header title="Delivery Details" onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Static map preview showing Route */}
        {order.pickup.location && order.dropoff.location && (
          <View className="mx-5 mt-4 h-[200px] rounded-[24px] overflow-hidden border border-gray-100">
            <BookingMapView
              pickup={order.pickup.location}
              dropoff={order.dropoff.location}
            />
          </View>
        )}

        {/* Status badge */}
        <View className="mx-5 mt-4 items-center flex-row justify-center gap-2">
          <View
            style={{
              backgroundColor: statusColor + "18",
              paddingHorizontal: 16,
              paddingVertical: 6,
              borderRadius: 999,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontFamily: "PolySans-Bulky",
                color: statusColor,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              {order.status.replace(/_/g, " ")}
            </Text>
          </View>

          <Text
            style={{
              fontFamily: "PolySans-Neutral",
              fontSize: 13,
              color: "#9CA3AF",
            }}
          >
            ID: {order.id.slice(-6).toUpperCase()}
          </Text>
        </View>

        {/* Status timeline */}
        <View className="mx-5 mt-4 bg-white rounded-[24px] border border-gray-100 shadow-sm p-5">
          <Text
            style={{
              fontSize: 13,
              fontFamily: "PolySans-Bulky",
              color: "#374151",
              marginBottom: 16,
            }}
          >
            Delivery Progress
          </Text>
          <OrderStatusTimeline
            currentStatus={order.status}
            timeline={order.timeline}
          />
        </View>

        {/* Route */}
        <View className="mx-5 mt-4 bg-white rounded-[24px] border border-gray-100 shadow-sm p-5">
          <Text
            style={{
              fontSize: 13,
              fontFamily: "PolySans-Bulky",
              color: "#374151",
              marginBottom: 16,
            }}
          >
            Route Information
          </Text>
          <View className="flex-row items-start mb-4">
            <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-3">
              <Location size={16} color={COLORS.primary} variant="Bold" />
            </View>
            <View className="flex-1">
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: "PolySans-Bulky",
                  color: "#9CA3AF",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 2,
                }}
              >
                Pickup
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "PolySans-Median",
                  color: "#111827",
                }}
              >
                {order.pickup.address}
              </Text>
              {order.pickup.contactName ? (
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: "PolySans-Neutral",
                    color: "#6B7280",
                    marginTop: 2,
                  }}
                >
                  {order.pickup.contactName}
                  {order.pickup.contactPhone
                    ? ` · ${order.pickup.contactPhone}`
                    : ""}
                </Text>
              ) : null}
            </View>
          </View>

          <View className="w-0.5 h-4 bg-gray-200 ml-4 mb-4" />

          <View className="flex-row items-start">
            <View className="w-8 h-8 rounded-full bg-accent/10 items-center justify-center mr-3">
              <Routing size={16} color={COLORS.accent} variant="Bold" />
            </View>
            <View className="flex-1">
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: "PolySans-Bulky",
                  color: "#9CA3AF",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 2,
                }}
              >
                Dropoff
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "PolySans-Median",
                  color: "#111827",
                }}
              >
                {order.dropoff.address}
              </Text>
              {order.dropoff.contactName ? (
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: "PolySans-Neutral",
                    color: "#6B7280",
                    marginTop: 2,
                  }}
                >
                  {order.dropoff.contactName}
                  {order.dropoff.contactPhone
                    ? ` · ${order.dropoff.contactPhone}`
                    : ""}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Package */}
        <View className="mx-5 mt-4 bg-white rounded-[24px] border border-gray-100 shadow-sm p-5">
          <View className="flex-row items-center gap-3 mb-2">
            {LOAD_ICONS[order.loadType]}
            <Text
              style={{
                fontSize: 15,
                fontFamily: "PolySans-Bulky",
                color: "#111827",
                textTransform: "capitalize",
              }}
            >
              {order.loadType}
            </Text>
            {order.isHighValue && (
              <View
                style={{
                  backgroundColor: "#FEF3C7",
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontFamily: "PolySans-Bulky",
                    color: "#D97706",
                  }}
                >
                  HIGH VALUE
                </Text>
              </View>
            )}
          </View>
          {order.loadDescription ? (
            <Text
              style={{
                fontSize: 13,
                fontFamily: "PolySans-Neutral",
                color: "#6B7280",
              }}
            >
              {order.loadDescription}
            </Text>
          ) : null}
        </View>

        {/* Pricing for Rider */}
        <View className="mx-5 mt-4 mb-4 bg-white rounded-[24px] border border-gray-100 shadow-sm p-5">
          <Text
            style={{
              fontSize: 13,
              fontFamily: "PolySans-Bulky",
              color: "#374151",
              marginBottom: 16,
            }}
          >
            Your Earnings
          </Text>

          <View className="flex-row justify-between mb-3">
            <Text
              style={{
                fontSize: 14,
                fontFamily: "PolySans-Neutral",
                color: "#6B7280",
              }}
            >
              Delivery fare
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontFamily: "PolySans-Median",
                color: "#111827",
              }}
            >
              {formatNaira(order.fareAmountKobo)}
            </Text>
          </View>

          {order.tipAmountKobo > 0 && (
            <View className="flex-row justify-between mb-3">
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "PolySans-Neutral",
                  color: COLORS.success,
                }}
              >
                Customer Tip
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "PolySans-Median",
                  color: COLORS.success,
                }}
              >
                +{formatNaira(order.tipAmountKobo)}
              </Text>
            </View>
          )}

          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: "#F3F4F6",
              marginTop: 4,
              paddingTop: 12,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontFamily: "PolySans-Bulky",
                color: "#111827",
              }}
            >
              Total Earned
            </Text>
            <Text
              style={{
                fontSize: 20,
                fontFamily: "PolySans-Bulky",
                color: COLORS.primary,
              }}
            >
              {formatNaira(order.fareAmountKobo + (order.tipAmountKobo || 0))}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
