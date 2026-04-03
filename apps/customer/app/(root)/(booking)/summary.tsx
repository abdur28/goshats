import PaymentSelector from "@/components/booking/PaymentSelector";
import SwipeToConfirm from "@/components/booking/SwipeToConfirm";
import BookingMapView from "@/components/map/BookingMapView";
import PaystackPaymentModal, {
  CardDetails,
} from "@/components/payment/PaystackPaymentModal";
import { COLORS } from "@/constants/theme";
import { formatDistance, formatDuration, formatNaira } from "@/lib/format";
import { generatePaystackReference } from "@/lib/paystack";
import { useAuthStore } from "@/store/auth-store";
import { useBookingStore } from "@/store/booking-store";
import {
  createOrder,
  cancelOrder,
  getPaymentMethods,
  getPromoCode,
  getPromoUsage,
  functions,
} from "@goshats/firebase";
import { httpsCallable } from "firebase/functions";
import type { PaymentMethod } from "@goshats/types";
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
import React, { useEffect, useState } from "react";
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

  // ─── Promo ─────────────────────────────────────────────────────────────────
  const [promoInput, setPromoInput] = useState("");
  const [showPromo, setShowPromo] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [useCredits, setUseCredits] = useState(false);

  // ─── Payment ───────────────────────────────────────────────────────────────
  const [checkoutMethod, setCheckoutMethod] = useState<"cash" | "card">("cash");
  const [savedCards, setSavedCards] = useState<PaymentMethod[]>([]);
  const [selectedCard, setSelectedCard] = useState<PaymentMethod | null>(null);
  const [showPaystackModal, setShowPaystackModal] = useState(false);

  // ─── Card save preference ──────────────────────────────────────────────────
  const [saveCard, setSaveCard] = useState(true);

  // ─── Order ─────────────────────────────────────────────────────────────────
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

  // ─── Load saved cards ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    getPaymentMethods(user.uid).then((cards) => {
      setSavedCards(cards);
      const primary = cards.find((c) => c.isPrimary) ?? cards[0] ?? null;
      setSelectedCard(primary);
    });
  }, [user]);

  // ─── Pricing ────────────────────────────────────────────────────────────────
  const referralCredits = userProfile?.referralCredits ?? 0;
  const subtotal = fareAmountKobo + bookingFeeKobo;
  // Credits cannot reduce the order by more than 50% of subtotal
  const maxCreditsKobo = Math.floor(subtotal / 2);
  const creditsApplied =
    useCredits && referralCredits > 0
      ? Math.min(
          referralCredits,
          Math.max(0, subtotal - promoDiscountKobo),
          maxCreditsKobo,
        )
      : 0;
  const finalTotal = Math.max(0, totalAmountKobo - creditsApplied);

  // ─── Promo handlers ─────────────────────────────────────────────────────────
  const handleApplyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code || !user) return;

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

      const usage = await getPromoUsage(code, user.uid);
      if (usage && usage.usedCount >= promo.perUserLimit) {
        setPromoError("You've already used this promo code");
        return;
      }

      let discountKobo: number;
      if (promo.discountType === "fixed") {
        discountKobo = promo.discountValueKobo;
      } else {
        discountKobo = Math.round(subtotal * (promo.discountValueKobo / 100));
        if (promo.maxDiscountKobo != null) {
          discountKobo = Math.min(discountKobo, promo.maxDiscountKobo);
        }
      }
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

  // ─── Order creation ─────────────────────────────────────────────────────────
  const createOrderWithPayment = async (paymentParams: {
    paymentMethod: "cash" | "card";
    paymentStatus: "pending" | "paid";
    paystackReference: string | null;
  }) => {
    if (!user || !pickup || !dropoff || !selectedRiderId || !loadType) return;

    setIsSubmitting(true);
    try {
      const orderId = await createOrder({
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
        referralCreditsAppliedKobo: creditsApplied,
        tipAmountKobo: 0,
        totalAmountKobo: finalTotal,
        promoCode: booking.promoCode,
        status: "pending",
        conditionAtPickup: null,
        timeline: [],
        ...paymentParams,
        estimatedDistanceMeters,
        estimatedDurationSeconds,
        actualPickupAt: null,
        actualDeliveryAt: null,
        hasDispute: false,
        customerRatingId: null,
        riderRatingId: null,
      });

      resetBooking();
      router.replace({
        pathname: "/(tracking)/[id]",
        params: { id: orderId },
      } as any);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to place order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Swipe confirm ──────────────────────────────────────────────────────────
  const handleSwipeConfirm = async () => {
    if (checkoutMethod === "cash") {
      await createOrderWithPayment({
        paymentMethod: "cash",
        paymentStatus: "pending",
        paystackReference: null,
      });
      return;
    }

    // Card — create the order first (pending), then charge with the real orderId.
    // If charge fails we cancel the order so it never appears stuck.
    if (!selectedCard || !user || !pickup || !dropoff || !selectedRiderId || !loadType) return;
    setIsSubmitting(true);

    // Step 1: create order with pending payment status
    let pendingOrderId: string;
    try {
      pendingOrderId = await createOrder({
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
        referralCreditsAppliedKobo: creditsApplied,
        tipAmountKobo: 0,
        totalAmountKobo: finalTotal,
        promoCode: booking.promoCode,
        paymentMethod: "card",
        paymentStatus: "pending",
        paystackReference: null,
        status: "pending",
        conditionAtPickup: null,
        timeline: [],
        estimatedDistanceMeters,
        estimatedDurationSeconds,
        actualPickupAt: null,
        actualDeliveryAt: null,
        hasDispute: false,
        customerRatingId: null,
        riderRatingId: null,
      });
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to place order. Please try again.");
      setIsSubmitting(false);
      return;
    }

    // Step 2: charge the saved card with the real orderId in metadata
    try {
      const reference = generatePaystackReference();
      const chargeCardFn = httpsCallable(functions, "chargeCard");
      const result = await chargeCardFn({
        authorizationCode: selectedCard.paystackAuthorizationCode,
        email: user.email ?? "",
        amount: finalTotal,
        reference,
        metadata: {
          userId: user.uid,
          orderId: pendingOrderId,
          saveCard: false,
          promoCode: booking.promoCode || null,
          referralCreditsAppliedKobo: creditsApplied || 0,
        },
      });
      const data = result.data as any;
      if (!data.status) {
        throw new Error("Card charge failed. Please try again.");
      }
      // Charge succeeded — navigate to tracking. The webhook will confirm payment.
      resetBooking();
      router.replace({
        pathname: "/(tracking)/[id]",
        params: { id: pendingOrderId },
      } as any);
    } catch (err: any) {
      // Charge failed — cancel the pending order so it doesn't appear stuck
      await cancelOrder(pendingOrderId, "Payment failed").catch(() => {});
      Alert.alert(
        "Payment Failed",
        err.message || "Card could not be charged.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Paystack modal success ─────────────────────────────────────────────────
  const handlePaystackSuccess = async (
    reference: string,
    cardDetails: CardDetails,
  ) => {
    setShowPaystackModal(false);
    if (!user) return;

    // Card saving is now handled server-side via Paystack webhook.
    // The webhook receives the authorization data and saves to
    // users/{uid}/paymentMethods/ if saveCard metadata flag is true.
    // We just need to create the order here.

    await createOrderWithPayment({
      paymentMethod: "card",
      paymentStatus: "paid",
      paystackReference: reference,
    });
  };

  const loadTypeLabels: Record<string, string> = {
    food: "Food",
    parcel: "Parcel",
    document: "Document",
    other: "Other",
  };

  const swipeDisabled =
    isSubmitting || (checkoutMethod === "card" && !selectedCard);

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
                      Balance: {formatNaira(referralCredits)} · max 50% off
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

      {/* Bottom: Payment selector + swipe confirm */}
      <View
        className="px-5 pt-4 bg-gray-50 border-t border-gray-100"
        style={{ paddingBottom: Platform.OS === "ios" ? 36 : 52 }}
      >
        {/* Payment method selector */}
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 12,
              fontFamily: "PolySans-Median",
              color: "#9CA3AF",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Payment method
          </Text>
          <PaymentSelector
            selectedMethod={checkoutMethod}
            selectedCard={selectedCard}
            cards={savedCards}
            onSelectCash={() => setCheckoutMethod("cash")}
            onSelectCard={() => setCheckoutMethod("card")}
            onSelectSavedCard={(card) => {
              setSelectedCard(card);
              setCheckoutMethod("card");
            }}
            onAddCard={() => setShowPaystackModal(true)}
          />
        </View>

        {/* Save card toggle — shown when card is selected and no existing card chosen */}
        {checkoutMethod === "card" && savedCards.length === 0 && (
          <Pressable
            onPress={() => setSaveCard(!saveCard)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 12,
              paddingHorizontal: 4,
            }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: saveCard ? COLORS.primary : "#D1D5DB",
                backgroundColor: saveCard ? COLORS.primary : "transparent",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 10,
              }}
            >
              {saveCard && (
                <TickCircle size={12} color="#FFFFFF" variant="Bold" />
              )}
            </View>
            <Text
              style={{
                fontFamily: "PolySans-Neutral",
                fontSize: 13,
                color: "#374151",
              }}
            >
              Save card for future payments
            </Text>
          </Pressable>
        )}

        {finalTotal > 0 && (
          <Text className="font-sans-bold text-center text-base text-gray-900 mb-3">
            {formatNaira(finalTotal)}
          </Text>
        )}
        <SwipeToConfirm
          onConfirm={handleSwipeConfirm}
          label={finalTotal === 0 ? "Swipe to confirm" : "Swipe to pay"}
          disabled={swipeDisabled}
          loading={isSubmitting}
        />
        {checkoutMethod === "card" && !selectedCard && savedCards.length === 0 && (
          <Text
            style={{
              fontSize: 12,
              fontFamily: "PolySans-Neutral",
              color: COLORS.danger,
              textAlign: "center",
              marginTop: 8,
            }}
          >
            Add a card to continue with card payment
          </Text>
        )}
      </View>

      {/* Paystack payment modal */}
      <PaystackPaymentModal
        visible={showPaystackModal}
        amount={finalTotal}
        email={user?.email ?? ""}
        onClose={() => setShowPaystackModal(false)}
        onSuccess={handlePaystackSuccess}
      />
    </SafeAreaView>
  );
}
