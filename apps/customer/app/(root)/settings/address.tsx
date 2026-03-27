import { Button, Input } from "@goshats/ui";
import { router, useLocalSearchParams } from "expo-router";
import { CloseCircle } from "iconsax-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddressModalScreen() {
  const { id } = useLocalSearchParams();
  const isEditing = !!id;

  const [label, setLabel] = useState(isEditing ? "Home" : "");
  const [street, setStreet] = useState(isEditing ? "14 Maitama Crescent" : "");
  const [city, setCity] = useState(isEditing ? "Abuja" : "");
  const [isDefault, setIsDefault] = useState(isEditing ? true : false);

  const handleSave = () => {
    // In a real app, this dispatches to Firestore.
    // We just dismiss the modal for now.
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
          {isEditing ? "Edit Address" : "Add New Address"}
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
        <View className="mb-4">
          <Input
            label="Label (e.g. Home, Office, Gym)"
            placeholder="What should we call this?"
            value={label}
            onChangeText={setLabel}
          />
        </View>

        <View className="mb-4">
          <Input
            label="Street Address"
            placeholder="14 Maitama Crescent"
            value={street}
            onChangeText={setStreet}
          />
        </View>

        <View className="mb-6">
          <Input
            label="City"
            placeholder="Abuja"
            value={city}
            onChangeText={setCity}
          />
        </View>

        <View className="flex-row items-center justify-between bg-gray-50 p-4 rounded-[16px] border border-gray-100">
          <View>
            <Text className="text-[15px] font-sans-bold text-gray-900 mb-1">
              Set as Default
            </Text>
            <Text className="text-[13px] font-sans text-gray-500">
              Make this your primary location
            </Text>
          </View>
          <Switch
            value={isDefault}
            onValueChange={setIsDefault}
            trackColor={{ false: "#E5E7EB", true: "#006B3F" }}
            thumbColor="#FFF"
            ios_backgroundColor="#E5E7EB"
          />
        </View>

        <View className="mt-10">
          <Button
            title={isEditing ? "Update Address" : "Save Address"}
            onPress={handleSave}
            disabled={!label || !street || !city}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
