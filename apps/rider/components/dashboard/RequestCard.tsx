import { COLORS } from "@/constants/theme";
import { formatNaira } from "@/lib/format";
import RoutePolyline from "@/components/map/RoutePolyline";
import type { Order } from "@goshats/types";
import { Location, MoneyTick, Timer1 } from "iconsax-react-native";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";

interface RequestCardProps {
  order: Order;
  onAccept: () => void;
  onReject: () => void;
  onPress: () => void;
}

export function RequestCard({ order, onAccept, onReject, onPress }: RequestCardProps) {
  const [timeLeft, setTimeLeft] = useState(60);
  const mapRef = useRef<MapView>(null);

  const pickupLat = order.pickup?.location?.latitude ?? 6.5244;
  const pickupLng = order.pickup?.location?.longitude ?? 3.3792;
  const dropoffLat = order.dropoff?.location?.latitude ?? 6.5244;
  const dropoffLng = order.dropoff?.location?.longitude ?? 3.3792;

  const pickup = { latitude: pickupLat, longitude: pickupLng };
  const dropoff = { latitude: dropoffLat, longitude: dropoffLng };

  useEffect(() => {
    if (timeLeft <= 0) {
      onReject();
      return;
    }
    const timer = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Fit map to show both pickup and dropoff
  useEffect(() => {
    const timer = setTimeout(() => {
      mapRef.current?.fitToCoordinates([pickup, dropoff], {
        edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
        animated: false,
      });
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const isDanger = timeLeft <= 15;
  const earnings = (order.fareAmountKobo ?? 0) + (order.tipAmountKobo ?? 0);
  const progressPct = (timeLeft / 60) * 100;

  return (
    <View
      className="bg-white rounded-3xl border border-gray-100 overflow-hidden mb-3"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      {/* Progress bar */}
      <View className="h-1 bg-gray-100">
        <View
          className="h-full"
          style={{
            width: `${progressPct}%`,
            backgroundColor: isDanger ? "#EF4444" : COLORS.primary,
          }}
        />
      </View>

      {/* Mini Map — tap to show route on main map */}
      <Pressable onPress={onPress} style={{ opacity: 1 }}>
        <View pointerEvents="none" style={{ height: 140 }}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={StyleSheet.absoluteFillObject}
            initialRegion={{
              latitude: (pickupLat + dropoffLat) / 2,
              longitude: (pickupLng + dropoffLng) / 2,
              latitudeDelta: Math.abs(pickupLat - dropoffLat) * 2.5 || 0.02,
              longitudeDelta: Math.abs(pickupLng - dropoffLng) * 2.5 || 0.01,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
            showsUserLocation={false}
            showsMyLocationButton={false}
            showsCompass={false}
            showsPointsOfInterests={false}
            showsTraffic={false}
            showsBuildings={false}
          >
            <RoutePolyline pickup={pickup} dropoff={dropoff} showInfoChip={false} />
          </MapView>
        </View>
        <View className="absolute bottom-2 right-2 rounded-full px-2 py-0.5" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
          <Text className="font-sans text-[10px] text-white">Tap for full route</Text>
        </View>
      </Pressable>

      <View className="p-4 gap-3">
        {/* Timer + earnings */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View
              className="w-8 h-8 rounded-full items-center justify-center"
              style={{ backgroundColor: isDanger ? "#FEF2F2" : `${COLORS.primary}15` }}
            >
              <Timer1 size={15} color={isDanger ? "#EF4444" : COLORS.primary} variant="Bold" />
            </View>
            <View>
              <Text className="font-sans-bold text-[15px] text-gray-900">New Request</Text>
              <Text
                className="font-sans text-[11px]"
                style={{ color: isDanger ? "#EF4444" : "#9CA3AF" }}
              >
                {timeLeft}s remaining
              </Text>
            </View>
          </View>
          <View className="flex-row items-center gap-1">
            <MoneyTick size={15} color={COLORS.primary} variant="Bold" />
            <Text className="font-sans-bold text-[17px]" style={{ color: COLORS.primary }}>
              {formatNaira(earnings)}
            </Text>
          </View>
        </View>

        {/* Route */}
        <View className="bg-gray-50 rounded-2xl p-3 gap-2">
          <View className="flex-row items-center gap-2.5">
            <View className="w-2 h-2 rounded-full bg-gray-900" />
            <Text
              className="font-sans-medium text-[13px] text-gray-900 flex-1"
              numberOfLines={1}
            >
              {order.pickup?.address ?? "Pickup location"}
            </Text>
          </View>
          <View className="w-px h-3 bg-gray-300 ml-[3px]" />
          <View className="flex-row items-center gap-2.5">
            <Location size={10} color={COLORS.primary} variant="Bold" />
            <Text
              className="font-sans-medium text-[13px] text-gray-900 flex-1"
              numberOfLines={1}
            >
              {order.dropoff?.address ?? "Dropoff location"}
            </Text>
          </View>
        </View>

        {/* Buttons */}
        <View className="flex-row gap-2.5">
          <Pressable
            onPress={onReject}
            style={{
              flex: 1,
              paddingVertical: 14,
              borderRadius: 9999,
              backgroundColor: "#F3F4F6",
              alignItems: "center",
            }}
          >
            <Text className="font-sans-bold text-[14px] text-gray-700">Decline</Text>
          </Pressable>
          <Pressable
            onPress={onAccept}
            style={{
              flex: 2,
              paddingVertical: 14,
              borderRadius: 9999,
              alignItems: "center",
              backgroundColor: COLORS.primary,
            }}
          >
            <Text className="font-sans-bold text-[14px] text-white">Accept</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
