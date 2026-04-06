import PostDeliveryPanel from "@/components/tracking/PostDeliveryPanel";
import { COLORS } from "@/constants/theme";
import { useOrder } from "@/hooks/use-order";
import { useRider } from "@/hooks/use-rider";
import { useOrderStore } from "@/store/order-store";
import { usePricingStore } from "@/store/pricing-store";
import {
  addTip,
  createRating,
  setOrderCustomerRating,
} from "@goshats/firebase";
import { useAuthStore } from "@/store/auth-store";
import { Header } from "@goshats/ui";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { order, isLoading } = useOrder(id ?? null);
  const rider = useRider(order?.riderId);
  const { user } = useAuthStore();
  const { clearActiveOrder } = useOrderStore();
  const tipOptionsKobo = usePricingStore((s) => s.settings.tipOptionsKobo);

  const handleSubmit = async (
    stars: number,
    review: string,
    _tipAmountKobo: number,
  ) => {
    if (!order || !user) return;
    const ratingId = await createRating({
      orderId: order.id,
      raterRole: "customer",
      raterId: user.uid,
      ratedId: order.riderId ?? "",
      stars,
      review: review || null,
      tipAmountKobo: 0, // Tips disabled for MVP
    });
    await setOrderCustomerRating(order.id, ratingId);
    // if (tipAmountKobo > 0) await addTip(order.id, tipAmountKobo); // Tips disabled for MVP
    clearActiveOrder();
    router.replace("/(tabs)" as any);
  };

  const handleSkip = () => {
    clearActiveOrder();
    router.replace("/(tabs)" as any);
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "#F9FAFB", alignItems: "center", justifyContent: "center" }}
        edges={["top"]}
      >
        <ActivityIndicator color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (!order || order.status !== "delivered") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }} edges={["top"]}>
        <Header title="Rate delivery" onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontFamily: "PolySans-Neutral", color: "#6B7280" }}>
            This order cannot be reviewed.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (order.customerRatingId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }} edges={["top"]}>
        <Header title="Rate delivery" onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <Text
            style={{
              fontFamily: "PolySans-Bulky",
              fontSize: 18,
              color: "#111827",
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            Already reviewed
          </Text>
          <Text
            style={{
              fontFamily: "PolySans-Neutral",
              fontSize: 14,
              color: "#6B7280",
              textAlign: "center",
            }}
          >
            You've already submitted a rating for this delivery.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }} edges={["top"]}>
      <Header title="Rate delivery" onBack={() => router.back()} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <PostDeliveryPanel
          riderName={rider ? rider.otherName : "your rider"}
          paymentMethod={order.paymentMethod}
          tipOptionsKobo={tipOptionsKobo}
          onSubmit={handleSubmit}
          onSkip={handleSkip}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
