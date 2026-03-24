import { useEffect, useCallback } from "react";
import * as Location from "expo-location";
import { useLocationStore } from "@/store/location-store";

export function useLocation() {
  const store = useLocationStore();

  const requestPermission = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    const granted = status === "granted";
    store.setHasPermission(granted);
    return granted;
  }, []);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      const granted = await requestPermission();
      if (!granted) return;

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 20,
        },
        (location) => {
          store.setCurrentLocation(
            location.coords.latitude,
            location.coords.longitude
          );
          store.setIsWatching(true);
        }
      );
    })();

    return () => {
      subscription?.remove();
      store.setIsWatching(false);
    };
  }, []);

  return {
    location: store.currentLocation,
    address: store.currentAddress,
    hasPermission: store.hasPermission,
    requestPermission,
  };
}
