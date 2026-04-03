import TrackingMapView from "@/components/map/TrackingMapView";
import OrderStatusTimeline from "@/components/tracking/OrderStatusTimeline";
import { COLORS } from "@/constants/theme";
import { useOrder } from "@/hooks/use-order";
import { useRider } from "@/hooks/use-rider";
import { formatNaira } from "@/lib/format";
import { useAuthStore } from "@/store/auth-store";
import { useOrderStore } from "@/store/order-store";
import { cancelOrder } from "@goshats/firebase";
import { Avatar } from "@goshats/ui";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Call, Message, Star1 } from "iconsax-react-native";
import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ACTIVE_STATUSES = new Set([
  "pending",
  "accepted",
  "arrived_pickup",
  "picked_up",
  "in_transit",
]);

const STATUS_LABELS: Record<string, string> = {
  pending: "Waiting for rider",
  accepted: "Rider en route",
  arrived_pickup: "Rider at pickup",
  picked_up: "Package picked up",
  in_transit: "On the way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function TrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { order, isLoading } = useOrder(id ?? null);
  const rider = useRider(order?.riderId);
  const [cancelling, setCancelling] = useState(false);
  const { clearActiveOrder } = useOrderStore();
  const { user } = useAuthStore();

  const isActive = ACTIVE_STATUSES.has(order?.status ?? "");
  const isDelivered = order?.status === "delivered";
  const alreadyRated = !!order?.customerRatingId;

  const handleDone = () => {
    clearActiveOrder();
    router.replace("/(tabs)" as any);
  };

  // 30-minute auto-cancellation for pending orders
  useEffect(() => {
    if (!order || order.status !== "pending") return;

    const createdAt = order.createdAt;
    let createdTime = 0;
    if (createdAt && typeof (createdAt as any).toMillis === "function") {
      createdTime = (createdAt as any).toMillis();
    } else if (createdAt instanceof Date) {
      createdTime = createdAt.getTime();
    }

    if (!createdTime) return;

    let timer: NodeJS.Timeout;

    const checkTime = async () => {
      const elapsed = Date.now() - createdTime;
      const thirtyMins = 30 * 60 * 1000;

      if (elapsed >= thirtyMins) {
        try {
          await cancelOrder(order.id, "No rider available within 30 minutes");
          Alert.alert(
            "Order Auto-Cancelled",
            "No riders were available to accept your order. Please try again later."
          );
        } catch {
          Alert.alert(
            "Cancellation Failed",
            "Your order could not be auto-cancelled. Please contact support."
          );
        }
      } else {
        timer = setTimeout(checkTime, thirtyMins - elapsed);
      }
    };

    checkTime();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [order, order?.status, order?.createdAt, order?.id]);

  if (isLoading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#F9FAFB",
          alignItems: "center",
          justifyContent: "center",
        }}
        edges={["top"]}
      >
        <ActivityIndicator color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  const notFoundScreen = (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }} edges={["top"]}>
      <Pressable
        onPress={() => router.back()}
        style={{
          margin: 20, width: 40, height: 40, borderRadius: 20,
          backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
          borderWidth: 1, borderColor: "#F3F4F6",
        }}
      >
        <ArrowLeft size={20} color="#111827" />
      </Pressable>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontFamily: "PolySans-Neutral", color: "#6B7280" }}>
          Order not found.
        </Text>
      </View>
    </SafeAreaView>
  );

  if (!order) return notFoundScreen;

  // Prevent users from viewing orders that don't belong to them
  if (user && order.customerId !== user.uid) return notFoundScreen;

  const handleCancel = () => {
    Alert.alert("Cancel Order", "Are you sure you want to cancel this order?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          setCancelling(true);
          try {
            await cancelOrder(order.id, "Cancelled by customer");
            router.back();
          } catch {
            Alert.alert("Error", "Could not cancel order. Try again.");
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      {/* Map — 55% */}
      <View style={{ height: "55%" }}>
        <TrackingMapView
          orderId={id ?? null}
          destination={order.dropoff.location}
          pickup={order.pickup.location}
          status={order.status}
          riderLocation={rider?.currentLocation ?? undefined}
        />

        {/* Back button overlaid on map */}
        <SafeAreaView
          edges={["top"]}
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              margin: 16,
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: "#fff",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 6,
              elevation: 4,
            }}
          >
            <ArrowLeft size={20} color="#111827" />
          </Pressable>
        </SafeAreaView>
      </View>

      {/* Bottom content — 45% scrollable */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Delivered state */}
        {isDelivered && (
          <View style={{ padding: 20 }}>
            <View
              style={{
                backgroundColor: COLORS.primary,
                borderRadius: 24,
                padding: 20,
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: "PolySans-Bulky",
                  color: "rgba(255,255,255,0.6)",
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                  marginBottom: 4,
                }}
              >
                Delivered
              </Text>
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: "PolySans-Bulky",
                  color: "#FFFFFF",
                }}
              >
                Package delivered!
              </Text>
            </View>

            {!alreadyRated && (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/review/[id]",
                    params: { id: id ?? "" },
                  } as any)
                }
                style={{
                  backgroundColor: COLORS.accent,
                  borderRadius: 9999,
                  paddingVertical: 16,
                  alignItems: "center",
                  marginBottom: 12,
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

            <Pressable
              onPress={handleDone}
              style={{ alignItems: "center", paddingVertical: 8 }}
            >
              <Text
                style={{
                  fontFamily: "PolySans-Neutral",
                  fontSize: 13,
                  color: "#9CA3AF",
                }}
              >
                {alreadyRated ? "Go to home" : "Skip for now"}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Active order content */}
        {!isDelivered && (
          <View style={{ padding: 20 }}>
        {/* Status + address card */}
        <View
          style={{
            backgroundColor: "#1A1A1A",
            borderRadius: 24,
            padding: 18,
            marginBottom: 14,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontFamily: "PolySans-Bulky",
              color: COLORS.primary,
              textTransform: "uppercase",
              letterSpacing: 1.5,
              marginBottom: 6,
            }}
          >
            {STATUS_LABELS[order.status] ?? order.status.replace(/_/g, " ")}
          </Text>
          <Text
            style={{
              fontSize: 16,
              fontFamily: "PolySans-Bulky",
              color: "#FFFFFF",
              marginBottom: 6,
            }}
            numberOfLines={2}
          >
            {order.dropoff.address}
          </Text>
          <Text
            style={{
              fontSize: 12,
              fontFamily: "PolySans-Neutral",
              color: "rgba(255,255,255,0.45)",
            }}
          >
            {formatNaira(order.totalAmountKobo)} ·{" "}
            {order.estimatedDurationSeconds
              ? `${Math.round(order.estimatedDurationSeconds / 60)} min`
              : "—"}{" "}
            ·{" "}
            {order.paymentMethod === "card"
              ? "Paid by card"
              : "Cash on delivery"}
          </Text>
        </View>

        {/* Rider card */}
        {rider && (
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 24,
              padding: 16,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: "#F3F4F6",
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <Avatar
              uri={rider.profilePhotoUrl ?? undefined}
              name={`${rider.otherName} ${rider.surname}`}
              size="md"
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 15,
                  fontFamily: "PolySans-Bulky",
                  color: "#111827",
                }}
              >
                {rider.otherName} {rider.surname}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  marginTop: 3,
                }}
              >
                <Star1 size={11} color="#F59E0B" variant="Bold" />
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: "PolySans-Median",
                    color: "#6B7280",
                  }}
                >
                  {rider.averageRating?.toFixed(1) ?? "—"} ·{" "}
                  {rider.vehicleModel ?? ""} {rider.vehiclePlate ?? ""}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {isActive && (
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/(tracking)/chat",
                      params: { orderId: id ?? "" },
                    } as any)
                  }
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: COLORS.primary + "15",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Message size={20} color={COLORS.primary} variant="Bold" />
                </Pressable>
              )}
              {isActive && (
                <Pressable
                  onPress={() =>
                    rider.phone && Linking.openURL(`tel:${rider.phone}`)
                  }
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: "#F3F4F6",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Call size={20} color="#374151" variant="Bold" />
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* Status timeline */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 24,
            padding: 16,
            marginBottom: 14,
            borderWidth: 1,
            borderColor: "#F3F4F6",
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontFamily: "PolySans-Bulky",
              color: "#9CA3AF",
              textTransform: "uppercase",
              letterSpacing: 1,
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

        {/* Cancel button — pending only */}
        {order.status === "pending" && (
          <Pressable
            onPress={handleCancel}
            disabled={cancelling}
            style={{
              borderRadius: 9999,
              paddingVertical: 14,
              borderWidth: 1.5,
              borderColor: "#EF4444",
              alignItems: "center",
              marginTop: 4,
              marginBottom: Platform.OS === "ios" ? 0 : 30,
            }}
          >
            {cancelling ? (
              <ActivityIndicator color="#EF4444" />
            ) : (
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "PolySans-Bulky",
                  color: "#EF4444",
                }}
              >
                Cancel Order
              </Text>
            )}
          </Pressable>
        )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
