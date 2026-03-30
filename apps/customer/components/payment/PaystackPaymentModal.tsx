import { COLORS } from "@/constants/theme";
import { generatePaystackReference } from "@/lib/paystack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import CardPaymentForm, { CardData } from "./CardPaymentForm";
import OTPInput from "./OTPInput";

type PaymentStep =
  | "card_input"
  | "otp"
  | "pin"
  | "phone"
  | "birthday"
  | "3ds"
  | "pending";

interface ChargeResponse {
  reference: string;
  status: string;
  display_text?: string | null;
  url?: string | null;
  next_action?: string | null;
}

export interface CardDetails {
  authorizationCode: string;
  last4: string;
  bank: string;
  cardType: string;
  expiryMonth: number;
  expiryYear: number;
  brand: string;
  signature: string;
  bin: string;
}

interface PaystackPaymentModalProps {
  amount: number; // kobo
  email: string;
  visible: boolean;
  onClose: () => void;
  onSuccess: (reference: string, cardDetails: CardDetails) => void;
}

const OTP_STEPS = ["otp", "pin", "phone", "birthday"] as const;

export default function PaystackPaymentModal({
  amount,
  email,
  visible,
  onClose,
  onSuccess,
}: PaystackPaymentModalProps) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<PaymentStep>("card_input");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txReference, setTxReference] = useState("");
  const [chargeData, setChargeData] = useState<ChargeResponse | null>(null);
  const [threeDSUrl, setThreeDSUrl] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (visible) resetState();
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [visible]);

  function resetState() {
    setStep("card_input");
    setLoading(false);
    setError(null);
    setTxReference("");
    setChargeData(null);
    setThreeDSUrl(null);
    setChecking(false);
    if (pollingRef.current) clearInterval(pollingRef.current);
  }

  // ─── Charge ────────────────────────────────────────────────────────────────

  async function initiateCharge(card: CardData) {
    setLoading(true);
    setError(null);
    const reference = generatePaystackReference();

    try {
      const res = await fetch("/api/paystack-charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, amount, reference, card }),
      });
      const data = await res.json();

      if (!res.ok || !data.status) {
        throw new Error(data.error || "Payment failed. Please try again.");
      }

      setTxReference(data.data.reference);
      setChargeData(data.data);
      handleChargeResponse(data.data);
    } catch (err: any) {
      setError(err.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleChargeResponse(data: ChargeResponse) {
    if (data.status === "success") {
      verifyAndFinish(data.reference);
      return;
    }
    switch (data.next_action) {
      case "otp": setStep("otp"); break;
      case "pin": setStep("pin"); break;
      case "phone": setStep("phone"); break;
      case "birthday": setStep("birthday"); break;
      case "3ds":
        if (data.url) { setThreeDSUrl(data.url); setStep("3ds"); }
        break;
      case "pending":
        setStep("pending");
        startPolling(data.reference);
        break;
      default:
        if (data.status === "pending") {
          setStep("pending");
          startPolling(data.reference);
        }
    }
  }

  // ─── Submit OTP / PIN ───────────────────────────────────────────────────────

  async function submitOtp(
    stepType: "otp" | "pin" | "phone" | "birthday",
    value: string
  ) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/paystack-submit-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: txReference, [stepType]: value }),
      });
      const data = await res.json();

      if (!res.ok || !data.status) {
        throw new Error(data.error || "Submission failed.");
      }

      setChargeData(data.data);
      handleChargeResponse(data.data);
    } catch (err: any) {
      setError(err.message || "Submission failed.");
    } finally {
      setLoading(false);
    }
  }

  // ─── Verify ────────────────────────────────────────────────────────────────

  const verifyAndFinish = useCallback(
    async (ref: string) => {
      if (checking) return;
      setChecking(true);
      if (pollingRef.current) clearInterval(pollingRef.current);

      try {
        const res = await fetch(`/api/paystack-verify?reference=${ref}`);
        const data = await res.json();

        if (data.status && data.data?.status === "success") {
          onSuccess(ref, {
            authorizationCode: data.data.authorizationCode,
            last4: data.data.last4,
            bank: data.data.bank,
            cardType: data.data.cardType,
            expiryMonth: data.data.expiryMonth,
            expiryYear: data.data.expiryYear,
            brand: data.data.brand,
            signature: data.data.signature,
            bin: data.data.bin,
          });
        } else if (data.data?.status === "failed") {
          setError("Payment failed. Please try again.");
          setStep("card_input");
        }
      } catch {
        // silent — keep polling or let user retry
      } finally {
        setChecking(false);
      }
    },
    [checking, onSuccess]
  );

  function startPolling(ref: string) {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(() => verifyAndFinish(ref), 5000);
  }

  // ─── 3DS WebView ───────────────────────────────────────────────────────────

  function handle3DSNavigation(navState: { url: string }) {
    const { url } = navState;
    if (
      url.includes("standard.paystack.co/close") ||
      url.includes("paystack.com/close")
    ) {
      setThreeDSUrl(null);
      verifyAndFinish(txReference);
    }
  }

  // ─── Title ─────────────────────────────────────────────────────────────────

  function getTitle() {
    switch (step) {
      case "card_input": return "Card Payment";
      case "otp": return "Verify OTP";
      case "pin": return "Enter PIN";
      case "phone": return "Enter Phone";
      case "birthday": return "Verify Identity";
      case "3ds": return "Authorise Payment";
      case "pending": return "Processing...";
    }
  }

  const canGoBack = step === "card_input" ? false : !OTP_STEPS.includes(step as any) || step === "otp";

  const nairaAmount = (amount / 100).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // ─── Content ───────────────────────────────────────────────────────────────

  function renderContent() {
    if (step === "3ds" && threeDSUrl) {
      return (
        <View style={{ flex: 1, minHeight: 400 }}>
          <WebView
            source={{ uri: threeDSUrl }}
            style={{ flex: 1 }}
            onNavigationStateChange={handle3DSNavigation}
            javaScriptEnabled
            domStorageEnabled
          />
        </View>
      );
    }

    if (step === "pending") {
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={48}
            color={COLORS.primary}
            style={{ marginBottom: 16 }}
          />
          <Text style={{ fontSize: 16, fontFamily: "PolySans-Bulky", color: "#111827", marginBottom: 8 }}>
            Processing Payment
          </Text>
          <Text style={{ fontSize: 13, fontFamily: "PolySans-Neutral", color: "#6B7280", textAlign: "center" }}>
            Please wait while we confirm your payment...
          </Text>
        </View>
      );
    }

    if (OTP_STEPS.includes(step as any)) {
      return (
        <OTPInput
          type={step as "otp" | "pin" | "phone" | "birthday"}
          displayText={chargeData?.display_text ?? undefined}
          onSubmit={(value) => submitOtp(step as any, value)}
          loading={loading}
          error={error}
        />
      );
    }

    return (
      <CardPaymentForm
        amount={amount}
        onSubmit={initiateCharge}
        loading={loading}
        error={error}
      />
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "#FFFFFF",
          paddingTop: insets.top > 0 ? insets.top : 16,
        }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: "#F3F4F6",
            }}
          >
            {step !== "card_input" && step !== "pending" ? (
              <Pressable
                onPress={() => { setStep("card_input"); setError(null); }}
                style={{ padding: 4 }}
              >
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={24}
                  color="#111827"
                />
              </Pressable>
            ) : (
              <Pressable onPress={onClose} style={{ padding: 4 }}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color="#111827"
                />
              </Pressable>
            )}
            <Text
              style={{
                fontSize: 17,
                fontFamily: "PolySans-Bulky",
                color: "#111827",
              }}
            >
              {getTitle()}
            </Text>
            <View style={{ width: 32 }} />
          </View>

          {/* Amount summary card */}
          {step !== "3ds" && (
            <View
              style={{
                marginHorizontal: 20,
                marginTop: 16,
                backgroundColor: "#1A1A1A",
                borderRadius: 16,
                padding: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: "PolySans-Neutral",
                  color: "rgba(255,255,255,0.6)",
                  marginBottom: 4,
                }}
              >
                Amount to Pay
              </Text>
              <Text
                style={{
                  fontSize: 26,
                  fontFamily: "PolySans-Bulky",
                  color: "#FFFFFF",
                }}
              >
                ₦{nairaAmount}
              </Text>
            </View>
          )}

          {/* Content */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {renderContent()}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
