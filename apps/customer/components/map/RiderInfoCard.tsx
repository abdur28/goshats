import { COLORS } from "@/constants/theme";
import { formatDistance } from "@/lib/format";
import { haversineDistance } from "@/lib/geo";
import { useLocationStore } from "@/store/location-store";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { Rider } from "@goshats/types";
import { Avatar, StarRating, TierBadge } from "@goshats/ui";
import { Car } from "iconsax-react-native";
import React, { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

interface RiderInfoCardProps {
  rider: Rider;
  onBook: (rider: Rider) => void;
  onDismiss: () => void;
}

export default function RiderInfoCard({
  rider,
  onBook,
  onDismiss,
}: RiderInfoCardProps) {
  const translateY = useSharedValue(200);
  const currentLocation = useLocationStore((s) => s.currentLocation);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 18, stiffness: 120 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const isBike =
    rider.vehicleType === "motorcycle" || rider.vehicleType === "bicycle";

  // Calculate distance from user to rider
  const distanceMeters =
    currentLocation && rider.currentLocation
      ? haversineDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          rider.currentLocation.latitude,
          rider.currentLocation.longitude,
        ) * 1000
      : null;

  // Rough ETA: assume average 25 km/h in city
  const etaMinutes = distanceMeters
    ? Math.max(1, Math.round((distanceMeters / 1000 / 25) * 60))
    : null;

  return (
    <Pressable
      className="absolute left-0 right-0 z-[100]"
      style={{ bottom: 0, paddingBottom: 250 }}
      onPress={onDismiss}
    >
      <Animated.View style={animatedStyle} className="mx-4">
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-5">
            {/* Top row: Avatar + info + tier */}
            <View className="flex-row items-center">
              <Avatar
                uri={rider.profilePhotoUrl}
                name={`${rider.surname} ${rider.otherName}`}
                size="lg"
              />

              <View className="flex-1 ml-4">
                <Text
                  className="font-sans-bold text-lg text-gray-900"
                  numberOfLines={1}
                >
                  {rider.otherName} {rider.surname}
                </Text>

                <View className="flex-row items-center mt-1 gap-2">
                  <StarRating rating={rider.averageRating} size={14} />
                  <Text className="font-sans text-xs text-gray-500">
                    {rider.averageRating.toFixed(1)} ({rider.totalRatings})
                  </Text>
                </View>
              </View>

              <TierBadge tier={rider.tier} />
            </View>

            {/* Vehicle + Distance + ETA row */}
            <View className="flex-row items-center mt-4 gap-4">
              {/* Vehicle */}
              <View className="flex-row items-center bg-gray-50 rounded-full px-3 py-2">
                {isBike ? (
                  <MaterialCommunityIcons
                    name={
                      rider.vehicleType === "bicycle" ? "bicycle" : "motorbike"
                    }
                    size={16}
                    color={COLORS.textSecondary}
                  />
                ) : (
                  <Car
                    size={16}
                    color={COLORS.textSecondary}
                    variant="Linear"
                  />
                )}
                <Text className="font-sans text-xs text-gray-600 ml-1.5">
                  {rider.vehicleModel || rider.vehiclePlate}
                </Text>
              </View>

              {/* Distance */}
              {distanceMeters != null && (
                <View className="flex-row items-center">
                  <View className="w-1.5 h-1.5 rounded-full bg-gray-300 mr-2" />
                  <Text className="font-sans-semibold text-xs text-gray-600">
                    {formatDistance(distanceMeters)}
                  </Text>
                </View>
              )}

              {/* ETA */}
              {etaMinutes != null && (
                <View className="flex-row items-center">
                  <View className="w-1.5 h-1.5 rounded-full bg-gray-300 mr-2" />
                  <Text className="font-sans-semibold text-xs text-primary">
                    {etaMinutes} min
                  </Text>
                </View>
              )}
            </View>

            {/* Book Button */}
            <Pressable
              onPress={() => onBook(rider)}
              className="bg-primary mt-4 py-3.5 rounded-full items-center active:opacity-80"
            >
              <Text className="font-sans-bold text-white text-base">
                Book this rider
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Animated.View>
    </Pressable>
  );
}
