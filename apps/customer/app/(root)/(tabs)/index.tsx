import BottomSheet from "@gorhom/bottom-sheet";
import type { Rider } from "@goshats/types";
import { Avatar } from "@goshats/ui";
import { router } from "expo-router";
import { Add, Gps, Notification, SearchNormal1 } from "iconsax-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomSheetContent from "../../../components/home/BottomSheetContent";
import PlacesAutocomplete from "../../../components/map/PlacesAutocomplete";
import RiderInfoCard from "../../../components/map/RiderInfoCard";
import RiderMarker from "../../../components/map/RiderMarker";
import UserLocationMarker from "../../../components/map/UserLocationMarker";
import { COLORS } from "../../../constants/theme";
import { useLocation } from "../../../hooks/use-location";
import { useNearbyRiders } from "../../../hooks/use-nearby-riders";
import type { PlaceDetails } from "../../../lib/maps";
import { useAuthStore } from "../../../store/auth-store";
import { useBookingStore } from "../../../store/booking-store";
import { useMapStore } from "../../../store/map-store";

const ABUJA_REGION = {
  latitude: 9.0765,
  longitude: 7.3986,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { userProfile } = useAuthStore();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const mapRef = useRef<MapView>(null);
  const snapPoints = useMemo(() => ["25%", "50%", "90%"], []);

  // Location + riders
  const { location, heading } = useLocation();
  const { riders } = useNearbyRiders(10);

  // Map UI state
  const selectedRiderId = useMapStore((s) => s.selectedRiderId);
  const setSelectedRider = useMapStore((s) => s.setSelectedRider);
  const clearSelectedRider = useMapStore((s) => s.clearSelectedRider);

  // Booking
  const { setDropoff, setPickup, resetBooking } = useBookingStore();

  // Search modal
  const [showSearch, setShowSearch] = useState(false);

  // Recenter button — shows when user pans away
  const [showRecenter, setShowRecenter] = useState(false);

  // Animate to user location on first fix
  const hasAnimatedRef = useRef(false);
  if (location && !hasAnimatedRef.current && mapRef.current) {
    hasAnimatedRef.current = true;
    mapRef.current.animateToRegion(
      {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.01,
      },
      800,
    );
  }

  const handleRiderPress = useCallback(
    (rider: Rider) => {
      setSelectedRider(rider.uid);
      // Collapse bottom sheet to make room for rider card
      bottomSheetRef.current?.snapToIndex(0);
      if (rider.currentLocation && mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude: rider.currentLocation.latitude,
            longitude: rider.currentLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.005,
          },
          500,
        );
      }
    },
    [setSelectedRider],
  );

  const handleBookRider = useCallback(
    (rider: Rider) => {
      clearSelectedRider();
      resetBooking();
      // Pre-select this rider
      useBookingStore.getState().setRider(rider.uid, rider.tier, rider.tier === "premium" ? 1.5 : rider.tier === "express" ? 2.0 : 1.0);
      if (location) {
        setPickup({
          address: "",
          location: { latitude: location.latitude, longitude: location.longitude },
          contactName: userProfile?.otherName
            ? `${userProfile.otherName} ${userProfile.surname ?? ""}`.trim()
            : "",
          contactPhone: "",
          notes: "",
        });
      }
      router.push("/(booking)/location" as any);
    },
    [clearSelectedRider, resetBooking, setPickup, location, userProfile],
  );

  const handlePlaceSelected = useCallback(
    (place: PlaceDetails) => {
      setShowSearch(false);
      // Set dropoff from search, pickup from current location, then navigate
      resetBooking();
      setDropoff({
        address: place.address,
        location: { latitude: place.latitude, longitude: place.longitude },
        contactName: "",
        contactPhone: "",
        notes: "",
      });
      if (location) {
        setPickup({
          address: "",
          location: { latitude: location.latitude, longitude: location.longitude },
          contactName: userProfile?.otherName
            ? `${userProfile.otherName} ${userProfile.surname ?? ""}`.trim()
            : "",
          contactPhone: "",
          notes: "",
        });
      }
      router.push("/(booking)/location" as any);
    },
    [location, userProfile, resetBooking, setDropoff, setPickup],
  );

  const handleMapPress = useCallback(() => {
    if (selectedRiderId) {
      clearSelectedRider();
    }
  }, [selectedRiderId, clearSelectedRider]);

  const handleRegionChange = useCallback(
    (region: { latitude: number; longitude: number }) => {
      if (!location) return;
      const drift =
        Math.abs(region.latitude - location.latitude) +
        Math.abs(region.longitude - location.longitude);
      setShowRecenter(drift > 0.003);
    },
    [location],
  );

  const handleRecenter = useCallback(() => {
    if (!location || !mapRef.current) return;
    mapRef.current.animateToRegion(
      {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.01,
      },
      600,
    );
    setShowRecenter(false);
  }, [location]);

  const selectedRider = riders.find((r) => r.uid === selectedRiderId) ?? null;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        initialRegion={
          location
            ? {
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.01,
              }
            : ABUJA_REGION
        }
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsPointsOfInterests={false}
        mapPadding={{ top: 180, bottom: 200, left: 0, right: 0 }}
        onPress={handleMapPress}
        onRegionChangeComplete={handleRegionChange}
      >
        {/* User location */}
        {location && (
          <UserLocationMarker
            latitude={location.latitude}
            longitude={location.longitude}
            heading={heading}
          />
        )}

        {/* Nearby riders */}
        {riders.map((rider) => (
          <RiderMarker
            key={rider.uid}
            rider={rider}
            onPress={handleRiderPress}
          />
        ))}
      </MapView>

      {/* Recenter button */}
      {showRecenter && location && (
        <Pressable
          onPress={handleRecenter}
          className="absolute right-5 z-20 bg-white w-12 h-12 rounded-full items-center justify-center shadow-sm border border-gray-100 active:bg-gray-50"
          style={{ bottom: 240 }}
        >
          <Gps size={22} color={COLORS.primary} variant="Bold" />
        </Pressable>
      )}

      {/* Top Header */}
      <View
        className="bg-white rounded-b-[32px] shadow-sm z-10 w-full absolute top-0"
        style={{
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: 24,
          paddingHorizontal: 20,
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <Avatar
              uri={userProfile?.profilePhotoUrl as string | undefined}
              name={userProfile?.otherName || ""}
              size="md"
            />
            <View>
              <Text className="text-xs font-sans text-gray-500 tracking-widest mb-0.5">
                {getGreeting()}
              </Text>
              <Text className="text-lg font-sans-bold text-gray-900 leading-tight">
                {userProfile?.otherName || ""} {userProfile?.surname || ""}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => router.push("/notifications" as any)}
            className="bg-gray-50 p-3 rounded-full border border-gray-100 shadow-sm active:bg-gray-100"
          >
            <View className="absolute top-3 right-3.5 w-2 h-2 rounded-full bg-red-500 z-10 border border-white" />
            <Notification size={20} color={COLORS.primary} variant="Bold" />
          </Pressable>
        </View>

        {/* Search Bar */}
        <Pressable
          onPress={() => setShowSearch(true)}
          className="mt-6 flex-row items-center bg-gray-50 rounded-full px-4 py-3 border border-gray-100 shadow-sm active:bg-gray-100"
        >
          <SearchNormal1 size={18} color="#9CA3AF" />
          <Text className="flex-1 ml-3 font-sans text-gray-400 text-[13px]">
            Where are you sending to?
          </Text>
          <View className="bg-primary p-1.5 rounded-full ml-2">
            <Add size={18} color="#FFFFFF" variant="Linear" />
          </View>
        </Pressable>
      </View>

      {/* Rider Info Card */}
      {selectedRider && (
        <RiderInfoCard
          rider={selectedRider}
          onBook={handleBookRider}
          onDismiss={clearSelectedRider}
        />
      )}

      {/* Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose={false}
        handleIndicatorStyle={{
          backgroundColor: "#D1D5DB",
          width: 40,
          height: 4,
        }}
        containerStyle={{ zIndex: 99, elevation: 99 }}
        backgroundStyle={{ borderRadius: 32, backgroundColor: "#F9FAFB" }}
      >
        <BottomSheetContent riderCount={riders.length} />
      </BottomSheet>

      {/* Search Modal */}
      <Modal
        visible={showSearch}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSearch(false)}
      >
        <View
          className="flex-1 bg-gray-50"
          style={{ paddingTop: Math.max(insets.top, 16) }}
        >
          <View className="px-5">
            <View className="flex-row items-center mb-4">
              <Text className="flex-1 font-sans-bold text-xl text-gray-900">
                Search location
              </Text>
              <Pressable
                onPress={() => setShowSearch(false)}
                className="active:opacity-80"
              >
                <Text className="font-sans-semibold text-sm text-primary">
                  Cancel
                </Text>
              </Pressable>
            </View>

            <PlacesAutocomplete
              placeholder="Where are you going?"
              onPlaceSelected={handlePlaceSelected}
              autoFocus
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
