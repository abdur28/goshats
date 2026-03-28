import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Marker, Polyline } from "react-native-maps";
import { Location } from "iconsax-react-native";
import { COLORS } from "@/constants/theme";
import { getDirectionsWithCoordinates } from "@/lib/maps";
import { formatDistance, formatDuration } from "@/lib/format";

interface RoutePolylineProps {
  pickup: { latitude: number; longitude: number };
  dropoff: { latitude: number; longitude: number };
  waypoints?: { latitude: number; longitude: number }[];
  showInfoChip?: boolean;
}

export default function RoutePolyline({
  pickup,
  dropoff,
  waypoints,
  showInfoChip = true,
}: RoutePolylineProps) {
  const [coordinates, setCoordinates] = useState<
    { latitude: number; longitude: number }[]
  >([]);
  const [routeInfo, setRouteInfo] = useState<{
    distanceMeters: number;
    durationSeconds: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const result = await getDirectionsWithCoordinates(
        pickup,
        dropoff,
        waypoints
      );
      if (!cancelled && result) {
        setCoordinates(result.coordinates);
        setRouteInfo({
          distanceMeters: result.distanceMeters,
          durationSeconds: result.durationSeconds,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pickup.latitude, pickup.longitude, dropoff.latitude, dropoff.longitude]);

  return (
    <>
      {/* Route polyline */}
      {coordinates.length > 0 && (
        <Polyline
          coordinates={coordinates}
          strokeColor={COLORS.primary}
          strokeWidth={4}
          lineDashPattern={undefined}
        />
      )}

      {/* Pickup marker */}
      <Marker coordinate={pickup} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: COLORS.primary,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: "#FFFFFF",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.15,
            shadowRadius: 2,
            elevation: 3,
          }}
        >
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#FFFFFF" }} />
        </View>
      </Marker>

      {/* Dropoff marker */}
      <Marker coordinate={dropoff} anchor={{ x: 0.5, y: 1 }} tracksViewChanges={false}>
        <View style={{ alignItems: "center" }}>
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderWidth: 2,
              borderColor: COLORS.accent,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.15,
              shadowRadius: 2,
              elevation: 3,
            }}
          >
            <Location size={18} color={COLORS.accent} variant="Bold" />
          </View>
          <View
            style={{
              width: 0,
              height: 0,
              backgroundColor: "transparent",
              borderStyle: "solid",
              borderLeftWidth: 6,
              borderRightWidth: 6,
              borderTopWidth: 7,
              borderLeftColor: "transparent",
              borderRightColor: "transparent",
              borderTopColor: COLORS.accent,
              marginTop: -1,
            }}
          />
        </View>
      </Marker>

      {/* Waypoint markers */}
      {waypoints?.map((wp, i) => (
        <Marker
          key={`wp-${i}`}
          coordinate={wp}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
        >
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: "#FFFFFF",
              borderWidth: 2,
              borderColor: COLORS.primary,
              alignItems: "center",
              justifyContent: "center",
              elevation: 3,
            }}
          >
            <Text style={{ fontFamily: "PolySans-Bulky", fontSize: 10, color: COLORS.primary }}>
              {i + 1}
            </Text>
          </View>
        </Marker>
      ))}

      {/* Floating distance/time chip */}
      {showInfoChip && routeInfo && (
        <Marker
          coordinate={
            coordinates.length > 0
              ? coordinates[Math.floor(coordinates.length / 2)]
              : pickup
          }
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
        >
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 6,
              elevation: 3,
              borderWidth: 1,
              borderColor: "#F3F4F6",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Text style={{ fontFamily: "PolySans-Bulky", fontSize: 12, color: COLORS.primary }}>
              {formatDistance(routeInfo.distanceMeters)}
            </Text>
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: "#D1D5DB", marginHorizontal: 8 }} />
            <Text style={{ fontFamily: "PolySans-Median", fontSize: 12, color: "#4B5563" }}>
              {formatDuration(routeInfo.durationSeconds)}
            </Text>
          </View>
        </Marker>
      )}
    </>
  );
}
