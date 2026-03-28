import SwipeToConfirm from "@/components/booking/SwipeToConfirm";
import BookingMapView from "@/components/map/BookingMapView";
import { COLORS } from "@/constants/theme";
import { formatDistance, formatDuration, formatNaira } from "@/lib/format";
import { useAuthStore } from "@/store/auth-store";
import { useBookingStore } from "@/store/booking-store";
import { createOrder, getPromoCode, getPromoUsage } from "@goshats/firebase";
import { Header } from "@goshats/ui";
import { router } from "expo-router";
import { Timestamp } from "firebase/firestore";
import {
  Box1,
  CloseCircle,
  PercentageCircle,
  Routing2,
  TickCircle,
  Timer1,
  Wallet2,
} from "iconsax-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

export default function SummaryScreen() {
  const booking = useBookingStore();
  const { user, userProfile } = useAuthStore();

  const [promoInput, setPromoInput] = useState("");
  const [showPromo, setShowPromo] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [useCredits, setUseCredits] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    pickup,
    dropoff,
    extraStops,
    loadType,
    loadDescription,
    isHighValue,
    declaredValueKobo,
    selectedRiderId,
    selectedRiderTier,
    tierMultiplier,
    fareAmountKobo,
    bookingFeeKobo,
    promoDiscountKobo,
    totalAmountKobo,
    estimatedDistanceMeters,
    estimatedDurationSeconds,
    isScheduled,
    scheduledPickupAt,
    resetBooking,
  } = booking;

  const referralCredits = userProfile?.referralCredits ?? 0;
  const subtotal = fareAmountKobo + bookingFeeKobo;

  // Credits applied = min(credits, remaining after promo)
  const creditsApplied =
    useCredits && referralCredits > 0
      ? Math.min(referralCredits, Math.max(0, subtotal - promoDiscountKobo))
      : 0;

  const finalTotal = Math.max(0, totalAmountKobo - creditsApplied);

  const handleApplyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    if (!user) return;

    setPromoError(null);
    setApplyingPromo(true);

    try {
      const promo = await getPromoCode(code);

      if (!promo) {
        setPromoError("Invalid promo code");
        return;
      }

      if (!promo.isActive) {
        setPromoError("This promo code is no longer active");
        return;
      }

      if (promo.expiresAt.toDate() < new Date()) {
        setPromoError("This promo code has expired");
        return;
      }

      if (promo.usedCount >= promo.usageLimit) {
        setPromoError("This promo code has reached its usage limit");
        return;
      }

      if (subtotal < promo.minOrderKobo) {
        setPromoError(
          `Minimum order of ${formatNaira(promo.minOrderKobo)} required`,
        );
        return;
      }

      // Check per-user usage
      const usage = await getPromoUsage(code, user.uid);
      if (usage && usage.usedCount >= promo.perUserLimit) {
        setPromoError("You've already used this promo code");
        return;
      }

      // Calculate discount
      let discountKobo: number;
      if (promo.discountType === "fixed") {
        discountKobo = promo.discountValueKobo;
      } else {
        // percentage
        discountKobo = Math.round(subtotal * (promo.discountValueKobo / 100));
        if (promo.maxDiscountKobo != null) {
          discountKobo = Math.min(discountKobo, promo.maxDiscountKobo);
        }
      }

      // Don't discount more than the subtotal
      discountKobo = Math.min(discountKobo, subtotal);

      booking.setPromo(code, discountKobo);
      setShowPromo(false);
      setPromoInput("");
    } catch {
      setPromoError("Something went wrong. Try again.");
    } finally {
      setApplyingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    booking.clearPromo();
    setPromoInput("");
    setPromoError(null);
  };

  const handleConfirmOrder = async () => {
    if (!user || !pickup || !dropoff || !selectedRiderId || !loadType) return;

    setIsSubmitting(true);
    try {
      await createOrder({
        customerId: user.uid,
        riderId: selectedRiderId,
        loadType,
        loadDescription: loadDescription || "",
        isHighValue,
        declaredValueKobo,
        isMultiStop: extraStops.length > 0,
        pickup,
        dropoff,
        isScheduled,
        scheduledPickupAt: scheduledPickupAt
          ? Timestamp.fromDate(scheduledPickupAt)
          : null,
        riderTier: selectedRiderTier,
        tierMultiplier,
        fareAmountKobo,
        bookingFeeKobo,
        promoDiscountKobo,
        tipAmountKobo: 0,
        totalAmountKobo: finalTotal,
        promoCode: booking.promoCode,
        status: "pending",
        conditionAtPickup: null,
        timeline: [],
        paymentStatus: "pending",
        paymentMethod: creditsApplied > 0 ? "referral_credits" : "card",
        paystackReference: null,
        estimatedDistanceMeters,
        estimatedDurationSeconds,
        actualPickupAt: null,
        actualDeliveryAt: null,
        hasDispute: false,
        customerRatingId: null,
        riderRatingId: null,
      });

      resetBooking();
      Alert.alert("Order Placed!", "Your delivery request has been sent.", [
        {
          text: "OK",
          onPress: () => router.replace("/(root)/(tabs)" as any),
        },
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to place order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadTypeLabels: Record<string, string> = {
    food: "Food",
    parcel: "Parcel",
    document: "Document",
    other: "Other",
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <Header title="Order summary" onBack={() => router.back()} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Map preview */}
          {pickup?.location && dropoff?.location && (
            <View className="mx-5 mt-4 h-[180px] rounded-[24px] overflow-hidden border border-gray-100 shadow-sm">
              <BookingMapView
                pickup={pickup.location}
                dropoff={dropoff.location}
                waypoints={extraStops.map((s) => s.location)}
              />
            </View>
          )}

          {/* Locations card */}
          <View className="mx-5 mt-4 bg-white rounded-[24px] border border-gray-100 shadow-sm p-5">
            {/* Pickup */}
            <View className="flex-row items-start">
              <View className="w-3 h-3 rounded-full bg-primary border-2 border-primary/30 mt-1 mr-3" />
              <View className="flex-1">
                <Text className="font-sans-medium text-[10px] text-gray-400 uppercase tracking-wider">
                  Pickup
                </Text>
                <Text
                  className="font-sans-semibold text-sm text-gray-900 mt-0.5"
                  numberOfLines={2}
                >
                  {pickup?.address || "—"}
                </Text>
              </View>
            </View>

            <View className="w-0.5 h-4 bg-gray-200 ml-[5px] my-1" />

            {/* Dropoff */}
            <View className="flex-row items-start">
              <View className="w-3 h-3 rounded-full bg-accent border-2 border-accent/30 mt-1 mr-3" />
              <View className="flex-1">
                <Text className="font-sans-medium text-[10px] text-gray-400 uppercase tracking-wider">
                  Dropoff
                </Text>
                <Text
                  className="font-sans-semibold text-sm text-gray-900 mt-0.5"
                  numberOfLines={2}
                >
                  {dropoff?.address || "—"}
                </Text>
              </View>
            </View>

            {/* Route stats */}
            {estimatedDistanceMeters > 0 && (
              <View className="flex-row items-center mt-4 pt-4 border-t border-gray-100 gap-5">
                <View className="flex-row items-center gap-1.5">
                  <Routing2 size={16} color="#6B7280" variant="TwoTone" />
                  <Text className="font-sans-semibold text-sm text-gray-700">
                    {formatDistance(estimatedDistanceMeters)}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <Timer1 size={16} color={COLORS.primary} variant="TwoTone" />
                  <Text className="font-sans-semibold text-sm text-primary">
                    ~{formatDuration(estimatedDurationSeconds)}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Package info */}
          <View className="mx-5 mt-4 bg-white rounded-[24px] border border-gray-100 shadow-sm p-5">
            <View className="flex-row items-center">
              <Box1 size={20} color={COLORS.primary} variant="Bold" />
              <Text className="font-sans-bold text-sm text-gray-900 ml-2">
                {loadType ? loadTypeLabels[loadType] : "—"}
              </Text>
              {isHighValue && (
                <View className="bg-accent/10 rounded-full px-2.5 py-0.5 ml-2">
                  <Text className="font-sans-medium text-[10px] text-accent">
                    HIGH VALUE
                  </Text>
                </View>
              )}
            </View>
            {loadDescription ? (
              <Text className="font-sans text-sm text-gray-500 mt-2">
                {loadDescription}
              </Text>
            ) : null}
          </View>

          {/* Pricing breakdown */}
          <View className="mx-5 mt-4 bg-white rounded-[24px] border border-gray-100 shadow-sm p-5">
            <Text className="font-sans-bold text-sm text-gray-900 mb-4">
              Price breakdown
            </Text>

            <View className="flex-row justify-between items-center mb-2.5">
              <Text className="font-sans text-sm text-gray-500">
                Delivery fare ({selectedRiderTier})
              </Text>
              <Text className="font-sans-semibold text-sm text-gray-900">
                {formatNaira(fareAmountKobo)}
              </Text>
            </View>

            <View className="flex-row justify-between items-center mb-2.5">
              <Text className="font-sans text-sm text-gray-500">
                Booking fee
              </Text>
              <Text className="font-sans-semibold text-sm text-gray-900">
                {formatNaira(bookingFeeKobo)}
              </Text>
            </View>

            {/* Applied promo discount */}
            {promoDiscountKobo > 0 && (
              <View className="flex-row justify-between items-center mb-2.5">
                <View className="flex-row items-center flex-1">
                  <Text className="font-sans text-sm text-success">
                    Promo ({booking.promoCode})
                  </Text>
                  <Pressable
                    onPress={handleRemovePromo}
                    style={{ marginLeft: 6, opacity: 0.7 }}
                  >
                    <CloseCircle size={14} color="#EF4444" variant="Bold" />
                  </Pressable>
                </View>
                <Text className="font-sans-semibold text-sm text-success">
                  −{formatNaira(promoDiscountKobo)}
                </Text>
              </View>
            )}

            {/* Referral credits applied */}
            {creditsApplied > 0 && (
              <View className="flex-row justify-between items-center mb-2.5">
                <Text className="font-sans text-sm text-success">
                  Referral credits
                </Text>
                <Text className="font-sans-semibold text-sm text-success">
                  −{formatNaira(creditsApplied)}
                </Text>
              </View>
            )}

            <View className="border-t border-gray-100 mt-2 pt-3 flex-row justify-between items-center">
              <Text className="font-sans-bold text-base text-gray-900">
                Total
              </Text>
              <Text className="font-sans-bold text-lg text-gray-900">
                {formatNaira(finalTotal)}
              </Text>
            </View>

            {/* Promo code section */}
            {booking.promoCode ? null : !showPromo ? (
              <Pressable
                onPress={() => {
                  setShowPromo(true);
                  setPromoError(null);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 16,
                  opacity: 0.9,
                }}
              >
                <PercentageCircle
                  size={16}
                  color={COLORS.primary}
                  variant="TwoTone"
                />
                <Text className="font-sans-medium text-sm text-primary ml-1.5">
                  Add promo code
                </Text>
              </Pressable>
            ) : (
              <View className="mt-4">
                <View className="flex-row items-center gap-2">
                  <View className="flex-1 bg-gray-50 rounded-full px-4 border border-gray-100">
                    <TextInput
                      style={{
                        fontFamily: "PolySans-Neutral",
                        fontSize: 13,
                        color: "#111827",
                        paddingVertical: 10,
                      }}
                      placeholder="Enter promo code"
                      placeholderTextColor="#9CA3AF"
                      value={promoInput}
                      onChangeText={(text) => {
                        setPromoInput(text);
                        setPromoError(null);
                      }}
                      autoCapitalize="characters"
                      autoFocus
                      editable={!applyingPromo}
                      onSubmitEditing={handleApplyPromo}
                      returnKeyType="done"
                    />
                  </View>
                  <Pressable
                    onPress={handleApplyPromo}
                    disabled={applyingPromo || !promoInput.trim()}
                    style={{
                      backgroundColor:
                        applyingPromo || !promoInput.trim()
                          ? "#E5E7EB"
                          : COLORS.primary,
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 9999,
                    }}
                  >
                    {applyingPromo ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text className="font-sans-bold text-sm text-white">
                        Apply
                      </Text>
                    )}
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setShowPromo(false);
                      setPromoError(null);
                      setPromoInput("");
                    }}
                    style={{ padding: 4 }}
                  >
                    <CloseCircle size={20} color="#9CA3AF" variant="Bold" />
                  </Pressable>
                </View>
                {promoError && (
                  <Text className="font-sans text-xs text-red-500 mt-2 ml-4">
                    {promoError}
                  </Text>
                )}
              </View>
            )}

            {/* Referral credits toggle */}
            {referralCredits > 0 && (
              <Pressable
                onPress={() => setUseCredits(!useCredits)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 16,
                  paddingTop: 16,
                  borderTopWidth: 1,
                  borderTopColor: "#F3F4F6",
                }}
              >
                <View className="flex-row items-center flex-1">
                  <Wallet2 size={16} color={COLORS.primary} variant="TwoTone" />
                  <View className="ml-2 flex-1">
                    <Text className="font-sans-medium text-sm text-gray-900">
                      Use referral credits
                    </Text>
                    <Text className="font-sans text-xs text-gray-500">
                      Balance: {formatNaira(referralCredits)}
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: 2,
                    borderColor: useCredits ? COLORS.primary : "#D1D5DB",
                    backgroundColor: useCredits
                      ? COLORS.primary
                      : "transparent",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {useCredits && (
                    <TickCircle size={14} color="#FFFFFF" variant="Bold" />
                  )}
                </View>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Swipe to confirm */}
      <View
        className="px-5 pt-4 bg-gray-50 border-t border-gray-100"
        style={{ paddingBottom: Platform.OS === "ios" ? 36 : 52 }}
      >
        {finalTotal > 0 && (
          <Text className="font-sans-bold text-center text-base text-gray-900 mb-3">
            {formatNaira(finalTotal)}
          </Text>
        )}
        <SwipeToConfirm
          onConfirm={handleConfirmOrder}
          label={finalTotal === 0 ? "Swipe to confirm" : "Swipe to pay"}
          disabled={isSubmitting}
          loading={isSubmitting}
        />
      </View>
    </SafeAreaView>
  );
}
