import { useEffect, useCallback, useRef } from "react";
import * as Location from "expo-location";
import { useLocationStore } from "@/store/location-store";

export function useLocation() {
  const store = useLocationStore();
  const hasGeocodedRef = useRef(false);

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
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 50,
        },
        async (location) => {
          const { latitude, longitude, heading } = location.coords;

          store.setCurrentLocation(latitude, longitude);
          store.setIsWatching(true);

          // Track heading for directional markers
          if (heading != null && heading >= 0) {
            store.setHeading(heading);
          }

          // Reverse geocode on first position only
          if (!hasGeocodedRef.current) {
            hasGeocodedRef.current = true;
            try {
              const [result] = await Location.reverseGeocodeAsync({
                latitude,
                longitude,
              });
              if (result) {
                const parts = [
                  result.name,
                  result.district || result.subregion,
                  result.city,
                ].filter(Boolean);
                store.setCurrentAddress(parts.join(", "));
              }
            } catch {
              // Reverse geocoding can fail silently
            }
          }
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
    heading: store.heading,
    hasPermission: store.hasPermission,
    requestPermission,
  };
}
