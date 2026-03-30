import { COLORS } from "@/constants/theme";
import { useNearbyRiders } from "@/hooks/use-nearby-riders";
import { Skeleton } from "@goshats/ui";
import { formatDistance, formatDuration, formatNaira } from "@/lib/format";
import { haversineDistance } from "@/lib/geo";
import { calculateRouteDistance } from "@/lib/maps";
import { calculateFare } from "@/lib/pricing";
import { useBookingStore } from "@/store/booking-store";
import { useLocationStore } from "@/store/location-store";
import { usePricingStore } from "@/store/pricing-store";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { Rider } from "@goshats/types";
import { Avatar, Header, StarRating, TierBadge } from "@goshats/ui";
import { router } from "expo-router";
import { Car } from "iconsax-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RidersScreen() {
  const pickup = useBookingStore((s) => s.pickup);
  const dropoff = useBookingStore((s) => s.dropoff);
  const selectedRiderId = useBookingStore((s) => s.selectedRiderId);
  const setRider = useBookingStore((s) => s.setRider);
  const setPricing = useBookingStore((s) => s.setPricing);
  const currentLocation = useLocationStore((s) => s.currentLocation);
  const pricingSettings = usePricingStore((s) => s.settings);
  const { riders, isLoading, error, refetch } = useNearbyRiders(10);

  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [routeDuration, setRouteDuration] = useState<number | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(true);

  useEffect(() => {
    if (!pickup?.location || !dropoff?.location) {
      setLoadingRoute(false);
      return;
    }
    setLoadingRoute(true);
    calculateRouteDistance(pickup.location, dropoff.location)
      .then((result) => {
        if (result) {
          setRouteDistance(result.distanceMeters);
          setRouteDuration(result.durationSeconds);
        }
      })
      .finally(() => setLoadingRoute(false));
  }, [pickup, dropoff]);

  const sortedRiders = useMemo(() => {
    const loc = pickup?.location || currentLocation;
    if (!loc) return riders;
    return [...riders].sort((a, b) => {
      if (!a.currentLocation || !b.currentLocation) return 0;
      const distA = haversineDistance(
        loc.latitude,
        loc.longitude,
        a.currentLocation.latitude,
        a.currentLocation.longitude,
      );
      const distB = haversineDistance(
        loc.latitude,
        loc.longitude,
        b.currentLocation.latitude,
        b.currentLocation.longitude,
      );
      return distA - distB;
    });
  }, [riders, pickup, currentLocation]);

  const handleSelectRider = (rider: Rider) => {
    const multiplier = pricingSettings?.tierMultipliers[rider.tier] ?? 1.0;
    setRider(rider.uid, rider.tier, multiplier);

    if (pricingSettings && routeDistance != null && routeDuration != null) {
      const pricing = calculateFare(pricingSettings, routeDistance, rider.tier);
      setPricing({
        ...pricing,
        estimatedDistanceMeters: routeDistance,
        estimatedDurationSeconds: routeDuration,
      });
    }
  };

  const handleContinue = () => {
    if (!selectedRiderId) return;
    router.push("/(booking)/summary" as any);
  };

  const renderRider = ({ item: rider }: { item: Rider }) => {
    const isSelected = selectedRiderId === rider.uid;
    const isBike =
      rider.vehicleType === "motorcycle" || rider.vehicleType === "bicycle";

    const loc = pickup?.location || currentLocation;
    const riderDistKm =
      loc && rider.currentLocation
        ? haversineDistance(
            loc.latitude,
            loc.longitude,
            rider.currentLocation.latitude,
            rider.currentLocation.longitude,
          )
        : null;
    const etaMin = riderDistKm
      ? Math.max(1, Math.round((riderDistKm / 25) * 60))
      : null;

    const fare =
      pricingSettings && routeDistance != null
        ? calculateFare(pricingSettings, routeDistance, rider.tier)
        : null;

    return (
      <Pressable
        onPress={() => handleSelectRider(rider)}
        style={{
          marginHorizontal: 20,
          marginBottom: 12,
          padding: 16,
          borderRadius: 20,
          borderWidth: 2,
          borderColor: isSelected ? COLORS.primary : "#F3F4F6",
          backgroundColor: "#FFFFFF",
        }}
      >
        <View className="flex-row items-center">
          <Avatar
            uri={rider.profilePhotoUrl}
            name={`${rider.otherName} ${rider.surname}`}
            size="lg"
          />

          <View className="flex-1 ml-3">
            <View className="flex-row items-center justify-between">
              <Text
                className="font-sans-bold text-base text-gray-900"
                numberOfLines={1}
              >
                {rider.otherName}
              </Text>
              <TierBadge tier={rider.tier} />
            </View>

            <View className="flex-row items-center mt-1 gap-2">
              <StarRating rating={rider.averageRating} size={12} />
              <Text className="font-sans text-xs text-gray-500">
                {rider.averageRating.toFixed(1)}
              </Text>
              <View className="w-1 h-1 rounded-full bg-gray-300" />
              <Text className="font-sans text-xs text-gray-500">
                {rider.totalTrips} trips
              </Text>
            </View>
          </View>

          {fare && (
            <View className="items-end">
              <Text className="font-sans-bold text-base text-gray-900">
                {formatNaira(fare.totalAmountKobo)}
              </Text>
              {etaMin && (
                <Text className="font-sans text-xs text-primary mt-0.5">
                  {etaMin} min away
                </Text>
              )}
            </View>
          )}
        </View>

        <View className="flex-row items-center mt-3 gap-3">
          <View className="flex-row items-center bg-gray-50 rounded-full px-3 py-1.5">
            {isBike ? (
              <MaterialCommunityIcons
                name={rider.vehicleType === "bicycle" ? "bicycle" : "motorbike"}
                size={14}
                color="#6B7280"
              />
            ) : (
              <Car size={14} color="#6B7280" variant="Linear" />
            )}
            <Text className="font-sans text-xs text-gray-600 ml-1.5">
              {rider.vehicleModel}
            </Text>
          </View>
          <Text className="font-sans text-xs text-gray-400">
            {rider.vehiclePlate}
          </Text>
          {riderDistKm != null && (
            <>
              <View className="w-1 h-1 rounded-full bg-gray-300" />
              <Text className="font-sans text-xs text-gray-500">
                {formatDistance(riderDistKm * 1000)} away
              </Text>
            </>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#F9FAFB" }}
      edges={["top"]}
    >
      <Header title="Choose a rider" onBack={() => router.back()} />

      {routeDistance != null && routeDuration != null && (
        <View className="flex-row items-center justify-center py-3 gap-4 border-b border-gray-100">
          <Text className="font-sans-semibold text-sm text-gray-600">
            {formatDistance(routeDistance)}
          </Text>
          <View className="w-1 h-1 rounded-full bg-gray-300" />
          <Text className="font-sans-semibold text-sm text-primary">
            ~{formatDuration(routeDuration)}
          </Text>
        </View>
      )}

      {loadingRoute || isLoading ? (
        <View style={{ paddingTop: 16, paddingHorizontal: 20 }}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={{
                backgroundColor: "#fff",
                borderRadius: 20,
                padding: 16,
                marginBottom: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <Skeleton width={52} height={52} borderRadius={26} />
              <View style={{ flex: 1, gap: 8 }}>
                <Skeleton height={13} width="50%" borderRadius={6} />
                <Skeleton height={11} width="35%" borderRadius={6} />
                <Skeleton height={11} width="60%" borderRadius={6} />
              </View>
              <Skeleton width={70} height={36} borderRadius={18} />
            </View>
          ))}
        </View>
      ) : error ? (
        <View style={{ margin: 20, padding: 16, backgroundColor: "#FEF2F2", borderRadius: 16 }}>
          <Text style={{ fontFamily: "PolySans-Median", fontSize: 13, color: "#EF4444", marginBottom: 8 }}>
            Couldn&apos;t find riders. Check your connection and try again.
          </Text>
          <Pressable onPress={refetch}>
            <Text style={{ fontFamily: "PolySans-Bulky", fontSize: 13, color: COLORS.primary }}>Retry</Text>
          </Pressable>
        </View>
      ) : sortedRiders.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <Text className="font-sans-bold text-lg text-gray-900 text-center">
            No riders available
          </Text>
          <Text className="font-sans text-sm text-gray-500 text-center mt-2">
            There are no riders in your area right now. Please try again later.
          </Text>
        </View>
      ) : (
        <FlatList
          data={sortedRiders}
          keyExtractor={(item) => item.uid}
          renderItem={renderRider}
          extraData={selectedRiderId}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 16,
          backgroundColor: "#F9FAFB",
          borderTopWidth: 1,
          borderTopColor: "#F3F4F6",
          paddingBottom: Platform.OS === "ios" ? 36 : 52,
        }}
      >
        <Pressable
          onPress={handleContinue}
          disabled={!selectedRiderId}
          style={{
            paddingVertical: 16,
            borderRadius: 9999,
            alignItems: "center",
            backgroundColor: selectedRiderId ? COLORS.primary : "#E5E7EB",
          }}
        >
          <Text
            className={`font-sans-bold text-base ${selectedRiderId ? "text-white" : "text-gray-400"}`}
          >
            Continue
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
