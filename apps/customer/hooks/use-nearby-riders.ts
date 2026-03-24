import { useState, useEffect, useCallback } from "react";
import { getNearbyRiders } from "@goshats/firebase";
import type { Rider } from "@goshats/types";
import { useLocationStore } from "@/store/location-store";

export function useNearbyRiders(radiusKm: number = 10) {
  const currentLocation = useLocationStore((s) => s.currentLocation);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRiders = useCallback(async () => {
    if (!currentLocation) return;

    setIsLoading(true);
    setError(null);
    try {
      const result = await getNearbyRiders(
        currentLocation.latitude,
        currentLocation.longitude,
        radiusKm
      );
      setRiders(result);
    } catch (err: any) {
      setError(err.message || "Failed to fetch nearby riders");
    } finally {
      setIsLoading(false);
    }
  }, [currentLocation, radiusKm]);

  useEffect(() => {
    fetchRiders();
  }, [fetchRiders]);

  return { riders, isLoading, error, refetch: fetchRiders };
}
