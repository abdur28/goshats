import { MaterialCommunityIcons } from "@expo/vector-icons";
import { listenToTracking } from "@goshats/firebase";
import type { TrackingPoint } from "@goshats/types";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { MAP_STYLE } from "@/constants/map-style";
import RoutePolyline from "./RoutePolyline";

interface TrackingMapViewProps {
  orderId: string;
  destination: { latitude: number; longitude: number };
  pickup?: { latitude: number; longitude: number };
  className?: string;
}

export default function TrackingMapView({
  orderId,
  destination,
  pickup,
  className = "",
}: TrackingMapViewProps) {
  const mapRef = useRef<MapView>(null);
  const [riderPosition, setRiderPosition] = useState<TrackingPoint | null>(
    null
  );

  // Listen to real-time rider position
  useEffect(() => {
    const unsubscribe = listenToTracking(orderId, (point) => {
      if (point) {
        setRiderPosition(point);
        // Smoothly follow rider
        mapRef.current?.animateToRegion(
          {
            latitude: point.location.latitude,
            longitude: point.location.longitude,
            latitudeDelta: 0.008,
            longitudeDelta: 0.004,
          },
          600
        );
      }
    });

    return () => unsubscribe();
  }, [orderId]);

  const riderCoord = riderPosition?.location;

  return (
    <View className={`overflow-hidden rounded-[24px] ${className}`}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        customMapStyle={MAP_STYLE}
        initialRegion={{
          latitude: destination.latitude,
          longitude: destination.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsPointsOfInterests={false}
        scrollEnabled={true}
        zoomEnabled={true}
        pitchEnabled={false}
        rotateEnabled={false}
      >
        {/* Route from rider to destination */}
        {riderCoord && (
          <RoutePolyline
            pickup={riderCoord}
            dropoff={destination}
            showInfoChip
          />
        )}

        {/* Show pickup marker if provided and rider hasn't reached it yet */}
        {pickup && !riderCoord && (
          <Marker
            coordinate={pickup}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View className="w-8 h-8 rounded-full bg-primary items-center justify-center border-2 border-white shadow-sm">
              <View className="w-2.5 h-2.5 rounded-full bg-white" />
            </View>
          </Marker>
        )}

        {/* Animated rider marker */}
        {riderCoord && (
          <Marker
            coordinate={riderCoord}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
            rotation={riderPosition?.headingDegrees ?? 0}
          >
            <View className="bg-primary rounded-full p-2.5 border-2 border-white shadow-sm">
              <MaterialCommunityIcons
                name="motorbike"
                size={20}
                color="#FFFFFF"
              />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Live indicator */}
      {riderCoord && (
        <View className="absolute top-3 left-3 flex-row items-center bg-white rounded-full px-3 py-1.5 shadow-sm border border-gray-100">
          <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
          <Text className="font-sans-bold text-xs text-gray-700">Live</Text>
        </View>
      )}
    </View>
  );
}
