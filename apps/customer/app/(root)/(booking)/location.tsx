import BookingMapView from "@/components/map/BookingMapView";
import PlacesAutocomplete from "@/components/map/PlacesAutocomplete";
import { COLORS } from "@/constants/theme";
import type { PlaceDetails } from "@/lib/maps";
import { useBookingStore } from "@/store/booking-store";
import { useLocationStore } from "@/store/location-store";
import { Header } from "@goshats/ui";
import { router } from "expo-router";
import { Add, CloseCircle, Gps } from "iconsax-react-native";
import React, { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LocationScreen() {
  const {
    pickup,
    dropoff,
    setPickup,
    setDropoff,
    extraStops,
    addStop,
    removeStop,
  } = useBookingStore();
  const currentLocation = useLocationStore((s) => s.currentLocation);
  const currentAddress = useLocationStore((s) => s.currentAddress);

  const [activeField, setActiveField] = useState<
    "pickup" | "dropoff" | "stop" | null
  >(dropoff ? null : "dropoff");
  const [editingStopIndex, setEditingStopIndex] = useState<number | null>(null);

  const handlePickupSelected = useCallback(
    (place: PlaceDetails) => {
      setPickup({
        address: place.address,
        location: { latitude: place.latitude, longitude: place.longitude },
        contactName: "",
        contactPhone: "",
        notes: "",
      });
      setActiveField(null);
    },
    [setPickup],
  );

  const handleDropoffSelected = useCallback(
    (place: PlaceDetails) => {
      setDropoff({
        address: place.address,
        location: { latitude: place.latitude, longitude: place.longitude },
        contactName: "",
        contactPhone: "",
        notes: "",
      });
      setActiveField(null);
    },
    [setDropoff],
  );

  const handleStopSelected = useCallback(
    (place: PlaceDetails) => {
      addStop({
        address: place.address,
        location: { latitude: place.latitude, longitude: place.longitude },
        contactName: "",
        contactPhone: "",
        notes: "",
      });
      setActiveField(null);
      setEditingStopIndex(null);
    },
    [addStop],
  );

  const handleUseCurrentLocation = useCallback(() => {
    if (!currentLocation) return;
    setPickup({
      address: currentAddress || "Current location",
      location: {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      },
      contactName: "",
      contactPhone: "",
      notes: "",
    });
    setActiveField(null);
  }, [currentLocation, currentAddress, setPickup]);

  const canProceed = pickup && dropoff;

  const showMap = pickup?.location && dropoff?.location && !activeField;

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Header title="Set locations" onBack={() => router.back()} />

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Location inputs card */}
          <View className="mx-5 mt-4 bg-white rounded-[24px] border border-gray-100 shadow-sm p-5">
            {/* Pickup */}
            <View className="flex-row items-start">
              <View className="items-center mr-3 ">
                <View className="w-3 h-3 rounded-full bg-primary border-2 border-primary/30" />
                <View className="w-0.5 h-10 bg-gray-200 my-2" />
              </View>

              <View className="flex-1">
                <Text className="font-sans-medium text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">
                  Pickup
                </Text>
                {activeField === "pickup" ? (
                  <PlacesAutocomplete
                    placeholder="Search pickup location"
                    onPlaceSelected={handlePickupSelected}
                    initialValue={pickup?.address || ""}
                    autoFocus
                  />
                ) : (
                  <Pressable
                    onPress={() => setActiveField("pickup")}
                    className="bg-gray-50 rounded-full px-4 py-3 border border-gray-100 active:bg-gray-100"
                  >
                    <Text
                      className={`font-sans text-sm ${pickup?.address ? "text-gray-900" : "text-gray-400"}`}
                      numberOfLines={1}
                    >
                      {pickup?.address || "Set pickup location"}
                    </Text>
                  </Pressable>
                )}

                {/* Use current location shortcut */}
                {activeField === "pickup" && currentLocation && (
                  <Pressable
                    onPress={handleUseCurrentLocation}
                    className="flex-row items-center justify-end mt-2 active:opacity-70"
                  >
                    <Gps size={14} color={COLORS.primary} variant="Bold" />
                    <Text className="font-sans-medium text-xs text-primary ml-1.5">
                      Use current location
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* Dropoff */}
            <View className="flex-row items-start mt-2">
              <View className="items-center mr-3">
                <View className="w-3 h-3 rounded-full bg-accent border-2 border-accent/30" />
              </View>

              <View className="flex-1">
                <Text className="font-sans-medium text-[10px] text-gray-400 uppercase tracking-wider mb-1.5">
                  Dropoff
                </Text>
                {activeField === "dropoff" ? (
                  <PlacesAutocomplete
                    placeholder="Where are you sending to?"
                    onPlaceSelected={handleDropoffSelected}
                    initialValue={dropoff?.address || ""}
                    autoFocus
                  />
                ) : (
                  <Pressable
                    onPress={() => setActiveField("dropoff")}
                    className="bg-gray-50 rounded-full px-4 py-3 border border-gray-100 active:bg-gray-100"
                  >
                    <Text
                      className={`font-sans text-sm ${dropoff?.address ? "text-gray-900" : "text-gray-400"}`}
                      numberOfLines={1}
                    >
                      {dropoff?.address || "Set dropoff location"}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* Extra stops */}
            {extraStops.map((stop, index) => (
              <View key={index} className="flex-row items-start mt-3">
                <View className="items-center mr-3 pt-1">
                  <View className="w-3 h-3 rounded-full bg-info border-2 border-info/30" />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center justify-between mb-1.5">
                    <Text className="font-sans-medium text-[10px] text-gray-400 uppercase tracking-wider">
                      Stop {index + 1}
                    </Text>
                    <Pressable
                      onPress={() => removeStop(index)}
                      hitSlop={8}
                      className="active:opacity-70"
                    >
                      <CloseCircle size={16} color="#9CA3AF" variant="Bold" />
                    </Pressable>
                  </View>
                  <View className="bg-gray-50 rounded-full px-4 py-3 border border-gray-100">
                    <Text
                      className="font-sans text-sm text-gray-900"
                      numberOfLines={1}
                    >
                      {stop.address}
                    </Text>
                  </View>
                </View>
              </View>
            ))}

            {/* Add stop button */}
            {activeField === "stop" ? (
              <View className="mt-3 ml-6">
                <PlacesAutocomplete
                  placeholder="Search stop location"
                  onPlaceSelected={handleStopSelected}
                  autoFocus
                  onClear={() => setActiveField(null)}
                />
              </View>
            ) : (
              <Pressable
                onPress={() => setActiveField("stop")}
                className="flex-row items-center mt-4 ml-6 active:opacity-70"
              >
                <View className="w-6 h-6 rounded-full bg-gray-100 items-center justify-center mr-2">
                  <Add size={14} color="#6B7280" />
                </View>
                <Text className="font-sans-medium text-sm text-gray-500">
                  Add a stop
                </Text>
              </Pressable>
            )}
          </View>

          {/* Map preview */}
          {showMap && (
            <View className="mx-5 mt-4 h-[300px] rounded-[24px] overflow-hidden border border-gray-100 shadow-sm">
              <BookingMapView
                pickup={pickup!.location}
                dropoff={dropoff!.location}
                waypoints={extraStops.map((s) => s.location)}
              />
            </View>
          )}
        </ScrollView>

        {/* Continue button */}
        <View
          className="px-5 pt-4 bg-gray-50 border-t border-gray-100"
          style={{ paddingBottom: Platform.OS === "ios" ? 36 : 52 }}
        >
          <Pressable
            onPress={() => router.push("/(booking)/package" as any)}
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
