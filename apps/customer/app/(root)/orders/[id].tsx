import BookingMapView from "@/components/map/BookingMapView";
import ChatInput from "@/components/tracking/ChatInput";
import OrderStatusTimeline from "@/components/tracking/OrderStatusTimeline";
import { COLORS } from "@/constants/theme";
import { formatNaira } from "@/lib/format";
import { useOrder } from "@/hooks/use-order";
import { useRider } from "@/hooks/use-rider";
import { useTracking } from "@/hooks/use-tracking";
import { Avatar, Header, Skeleton } from "@goshats/ui";
import { router, useLocalSearchParams } from "expo-router";
import {
  Box,
  Call,
  Category2,
  DocumentText,
  Location,
  Message,
  Reserve,
  Routing,
  Star,
} from "iconsax-react-native";
import React, { useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const LOAD_ICONS: Record<string, React.ReactNode> = {
  food: <Reserve size={32} color={COLORS.primary} variant="Bulk" />,
  parcel: <Box size={32} color={COLORS.primary} variant="Bulk" />,
  document: <DocumentText size={32} color={COLORS.primary} variant="Bulk" />,
  other: <Category2 size={32} color={COLORS.primary} variant="Bulk" />,
};

const ACTIVE_STATUSES = new Set([
  "pending",
  "accepted",
  "arrived_pickup",
  "picked_up",
  "in_transit",
]);

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
  const { order, isLoading } = useOrder(id ?? null);
  const rider = useRider(order?.riderId);
  const { latestPosition, messages, sendMessage } = useTracking(
    ACTIVE_STATUSES.has(order?.status ?? "") ? (id ?? null) : null
  );
  const [showChat, setShowChat] = useState(false);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F9FAFB]" edges={["top"]}>
        <Header title="Order" onBack={() => router.back()} />
        <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }} showsVerticalScrollIndicator={false}>
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
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center" edges={["top"]}>
        <Header title="Order" onBack={() => router.back()} />
        <Text style={{ fontFamily: "PolySans-Neutral", color: "#6B7280" }}>
          Order not found.
        </Text>
      </SafeAreaView>
    );
  }

  const isActive = ACTIVE_STATUSES.has(order.status);
  const statusColor = STATUS_COLORS[order.status] ?? "#6B7280";
  const unreadCount = messages.filter(
    (m) => m.senderRole === "rider" && !m.isRead
  ).length;

  const callRider = () => {
    if (rider?.phone) Linking.openURL(`tel:${rider.phone}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <Header title="Order Details" onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Live map — only when active and position known */}
        {isActive && (order.pickup.location || latestPosition) && (
          <View className="mx-5 mt-4 h-[200px] rounded-[24px] overflow-hidden border border-gray-100">
            <BookingMapView
              pickup={order.pickup.location}
              dropoff={order.dropoff.location}
              riderLocation={
                latestPosition
                  ? {
                      latitude: latestPosition.location.latitude,
                      longitude: latestPosition.location.longitude,
                    }
                  : undefined
              }
            />
          </View>
        )}

        {/* Status badge */}
        <View className="mx-5 mt-4 items-center">
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
        </View>

        {/* Rider card (only if assigned) */}
        {rider && (
          <View className="mx-5 mt-4 bg-white rounded-[24px] border border-gray-100 shadow-sm p-4">
            <View className="flex-row items-center gap-3">
              <Avatar uri={rider.profilePhotoUrl ?? undefined} name={`${rider.otherName} ${rider.surname}`} size="md" />
              <View className="flex-1">
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: "PolySans-Bulky",
                    color: "#111827",
                  }}
                >
                  {rider.otherName} {rider.surname}
                </Text>
                <View className="flex-row items-center gap-2 mt-1">
                  <Star size={12} color="#F59E0B" variant="Bold" />
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: "PolySans-Median",
                      color: "#6B7280",
                    }}
                  >
                    {rider.averageRating?.toFixed(1) ?? "—"} ·{" "}
                    {rider.vehicleModel ?? ""}{" "}
                    {rider.vehiclePlate ?? ""}
                  </Text>
                </View>
              </View>
              {isActive && (
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={callRider}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: COLORS.primary + "15",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Call size={18} color={COLORS.primary} variant="Bold" />
                  </Pressable>
                  <Pressable
                    onPress={() => setShowChat((v) => !v)}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: COLORS.primary + "15",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Message size={18} color={COLORS.primary} variant="Bold" />
                    {unreadCount > 0 && (
                      <View
                        style={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          width: 14,
                          height: 14,
                          borderRadius: 7,
                          backgroundColor: "#EF4444",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 9,
                            fontFamily: "PolySans-Bulky",
                            color: "#fff",
                          }}
                        >
                          {unreadCount}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                </View>
              )}
            </View>

            {/* Chat */}
            {showChat && isActive && (
              <View style={{ marginTop: 16 }}>
                {/* Messages */}
                {messages.length > 0 && (
                  <View style={{ marginBottom: 10, gap: 6 }}>
                    {messages.slice(-5).map((msg) => {
                      const isMe = msg.senderRole === "customer";
                      return (
                        <View
                          key={msg.id}
                          style={{
                            alignSelf: isMe ? "flex-end" : "flex-start",
                            backgroundColor: isMe
                              ? COLORS.primary
                              : "#F3F4F6",
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            borderRadius: 9999,
                            maxWidth: "80%",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 13,
                              fontFamily: "PolySans-Neutral",
                              color: isMe ? "#fff" : "#111827",
                            }}
                          >
                            {msg.text}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}
                <ChatInput onSend={sendMessage} />
              </View>
            )}
          </View>
        )}

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
            Delivery Route
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

        {/* Rate delivery button — delivered + not yet rated */}
        {order.status === "delivered" && !order.customerRatingId && (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/review/[id]",
                params: { id: order.id },
              } as any)
            }
            style={{
              marginHorizontal: 20,
              marginTop: 16,
              backgroundColor: COLORS.accent,
              borderRadius: 9999,
              paddingVertical: 16,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontFamily: "PolySans-Bulky",
                fontSize: 15,
                color: "#fff",
              }}
            >
              Rate your delivery
            </Text>
          </Pressable>
        )}

        {/* Pricing */}
        <View className="mx-5 mt-4 mb-4 bg-white rounded-[24px] border border-gray-100 shadow-sm p-5">
          <Text
            style={{
              fontSize: 13,
              fontFamily: "PolySans-Bulky",
              color: "#374151",
              marginBottom: 16,
            }}
          >
            Payment Breakdown
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
          <View className="flex-row justify-between mb-3">
            <Text
              style={{
                fontSize: 14,
                fontFamily: "PolySans-Neutral",
                color: "#6B7280",
              }}
            >
              Booking fee
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontFamily: "PolySans-Median",
                color: "#111827",
              }}
            >
              {formatNaira(order.bookingFeeKobo)}
            </Text>
          </View>
          {order.promoDiscountKobo > 0 && (
            <View className="flex-row justify-between mb-3">
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "PolySans-Neutral",
                  color: COLORS.success,
                }}
              >
                Promo
                {order.promoCode ? ` (${order.promoCode})` : ""}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "PolySans-Median",
                  color: COLORS.success,
                }}
              >
                −{formatNaira(order.promoDiscountKobo)}
              </Text>
            </View>
          )}
          {order.referralCreditsAppliedKobo > 0 && (
            <View className="flex-row justify-between mb-3">
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "PolySans-Neutral",
                  color: COLORS.success,
                }}
              >
                Referral credits
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "PolySans-Median",
                  color: COLORS.success,
                }}
              >
                −{formatNaira(order.referralCreditsAppliedKobo)}
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
              Total
            </Text>
            <Text
              style={{
                fontSize: 20,
                fontFamily: "PolySans-Bulky",
                color: "#111827",
              }}
            >
              {formatNaira(order.totalAmountKobo)}
            </Text>
          </View>
          <Text
            style={{
              fontSize: 12,
              fontFamily: "PolySans-Neutral",
              color: "#9CA3AF",
              marginTop: 6,
              textAlign: "right",
            }}
          >
            {order.paymentMethod === "card" ? "Paid by card" : "Cash on delivery"} ·{" "}
            {order.paymentStatus}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
