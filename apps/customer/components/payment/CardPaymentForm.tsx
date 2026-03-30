import { COLORS } from "@/constants/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

export interface CardData {
  number: string;
  cvv: string;
  expiry_month: string;
  expiry_year: string;
}

interface CardPaymentFormProps {
  amount: number; // kobo
  onSubmit: (cardData: CardData) => void;
  loading: boolean;
  error: string | null;
}

function getCardType(number: string): "VISA" | "MC" | "VERVE" | null {
  const cleaned = number.replace(/\s/g, "");
  if (cleaned.startsWith("4")) return "VISA";
  if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return "MC";
  if (cleaned.startsWith("506") || cleaned.startsWith("650")) return "VERVE";
  return null;
}

function formatCardNumber(text: string): string {
  const cleaned = text.replace(/\D/g, "");
  return cleaned.replace(/(\d{4})(?=\d)/g, "$1 ").substring(0, 19);
}

function formatExpiry(text: string, prev: string): string {
  const cleaned = text.replace(/\D/g, "");
  if (prev.length === 3 && text.length === 2) {
    return text.substring(0, 1);
  }
  if (cleaned.length >= 2) {
    return cleaned.substring(0, 2) + "/" + cleaned.substring(2, 4);
  }
  return cleaned;
}

export default function CardPaymentForm({
  amount,
  onSubmit,
  loading,
  error,
}: CardPaymentFormProps) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [focused, setFocused] = useState<string | null>(null);

  const cardType = getCardType(cardNumber);

  const isValid = () => {
    const cleaned = cardNumber.replace(/\s/g, "");
    const [month, year] = expiry.split("/");
    return (
      cleaned.length >= 15 &&
      cleaned.length <= 16 &&
      month?.length === 2 &&
      year?.length === 2 &&
      cvv.length >= 3
    );
  };

  const handleSubmit = () => {
    if (!isValid()) return;
    const [month, year] = expiry.split("/");
    onSubmit({
      number: cardNumber.replace(/\s/g, ""),
      cvv,
      expiry_month: month,
      expiry_year: year,
    });
  };

  const inputStyle = (field: string) => ({
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: "PolySans-Neutral",
    color: "#111827",
  });

  const containerStyle = (field: string) => ({
    flexDirection: "row" as const,
    alignItems: "center" as const,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: focused === field ? COLORS.primary : "#E5E7EB",
    backgroundColor: "#F9FAFB",
  });

  const nairaAmount = (amount / 100).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <View style={{ padding: 4 }}>
      {/* Card Number */}
      <View style={{ marginBottom: 16 }}>
        <Text
          style={{
            fontSize: 13,
            fontFamily: "PolySans-Median",
            color: "#374151",
            marginBottom: 8,
          }}
        >
          Card Number
        </Text>
        <View style={containerStyle("card")}>
          <MaterialCommunityIcons
            name="credit-card-outline"
            size={20}
            color="#9CA3AF"
            style={{ marginLeft: 14 }}
          />
          <TextInput
            style={inputStyle("card")}
            placeholder="0000 0000 0000 0000"
            placeholderTextColor="#D1D5DB"
            value={cardNumber}
            onChangeText={(t) => setCardNumber(formatCardNumber(t))}
            keyboardType="number-pad"
            maxLength={19}
            editable={!loading}
            onFocus={() => setFocused("card")}
            onBlur={() => setFocused(null)}
          />
          {cardType && (
            <View
              style={{
                marginRight: 12,
                paddingHorizontal: 8,
                paddingVertical: 3,
                backgroundColor: COLORS.primary + "20",
                borderRadius: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: "PolySans-Bulky",
                  color: COLORS.primary,
                }}
              >
                {cardType}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Expiry + CVV row */}
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 13,
              fontFamily: "PolySans-Median",
              color: "#374151",
              marginBottom: 8,
            }}
          >
            Expiry Date
          </Text>
          <View style={containerStyle("expiry")}>
            <TextInput
              style={[inputStyle("expiry"), { textAlign: "center" }]}
              placeholder="MM/YY"
              placeholderTextColor="#D1D5DB"
              value={expiry}
              onChangeText={(t) => setExpiry(formatExpiry(t, expiry))}
              keyboardType="number-pad"
              maxLength={5}
              editable={!loading}
              onFocus={() => setFocused("expiry")}
              onBlur={() => setFocused(null)}
            />
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 13,
              fontFamily: "PolySans-Median",
              color: "#374151",
              marginBottom: 8,
            }}
          >
            CVV
          </Text>
          <View style={containerStyle("cvv")}>
            <TextInput
              style={[inputStyle("cvv"), { textAlign: "center" }]}
              placeholder="123"
              placeholderTextColor="#D1D5DB"
              value={cvv}
              onChangeText={(t) => setCvv(t.replace(/\D/g, "").substring(0, 4))}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
              editable={!loading}
              onFocus={() => setFocused("cvv")}
              onBlur={() => setFocused(null)}
            />
            <MaterialCommunityIcons
              name="lock-outline"
              size={16}
              color="#9CA3AF"
              style={{ marginRight: 14 }}
            />
          </View>
        </View>
      </View>

      {/* Error */}
      {error && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#FEE2E2",
            padding: 12,
            borderRadius: 12,
            marginBottom: 16,
            gap: 8,
          }}
        >
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={18}
            color={COLORS.danger}
          />
          <Text
            style={{
              flex: 1,
              fontSize: 13,
              fontFamily: "PolySans-Neutral",
              color: COLORS.danger,
            }}
          >
            {error}
          </Text>
        </View>
      )}

      {/* Pay button */}
      <Pressable
        onPress={handleSubmit}
        disabled={!isValid() || loading}
        style={{
          backgroundColor:
            isValid() && !loading ? COLORS.primary : "#D1D5DB",
          borderRadius: 16,
          paddingVertical: 16,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text
            style={{
              fontSize: 15,
              fontFamily: "PolySans-Bulky",
              color: "#fff",
            }}
          >
            Pay ₦{nairaAmount}
          </Text>
        )}
      </Pressable>

      {/* Secure note */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 16,
          gap: 4,
        }}
      >
        <MaterialCommunityIcons
          name="shield-check"
          size={14}
          color={COLORS.success}
        />
        <Text
          style={{
            fontSize: 11,
            fontFamily: "PolySans-Neutral",
            color: "#9CA3AF",
          }}
        >
          Secured by Paystack. Your card details are encrypted.
        </Text>
      </View>
    </View>
  );
}
