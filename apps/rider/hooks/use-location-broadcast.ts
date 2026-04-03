import { useState, useEffect, useCallback, useRef } from "react";
import * as Location from "expo-location";
import { updateRiderLocation } from "@goshats/firebase";
import { addTrackingPoint } from "@goshats/firebase/src/firestore/tracking";
import { useAuthStore } from "@/store/auth-store";
import { useDeliveryStore } from "@/store/delivery-store";
import { useLocationStore } from "@/store/location-store";
import { LOCATION_BROADCAST_INTERVAL } from "@/constants/app";

export function useLocationBroadcast() {
  const user = useAuthStore((s) => s.user);
  const setCurrentLocation = useLocationStore((s) => s.setCurrentLocation);
  const activeOrder = useDeliveryStore((s) => s.activeOrder);
  const activeOrderRef = useRef(activeOrder);
  activeOrderRef.current = activeOrder;
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const start = useCallback(async () => {
    if (!user || isBroadcasting) return;

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;

    setIsBroadcasting(true);

    // Watch position for local updates
    subscriptionRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 10,
      },
      (location) => {
        setCurrentLocation(
          location.coords.latitude,
          location.coords.longitude
        );
      }
    );

    const broadcastLocation = async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        const { latitude, longitude, heading, speed } = loc.coords;

        await updateRiderLocation(user.uid, latitude, longitude);

        // Also write to active order's tracking subcollection
        const order = activeOrderRef.current;
        if (order) {
          await addTrackingPoint(order.id, {
            location: { latitude, longitude },
            headingDegrees: heading ?? 0,
            speedKmh: speed != null ? speed * 3.6 : 0,
          });
        }
      } catch {
        // Silently fail on individual broadcasts
      }
    };

    // Broadcast immediately on start
    broadcastLocation().catch(() => {});

    // Then broadcast at intervals
    intervalRef.current = setInterval(broadcastLocation, LOCATION_BROADCAST_INTERVAL);
  }, [user, isBroadcasting]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    setIsBroadcasting(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { isBroadcasting, start, stop };
}
