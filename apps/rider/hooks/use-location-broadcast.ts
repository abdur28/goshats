import { useState, useEffect, useCallback, useRef } from "react";
import * as Location from "expo-location";
import { updateRiderLocation } from "@goshats/firebase";
import { useAuthStore } from "@/store/auth-store";
import { useLocationStore } from "@/store/location-store";
import { LOCATION_BROADCAST_INTERVAL } from "@/constants/app";

export function useLocationBroadcast() {
  const user = useAuthStore((s) => s.user);
  const setCurrentLocation = useLocationStore((s) => s.setCurrentLocation);
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

    // Broadcast to Firestore at intervals
    intervalRef.current = setInterval(async () => {
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        await updateRiderLocation(
          user.uid,
          location.coords.latitude,
          location.coords.longitude
        );
      } catch {
        // Silently fail on individual broadcasts
      }
    }, LOCATION_BROADCAST_INTERVAL);

    // Broadcast immediately on start
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      await updateRiderLocation(
        user.uid,
        location.coords.latitude,
        location.coords.longitude
      );
    } catch {
      // Silently fail
    }
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
