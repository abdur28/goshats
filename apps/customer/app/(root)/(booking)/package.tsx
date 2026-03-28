import { COLORS } from "@/constants/theme";
import { useBookingStore } from "@/store/booking-store";
import type { LoadType } from "@goshats/types";
import { Header } from "@goshats/ui";
import { router } from "expo-router";
import { Bag2, Box1, DocumentText1, More, ShieldTick } from "iconsax-react-native";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function PackageIcon({ type, size = 24 }: { type: LoadType; size?: number }) {
  switch (type) {
    case "food":
      return <Bag2 size={size} color="#F97316" variant="Bold" />;
    case "parcel":
      return <Box1 size={size} color={COLORS.primary} variant="Bold" />;
    case "document":
      return <DocumentText1 size={size} color="#3B82F6" variant="Bold" />;
    case "other":
      return <More size={size} color="#8B5CF6" variant="Bold" />;
  }
}

const TYPES: { type: LoadType; label: string; desc: string; bg: string }[] = [
  { type: "food", label: "Food", desc: "Meals, drinks & groceries", bg: "#FFF7ED" },
  { type: "parcel", label: "Parcel", desc: "Boxes, packages & goods", bg: "#F0FDF4" },
  { type: "document", label: "Document", desc: "Papers, letters & files", bg: "#EFF6FF" },
  { type: "other", label: "Other", desc: "Anything else", bg: "#F5F3FF" },
];

export default function PackageScreen() {
  const setLoadDetails = useBookingStore((s) => s.setLoadDetails);

  const [selectedType, setSelectedType] = useState<LoadType | null>(
    () => useBookingStore.getState().loadType,
  );
  const [description, setDescription] = useState(
    () => useBookingStore.getState().loadDescription,
  );
  const [isHighValue, setIsHighValue] = useState(
    () => useBookingStore.getState().isHighValue,
  );
  const [declaredValue, setDeclaredValue] = useState(() => {
    const v = useBookingStore.getState().declaredValueKobo;
    return v ? String(v / 100) : "";
  });

  const canProceed = selectedType !== null;

  const handleContinue = () => {
    if (!selectedType) return;
    setLoadDetails(
      selectedType,
      description.trim(),
      isHighValue,
      isHighValue && declaredValue
        ? Math.round(parseFloat(declaredValue) * 100)
        : null,
    );
    router.push("/(booking)/riders" as any);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Header title="What are you sending?" onBack={() => router.back()} />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text className="font-sans-medium text-xs text-gray-400 uppercase tracking-wider px-6 mt-6 mb-3">
            Package type
          </Text>

          <View style={{ paddingHorizontal: 20, gap: 12 }}>
            {TYPES.map((item) => {
              const selected = selectedType === item.type;
              return (
                <Pressable
                  key={item.type}
                  onPress={() => setSelectedType(item.type)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 16,
                    borderRadius: 20,
                    borderWidth: 2,
                    borderColor: selected ? COLORS.primary : "#F3F4F6",
                    backgroundColor: "#FFFFFF",
                  }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 16,
                      backgroundColor: item.bg,
                    }}
                  >
                    <PackageIcon type={item.type} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text className="font-sans-bold text-base text-gray-900">
                      {item.label}
                    </Text>
                    <Text className="font-sans text-xs text-gray-500 mt-0.5">
                      {item.desc}
                    </Text>
                  </View>
                  {selected && (
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: COLORS.primary,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: "#FFFFFF",
                        }}
                      />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          <Text className="font-sans-medium text-xs text-gray-400 uppercase tracking-wider px-6 mt-8 mb-3">
            Description (optional)
          </Text>
          <View className="mx-5 bg-white rounded-[20px] border border-gray-100 shadow-sm">
            <TextInput
              style={{
                fontFamily: "PolySans-Neutral",
                fontSize: 14,
                color: "#111827",
                padding: 16,
                minHeight: 80,
                textAlignVertical: "top",
              }}
              placeholder="e.g. 2 bags of jollof rice, fragile glassware..."
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={200}
            />
          </View>

          <View className="mx-5 mt-6 bg-white rounded-[20px] border border-gray-100 shadow-sm p-4">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-accent/10 items-center justify-center mr-3">
                <ShieldTick size={20} color={COLORS.accent} variant="Bold" />
              </View>
              <View className="flex-1 mr-3">
                <Text className="font-sans-bold text-sm text-gray-900">
                  High value item
                </Text>
                <Text className="font-sans text-xs text-gray-500 mt-0.5">
                  Extra care & insurance coverage
                </Text>
              </View>
              <Switch
                value={isHighValue}
                onValueChange={setIsHighValue}
                trackColor={{ false: "#E5E7EB", true: COLORS.primaryLight }}
                thumbColor={isHighValue ? COLORS.primary : "#FFFFFF"}
              />
            </View>

            {isHighValue && (
              <View className="mt-4 flex-row items-center bg-gray-50 rounded-full px-4 border border-gray-100">
                <Text className="font-sans-bold text-sm text-gray-500 mr-1">
                  ₦
                </Text>
                <TextInput
                  style={{
                    flex: 1,
                    fontFamily: "PolySans-Median",
                    fontSize: 14,
                    color: "#111827",
                    paddingVertical: 12,
                  }}
                  placeholder="Declared value"
                  placeholderTextColor="#9CA3AF"
                  value={declaredValue}
                  onChangeText={setDeclaredValue}
                  keyboardType="numeric"
                />
              </View>
            )}
          </View>
        </ScrollView>

        <View
          className="px-5 pt-4 bg-gray-50 border-t border-gray-100"
          style={{ paddingBottom: Platform.OS === "ios" ? 36 : 52 }}
        >
          <Pressable
            onPress={handleContinue}
            disabled={!canProceed}
            className={`py-4 rounded-full items-center ${canProceed ? "bg-primary active:opacity-80" : "bg-gray-200"}`}
          >
            <Text
              className={`font-sans-bold text-base ${canProceed ? "text-white" : "text-gray-400"}`}
            >
              Continue
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
