import { COLORS } from "@/constants/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import RoutePolyline from "./RoutePolyline";

interface BookingMapViewProps {
  pickup: { latitude: number; longitude: number };
  dropoff: { latitude: number; longitude: number };
  waypoints?: { latitude: number; longitude: number }[];
  riderLocation?: { latitude: number; longitude: number };
  className?: string;
}

export default function BookingMapView({
  pickup,
  dropoff,
  waypoints,
  riderLocation,
  className = "",
}: BookingMapViewProps) {
  const mapRef = useRef<MapView>(null);

  // Auto-fit to show entire route
  useEffect(() => {
    const allPoints = [pickup, dropoff, ...(waypoints ?? [])];
    if (mapRef.current && allPoints.length >= 2) {
      const timer = setTimeout(() => {
        mapRef.current?.fitToCoordinates(allPoints, {
          edgePadding: { top: 80, right: 60, bottom: 80, left: 60 },
          animated: true,
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [pickup.latitude, pickup.longitude, dropoff.latitude, dropoff.longitude]);

  return (
    <View style={{ flex: 1 }} className={`overflow-hidden rounded-[24px] ${className}`}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: (pickup.latitude + dropoff.latitude) / 2,
          longitude: (pickup.longitude + dropoff.longitude) / 2,
          latitudeDelta:
            Math.abs(pickup.latitude - dropoff.latitude) * 1.8 || 0.02,
          longitudeDelta:
            Math.abs(pickup.longitude - dropoff.longitude) * 1.8 || 0.01,
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
        <RoutePolyline
          pickup={pickup}
          dropoff={dropoff}
          waypoints={waypoints}
          showInfoChip
        />
        {riderLocation && (
          <Marker coordinate={riderLocation} anchor={{ x: 0.5, y: 0.5 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: COLORS.primary,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: "#fff",
              }}
            >
              <MaterialCommunityIcons
                name="motorbike"
                size={18}
                color="#fff"
              />
            </View>
          </Marker>
        )}
      </MapView>
    </View>
  );
}
