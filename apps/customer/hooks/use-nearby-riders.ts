import { useState, useEffect, useCallback } from "react";
import { getNearbyRiders } from "@goshats/firebase";
import type { Rider } from "@goshats/types";
import { useLocationStore } from "@/store/location-store";

export function useNearbyRiders(radiusKm: number = 10) {
  const currentLocation = useLocationStore((s) => s.currentLocation);
  const viewLocation = useLocationStore((s) => s.viewLocation);
  const origin = viewLocation ?? currentLocation;
  const [riders, setRiders] = useState<Rider[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRiders = useCallback(async () => {
    if (!origin) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await getNearbyRiders(
        origin.latitude,
        origin.longitude,
        radiusKm
      );
      setRiders(result);
    } catch (err: any) {
      setError(err.message || "Failed to fetch nearby riders");
    } finally {
      setIsLoading(false);
    }
  }, [origin, radiusKm]);

  useEffect(() => {
    fetchRiders();
  }, [fetchRiders]);

  return { riders, isLoading, error, refetch: fetchRiders };
}
