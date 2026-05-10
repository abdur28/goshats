import PlacesAutocomplete from "@/components/map/PlacesAutocomplete";
import { useSavedAddresses } from "@/hooks/use-saved-addresses";
import type { PlaceDetails } from "@/lib/maps";
import { useAuthStore } from "@/store/auth-store";
import { addAddress, setDefaultAddress, updateAddress } from "@goshats/firebase";
import { Button, Input } from "@goshats/ui";
import { router, useLocalSearchParams } from "expo-router";
import { CloseCircle } from "iconsax-react-native";
import { useEffect, useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddressModalScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;
  const uid = useAuthStore((s) => s.user?.uid);
  const { addresses } = useSavedAddresses();

  const editing = useMemo(
    () => (isEditing ? addresses.find((a) => a.id === id) : null),
    [isEditing, id, addresses],
  );

  const [label, setLabel] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postcode, setPostcode] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isDefault, setIsDefault] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (!editing) return;
    setLabel(editing.label);
    setStreet(editing.street);
    setCity(editing.city);
    setState(editing.state);
    setPostcode(editing.postcode);
    setLatitude(editing.location?.latitude ?? null);
    setLongitude(editing.location?.longitude ?? null);
    setIsDefault(editing.isDefault);
  }, [editing]);

  const handlePlaceSelected = (place: PlaceDetails) => {
    setStreet(place.address);
    setLatitude(place.latitude);
    setLongitude(place.longitude);
    setShowSearch(false);
  };

  const canSave =
    !!label.trim() &&
    !!street.trim() &&
    !!city.trim() &&
    !!state.trim() &&
    latitude != null &&
    longitude != null &&
    !isSaving;

  const handleSave = async () => {
    if (!uid || !canSave) return;
    setIsSaving(true);
    try {
      const payload = {
        label: label.trim(),
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        postcode: postcode.trim(),
        location: { latitude: latitude!, longitude: longitude! },
        isDefault,
      };

      if (isEditing && id) {
        await updateAddress(uid, id, payload);
        if (isDefault && !editing?.isDefault) {
          await setDefaultAddress(uid, id);
        }
      } else {
        const newId = await addAddress(uid, payload);
        if (isDefault) {
          await setDefaultAddress(uid, newId);
        }
      }

      router.back();
    } catch {
      Alert.alert("Error", "Couldn't save address. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
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

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 24, paddingBottom: 80 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-4">
            <Input
              label="Label (e.g. Home, Office, Gym)"
              placeholder="What should we call this?"
              value={label}
              onChangeText={setLabel}
            />
          </View>

          <View className="mb-4">
            <Text className="text-[13px] font-sans-medium text-gray-700 mb-1.5">
              Street Address
            </Text>
            {showSearch ? (
              <PlacesAutocomplete
                placeholder="Search address"
                onPlaceSelected={handlePlaceSelected}
                onClear={() => setShowSearch(false)}
                initialValue={street}
                autoFocus
              />
            ) : (
              <Pressable
                onPress={() => setShowSearch(true)}
                className="bg-gray-50 rounded-[16px] px-4 py-4 border border-gray-100 active:bg-gray-100"
              >
                <Text
                  className={`font-sans text-sm ${street ? "text-gray-900" : "text-gray-400"}`}
                  numberOfLines={2}
                >
                  {street || "Search address"}
                </Text>
              </Pressable>
            )}
            {latitude != null && longitude != null && !showSearch && (
              <Text className="text-[11px] font-sans text-gray-400 mt-1.5">
                Location pinned
              </Text>
            )}
          </View>

          <View className="mb-4">
            <Input
              label="City"
              placeholder="Abuja"
              value={city}
              onChangeText={setCity}
            />
          </View>

          <View className="mb-4">
            <Input
              label="State"
              placeholder="FCT"
              value={state}
              onChangeText={setState}
            />
          </View>

          <View className="mb-6">
            <Input
              label="Postcode (optional)"
              placeholder="900001"
              value={postcode}
              onChangeText={setPostcode}
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
              disabled={!canSave}
              loading={isSaving}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
