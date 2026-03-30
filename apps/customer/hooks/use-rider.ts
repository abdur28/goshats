import { useState, useEffect } from "react";
import { listenToRider } from "@goshats/firebase";
import type { Rider } from "@goshats/types";

export function useRider(riderId: string | null | undefined) {
  const [rider, setRider] = useState<Rider | null>(null);

  useEffect(() => {
    if (!riderId) {
      setRider(null);
      return;
    }

    const unsubscribe = listenToRider(riderId, setRider);
    return () => unsubscribe();
  }, [riderId]);

  return rider;
}
