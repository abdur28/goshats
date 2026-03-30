import { COLORS } from "@/constants/theme";
import type { PaymentMethod } from "@goshats/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

interface PaymentSelectorProps {
  selectedMethod: "cash" | "card";
  selectedCard: PaymentMethod | null;
  cards: PaymentMethod[];
  onSelectCash: () => void;
  onSelectCard: () => void;
  onSelectSavedCard: (card: PaymentMethod) => void;
  onAddCard: () => void;
}

const CARD_BRAND_ICONS: Record<
  string,
  keyof typeof MaterialCommunityIcons.glyphMap
> = {
  mastercard: "credit-card",
  visa: "credit-card-outline",
  verve: "credit-card-chip-outline",
};

const CARD_BG: Record<string, string> = {
  mastercard: "#111827",
  visa: "#1A1F71",
  verve: "#E31837",
};

export default function PaymentSelector({
  selectedMethod,
  selectedCard,
  cards,
  onSelectCash,
  onSelectCard,
  onSelectSavedCard,
  onAddCard,
}: PaymentSelectorProps) {
  return (
    <View>
      {/* Cash / Card toggle */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: "#F3F4F6",
          borderRadius: 14,
          padding: 4,
        }}
      >
        <Pressable
          onPress={onSelectCash}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 11,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 6,
            backgroundColor:
              selectedMethod === "cash" ? "#FFFFFF" : "transparent",
            shadowColor: selectedMethod === "cash" ? "#000" : "transparent",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: selectedMethod === "cash" ? 0.06 : 0,
            shadowRadius: 2,
            elevation: selectedMethod === "cash" ? 1 : 0,
          }}
        >
          <MaterialCommunityIcons
            name="cash"
            size={18}
            color={selectedMethod === "cash" ? COLORS.primary : "#9CA3AF"}
          />
          <Text
            style={{
              fontSize: 14,
              fontFamily: "PolySans-Median",
              color: selectedMethod === "cash" ? COLORS.primary : "#9CA3AF",
            }}
          >
            Cash
          </Text>
        </Pressable>

        <Pressable
          onPress={onSelectCard}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 11,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 6,
            backgroundColor:
              selectedMethod === "card" ? "#FFFFFF" : "transparent",
            shadowColor: selectedMethod === "card" ? "#000" : "transparent",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: selectedMethod === "card" ? 0.06 : 0,
            shadowRadius: 2,
            elevation: selectedMethod === "card" ? 1 : 0,
          }}
        >
          <MaterialCommunityIcons
            name="credit-card-outline"
            size={18}
            color={selectedMethod === "card" ? COLORS.primary : "#9CA3AF"}
          />
          <Text
            style={{
              fontSize: 14,
              fontFamily: "PolySans-Median",
              color: selectedMethod === "card" ? COLORS.primary : "#9CA3AF",
            }}
          >
            Card
          </Text>
        </Pressable>
      </View>

      {/* Card selection — only when Card tab is active */}
      {selectedMethod === "card" && (
        <>
          {cards.length > 0 ? (
            /* Horizontal card chips */
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 12 }}
              contentContainerStyle={{ gap: 10, paddingHorizontal: 2 }}
            >
              {cards.map((card) => {
                const isSelected = selectedCard?.id === card.id;
                const bg = CARD_BG[card.type] ?? "#111827";
                const icon =
                  CARD_BRAND_ICONS[card.type] ?? "credit-card-outline";

                return (
                  <Pressable
                    key={card.id}
                    onPress={() => onSelectSavedCard(card)}
                    style={{
                      width: 130,
                      borderRadius: 14,
                      borderWidth: 1.5,
                      borderColor: isSelected ? COLORS.primary : "#E5E7EB",
                      backgroundColor: isSelected
                        ? COLORS.primary + "08"
                        : "#FFFFFF",
                      padding: 12,
                      gap: 8,
                    }}
                  >
                    {/* Brand icon */}
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        backgroundColor: bg,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <MaterialCommunityIcons
                        name={icon}
                        size={18}
                        color="#FFFFFF"
                      />
                    </View>

                    {/* Card number */}
                    <Text
                      style={{
                        fontSize: 13,
                        fontFamily: "PolySans-Bulky",
                        color: "#111827",
                        letterSpacing: 0.5,
                      }}
                    >
                      ••••  {card.last4}
                    </Text>

                    {/* Bank */}
                    <Text
                      style={{
                        fontSize: 11,
                        fontFamily: "PolySans-Neutral",
                        color: "#9CA3AF",
                      }}
                      numberOfLines={1}
                    >
                      {card.bank}
                    </Text>
                  </Pressable>
                );
              })}

              {/* Add new card chip */}
              <Pressable
                onPress={onAddCard}
                style={{
                  width: 100,
                  borderRadius: 14,
                  borderWidth: 1.5,
                  borderColor: COLORS.primary + "40",
                  borderStyle: "dashed",
                  backgroundColor: COLORS.primary + "06",
                  padding: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: COLORS.primary + "15",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MaterialCommunityIcons
                    name="plus"
                    size={20}
                    color={COLORS.primary}
                  />
                </View>
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: "PolySans-Median",
                    color: COLORS.primary,
                    textAlign: "center",
                  }}
                >
                  Add card
                </Text>
              </Pressable>
            </ScrollView>
          ) : (
            /* No saved cards — single add row */
            <Pressable
              onPress={onAddCard}
              style={{
                marginTop: 12,
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#F9FAFB",
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                padding: 14,
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: COLORS.primary + "15",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialCommunityIcons
                  name="plus"
                  size={22}
                  color={COLORS.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "PolySans-Median",
                    color: COLORS.primary,
                  }}
                >
                  Add a card
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: "PolySans-Neutral",
                    color: "#9CA3AF",
                    marginTop: 2,
                  }}
                >
                  Visa, Mastercard, Verve accepted
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color="#9CA3AF"
              />
            </Pressable>
          )}
        </>
      )}
    </View>
  );
}
