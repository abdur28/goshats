import { COLORS } from "@/constants/theme";
import type { PaymentMethod } from "@goshats/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface SavedCardPickerSheetProps {
  visible: boolean;
  cards: PaymentMethod[];
  selectedCardId: string | null;
  onSelect: (card: PaymentMethod) => void;
  onAddNew: () => void;
  onClose: () => void;
}

const CARD_COLORS: Record<string, { bg: string; text: string }> = {
  mastercard: { bg: "#111827", text: "#FFFFFF" },
  visa: { bg: "#1A1F71", text: "#FFFFFF" },
  verve: { bg: "#E31837", text: "#FFFFFF" },
};

const CARD_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  mastercard: "credit-card",
  visa: "credit-card-outline",
  verve: "credit-card-chip-outline",
};

export default function SavedCardPickerSheet({
  visible,
  cards,
  selectedCardId,
  onSelect,
  onAddNew,
  onClose,
}: SavedCardPickerSheetProps) {
  const insets = useSafeAreaInsets();

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
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: "#F3F4F6",
          }}
        >
          <Text
            style={{
              fontSize: 17,
              fontFamily: "PolySans-Bulky",
              color: "#111827",
            }}
          >
            Select Card
          </Text>
          <Pressable onPress={onClose} style={{ padding: 4 }}>
            <MaterialCommunityIcons name="close" size={24} color="#9CA3AF" />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {cards.map((card) => {
            const isSelected = card.id === selectedCardId;
            const colors = CARD_COLORS[card.type] ?? CARD_COLORS.mastercard;
            const icon = CARD_ICONS[card.type] ?? "credit-card-outline";

            return (
              <Pressable
                key={card.id}
                onPress={() => { onSelect(card); onClose(); }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: isSelected ? COLORS.primary : "#E5E7EB",
                  backgroundColor: isSelected ? COLORS.primary + "08" : "#FFFFFF",
                  marginBottom: 12,
                  gap: 14,
                }}
              >
                {/* Card icon */}
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: colors.bg,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MaterialCommunityIcons
                    name={icon}
                    size={24}
                    color={colors.text}
                  />
                </View>

                {/* Card info */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontFamily: "PolySans-Median",
                      color: "#111827",
                    }}
                  >
                    {card.type.charAt(0).toUpperCase() + card.type.slice(1)} ••••{" "}
                    {card.last4}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: "PolySans-Neutral",
                      color: "#6B7280",
                      marginTop: 2,
                    }}
                  >
                    {card.bank} · Expires{" "}
                    {String(card.expiryMonth).padStart(2, "0")}/{card.expiryYear}
                  </Text>
                  {card.isPrimary && (
                    <View
                      style={{
                        alignSelf: "flex-start",
                        marginTop: 4,
                        backgroundColor: COLORS.primary + "20",
                        paddingHorizontal: 8,
                        paddingVertical: 2,
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
                        DEFAULT
                      </Text>
                    </View>
                  )}
                </View>

                {/* Selection indicator */}
                <MaterialCommunityIcons
                  name={isSelected ? "check-circle" : "radiobox-blank"}
                  size={22}
                  color={isSelected ? COLORS.primary : "#D1D5DB"}
                />
              </Pressable>
            );
          })}

          {/* Add new card */}
          <Pressable
            onPress={() => { onAddNew(); onClose(); }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: "#E5E7EB",
              borderStyle: "dashed",
              gap: 14,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: COLORS.primary + "15",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MaterialCommunityIcons
                name="plus"
                size={24}
                color={COLORS.primary}
              />
            </View>
            <Text
              style={{
                fontSize: 15,
                fontFamily: "PolySans-Median",
                color: COLORS.primary,
              }}
            >
              Add new card
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}
