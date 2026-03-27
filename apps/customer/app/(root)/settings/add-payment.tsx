import { Button, Input } from "@goshats/ui";
import { router } from "expo-router";
import { CloseCircle } from "iconsax-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PaymentModalScreen() {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardholder, setCardholder] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  const handleSave = () => {
    // Production note: Send to Paystack tokenizer directly, bypassing GoShats backend.
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100">
        <Pressable
          onPress={() => router.back()}
          className="p-2 -ml-2 active:opacity-50"
        >
          <CloseCircle size={28} color="#9CA3AF" variant="Bulk" />
        </Pressable>
        <Text className="text-[18px] font-sans-bold text-gray-900">
          Add New Card
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
        <View className="mb-4">
          <Input
            label="Card Number"
            placeholder="0000 0000 0000 0000"
            keyboardType="number-pad"
            value={cardNumber}
            onChangeText={setCardNumber}
          />
        </View>

        <View className="flex-row gap-4 mb-4">
          <View className="flex-1">
            <Input
              label="Expiry Date"
              placeholder="MM/YY"
              keyboardType="number-pad"
              value={expiry}
              onChangeText={setExpiry}
            />
          </View>
          <View className="flex-1">
            <Input
              label="CVV"
              placeholder="123"
              keyboardType="number-pad"
              secureTextEntry
              value={cvv}
              onChangeText={setCvv}
            />
          </View>
        </View>

        <View className="mb-6">
          <Input
            label="Cardholder Name"
            placeholder="Name exactly as on card"
            value={cardholder}
            onChangeText={setCardholder}
          />
        </View>

        <View className="flex-row items-center justify-between bg-gray-50 p-4 rounded-[16px] border border-gray-100 mt-2">
          <View>
            <Text className="text-[15px] font-sans-bold text-gray-900 mb-1">
              Set as Default
            </Text>
            <Text className="text-[13px] font-sans text-gray-500">
              Use this card for future bookings
            </Text>
          </View>
          <Switch
            value={isPrimary}
            onValueChange={setIsPrimary}
            trackColor={{ false: "#E5E7EB", true: "#006B3F" }}
            thumbColor="#FFF"
            ios_backgroundColor="#E5E7EB"
          />
        </View>

        <View className="mt-10">
          <Button
            title="Save Card Securely"
            onPress={handleSave}
            disabled={!cardNumber || !expiry || !cvv || !cardholder}
          />
          <Text className="text-center text-[11px] font-sans text-gray-400 mt-4 px-4 leading-relaxed">
            Your card details are instantly encrypted and are never stored on
            GoShats servers. Processed securely via Paystack.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
