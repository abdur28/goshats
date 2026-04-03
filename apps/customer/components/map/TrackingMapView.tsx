import { COLORS } from "@/constants/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { listenToTracking } from "@goshats/firebase";
import type { OrderStatus, TrackingPoint } from "@goshats/types";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import RoutePolyline from "./RoutePolyline";

interface TrackingMapViewProps {
  orderId: string | null;
  destination: { latitude: number; longitude: number };
  pickup?: { latitude: number; longitude: number };
  riderLocation?: { latitude: number; longitude: number };
  status?: OrderStatus;
}

function RiderMarkerIcon() {
  return (
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
      <MaterialCommunityIcons name="motorbike" size={18} color="#fff" />
    </View>
  );
}

function PickupMarkerIcon() {
  return (
    <View
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: "#fff",
      }}
    >
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: "#fff",
        }}
      />
    </View>
  );
}

export default function TrackingMapView({
  orderId,
  destination,
  pickup,
  riderLocation,
  status,
}: TrackingMapViewProps) {
  const mapRef = useRef<MapView>(null);
  const [riderPosition, setRiderPosition] = useState<TrackingPoint | null>(
    null,
  );
  const [etaSeconds, setEtaSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (!orderId) return;
    const unsubscribe = listenToTracking(orderId, (point) => {
      if (point) {
        setRiderPosition(point);
        mapRef.current?.animateToRegion(
          {
            latitude: point.location.latitude,
            longitude: point.location.longitude,
            latitudeDelta: 0.008,
            longitudeDelta: 0.004,
          },
          600,
        );
      }
    });
    return () => unsubscribe();
  }, [orderId]);

  const riderCoord = riderPosition?.location ?? riderLocation ?? null;
  const riderLat = riderCoord?.latitude ?? null;
  const riderLng = riderCoord?.longitude ?? null;
  const heading = riderPosition?.headingDegrees ?? 0;
  const hasRider = !!riderCoord;
  const pickupLat = pickup?.latitude ?? null;
  const pickupLng = pickup?.longitude ?? null;

  const riderMarker = useMemo(() => {
    if (!riderLat || !riderLng) return null;
    return (
      <Marker
        coordinate={{ latitude: riderLat, longitude: riderLng }}
        anchor={{ x: 0.5, y: 0.5 }}
        tracksViewChanges={false}
        rotation={heading}
      >
        <RiderMarkerIcon />
      </Marker>
    );
  }, [riderLat, riderLng, heading]);

  const pickupMarker = useMemo(() => {
    if (!pickupLat || !pickupLng || hasRider) return null;
    return (
      <Marker
        coordinate={{ latitude: pickupLat, longitude: pickupLng }}
        anchor={{ x: 0.5, y: 0.5 }}
        tracksViewChanges={false}
      >
        <PickupMarkerIcon />
      </Marker>
    );
  }, [pickupLat, pickupLng, hasRider]);

  const routeTarget =
    status === "accepted" || status === "arrived_pickup"
      ? pickup ?? destination
      : destination;

  return (
    <View
      style={{ flex: 1, overflow: "hidden", borderRadius: 24 }}
    >
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
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
        {riderCoord && (
          <RoutePolyline
            pickup={riderCoord}
            dropoff={routeTarget}
            hidePickupMarker
            onRouteInfo={(info) => setEtaSeconds(info.durationSeconds)}
          />
        )}
        {pickupMarker}
        {riderMarker}
      </MapView>

      {etaSeconds !== null && (
        <View
          style={{
            position: "absolute",
            bottom: 12,
            right: 12,
            backgroundColor: "#fff",
            borderRadius: 20,
            paddingHorizontal: 14,
            paddingVertical: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
            elevation: 2,
          }}
        >
          <Text
            style={{
              fontFamily: "PolySans-Bulky",
              fontSize: 12,
              color: "#111827",
            }}
          >
            {Math.round(etaSeconds / 60)} min away
          </Text>
        </View>
      )}
    </View>
  );
}
