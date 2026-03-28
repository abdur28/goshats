import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Car } from "iconsax-react-native";
import React, { memo, useEffect, useState } from "react";
import { View } from "react-native";
import { Marker } from "react-native-maps";
import type { Rider } from "@goshats/types";
import { COLORS } from "@/constants/theme";

interface RiderMarkerProps {
  rider: Rider;
  onPress: (rider: Rider) => void;
}

const TIER_COLORS = {
  standard: "#9CA3AF",
  premium: COLORS.accent,
  express: COLORS.primary,
} as const;

function RiderMarkerComponent({ rider, onPress }: RiderMarkerProps) {
  if (!rider.currentLocation) return null;

  // Allow one re-render for icon font to load, then stop tracking
  const [track, setTrack] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setTrack(false), 500);
    return () => clearTimeout(t);
  }, []);

  const tierColor = TIER_COLORS[rider.tier] ?? TIER_COLORS.standard;
  const isBike =
    rider.vehicleType === "motorcycle" || rider.vehicleType === "bicycle";

  return (
    <Marker
      coordinate={{
        latitude: rider.currentLocation.latitude,
        longitude: rider.currentLocation.longitude,
      }}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={track}
      onPress={() => onPress(rider)}
    >
      <View style={{ alignItems: "center" }}>
        {/* Marker pill */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 20,
            width: 42,
            height: 42,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2.5,
            borderColor: tierColor,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 4,
          }}
        >
          {isBike ? (
            <MaterialCommunityIcons
              name={rider.vehicleType === "bicycle" ? "bicycle" : "motorbike"}
              size={22}
              color={COLORS.primary}
            />
          ) : (
            <Car size={22} color={COLORS.primary} variant="Bold" />
          )}
        </View>

        {/* Bottom pointer triangle */}
        <View
          style={{
            width: 0,
            height: 0,
            backgroundColor: "transparent",
            borderStyle: "solid",
            borderLeftWidth: 7,
            borderRightWidth: 7,
            borderTopWidth: 8,
            borderLeftColor: "transparent",
            borderRightColor: "transparent",
            borderTopColor: tierColor,
            marginTop: -1,
          }}
        />
      </View>
    </Marker>
  );
}

export default memo(RiderMarkerComponent);
