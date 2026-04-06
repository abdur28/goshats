import { COLORS } from "@/constants/theme";
import { formatNaira } from "@/lib/format";
import { Star1 } from "iconsax-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

interface PostDeliveryPanelProps {
  riderName: string;
  paymentMethod: "cash" | "card" | "referral_credits";
  tipOptionsKobo: number[];
  onSubmit: (stars: number, review: string, tipAmountKobo: number) => Promise<void>;
  onSkip: () => void;
}

export default function PostDeliveryPanel({
  riderName,
  paymentMethod,
  tipOptionsKobo,
  onSubmit,
  onSkip,
}: PostDeliveryPanelProps) {
  const [stars, setStars] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [review, setReview] = useState("");
  const [selectedTip, setSelectedTip] = useState<number | null>(null);
  const [customTipInput, setCustomTipInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const showTip = false; // Tips disabled for MVP — was: paymentMethod === "card"
  const displayStars = hoveredStar || stars;

  // Resolve effective tip: custom input takes priority over chip selection
  const customTipKobo = customTipInput.trim()
    ? Math.round(parseFloat(customTipInput.replace(/,/g, "")) * 100)
    : null;
  const effectiveTip = customTipKobo ?? selectedTip ?? 0;

  const handleCustomTipChange = (text: string) => {
    // Strip non-numeric except decimal
    const cleaned = text.replace(/[^0-9.]/g, "");
    setCustomTipInput(cleaned);
    // Deselect chip when typing custom amount
    if (cleaned) setSelectedTip(null);
  };

  const handleChipPress = (amount: number) => {
    const alreadySelected = selectedTip === amount;
    setSelectedTip(alreadySelected ? null : amount);
    // Clear custom input when selecting a chip
    setCustomTipInput("");
  };

  const handleSubmit = async () => {
    if (stars === 0) return;
    setSubmitting(true);
    try {
      await onSubmit(stars, review.trim(), effectiveTip);
    } finally {
      setSubmitting(false);
    }
  };

  const submitLabel = () => {
    if (showTip && effectiveTip > 0) return `Submit & tip ${formatNaira(effectiveTip)}`;
    return "Submit rating";
  };

  return (
    <View style={{ padding: 20, paddingBottom: 40 }}>
      {/* Delivered banner */}
      <View
        style={{
          backgroundColor: COLORS.primary,
          borderRadius: 24,
          padding: 18,
          marginBottom: 16,
          alignItems: "center",
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

      {/* Rating card */}
      <View
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 24,
          padding: 20,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: "#F3F4F6",
        }}
      >
        <Text
          style={{
            fontSize: 15,
            fontFamily: "PolySans-Bulky",
            color: "#111827",
            textAlign: "center",
            marginBottom: 4,
          }}
        >
          How was {riderName}?
        </Text>
        <Text
          style={{
            fontSize: 12,
            fontFamily: "PolySans-Neutral",
            color: "#9CA3AF",
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          Your feedback helps improve the experience
        </Text>

        {/* Stars */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
          {[1, 2, 3, 4, 5].map((s) => (
            <Pressable
              key={s}
              onPress={() => setStars(s)}
              onPressIn={() => setHoveredStar(s)}
              onPressOut={() => setHoveredStar(0)}
            >
              <Star1
                size={38}
                color={s <= displayStars ? "#F59E0B" : "#E5E7EB"}
                variant={s <= displayStars ? "Bold" : "Linear"}
              />
            </Pressable>
          ))}
        </View>

        {/* Star label */}
        {stars > 0 && (
          <Text
            style={{
              fontSize: 13,
              fontFamily: "PolySans-Median",
              color: "#6B7280",
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            {["", "Poor", "Fair", "Good", "Great", "Excellent!"][stars]}
          </Text>
        )}

        {/* Review input */}
        <TextInput
          style={{
            backgroundColor: "#F9FAFB",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "#F3F4F6",
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontFamily: "PolySans-Neutral",
            fontSize: 14,
            color: "#111827",
            minHeight: 80,
            textAlignVertical: "top",
          }}
          placeholder="Leave a review (optional)"
          placeholderTextColor="#9CA3AF"
          value={review}
          onChangeText={setReview}
          multiline
          maxLength={200}
        />
      </View>

      {/* Tip card — card payments only */}
      {showTip && (
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 24,
            padding: 20,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: "#F3F4F6",
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontFamily: "PolySans-Bulky",
              color: "#111827",
              marginBottom: 4,
            }}
          >
            Add a tip
          </Text>
          <Text
            style={{
              fontSize: 12,
              fontFamily: "PolySans-Neutral",
              color: "#9CA3AF",
              marginBottom: 16,
            }}
          >
            100% goes directly to your rider
          </Text>

          {/* Quick-select chips */}
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
            {tipOptionsKobo.map((amount) => {
              const selected = selectedTip === amount;
              return (
                <Pressable
                  key={amount}
                  onPress={() => handleChipPress(amount)}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 9999,
                    borderWidth: 1.5,
                    borderColor: selected ? COLORS.primary : "#E5E7EB",
                    backgroundColor: selected ? COLORS.primary + "10" : "#FAFAFA",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "PolySans-Bulky",
                      fontSize: 13,
                      color: selected ? COLORS.primary : "#374151",
                    }}
                  >
                    {formatNaira(amount)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Custom amount input */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#F9FAFB",
              borderRadius: 9999,
              borderWidth: 1.5,
              borderColor: customTipInput ? COLORS.primary : "#E5E7EB",
              paddingHorizontal: 16,
            }}
          >
            <Text
              style={{
                fontFamily: "PolySans-Median",
                fontSize: 14,
                color: "#9CA3AF",
                marginRight: 4,
              }}
            >
              ₦
            </Text>
            <TextInput
              style={{
                flex: 1,
                fontFamily: "PolySans-Neutral",
                fontSize: 14,
                color: "#111827",
                paddingVertical: 12,
              }}
              placeholder="Other amount"
              placeholderTextColor="#9CA3AF"
              value={customTipInput}
              onChangeText={handleCustomTipChange}
              keyboardType="decimal-pad"
              returnKeyType="done"
            />
          </View>
        </View>
      )}

      {/* Submit */}
      <Pressable
        onPress={handleSubmit}
        disabled={stars === 0 || submitting}
        style={{
          backgroundColor: stars === 0 ? "#E5E7EB" : COLORS.primary,
          borderRadius: 9999,
          paddingVertical: 16,
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text
            style={{
              fontFamily: "PolySans-Bulky",
              fontSize: 15,
              color: stars === 0 ? "#9CA3AF" : "#FFFFFF",
            }}
          >
            {submitLabel()}
          </Text>
        )}
      </Pressable>

      <Pressable onPress={onSkip} style={{ alignItems: "center", paddingVertical: 8 }}>
        <Text
          style={{
            fontFamily: "PolySans-Neutral",
            fontSize: 13,
            color: "#9CA3AF",
          }}
        >
          Skip for now
        </Text>
      </Pressable>
    </View>
  );
}
