import { useState, useEffect } from "react";
import {
  onSnapshot,
  query,
  collection,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { distanceBetween } from "geofire-common";
import { db } from "@goshats/firebase";
import type { Order } from "@goshats/types";
import { useAuthStore } from "@/store/auth-store";
import { useLocationStore } from "@/store/location-store";

const NEARBY_RADIUS_KM = 15;

export function useIncomingRequests() {
  const user = useAuthStore((s) => s.user);
  const riderProfile = useAuthStore((s) => s.riderProfile);
  const currentLocation = useLocationStore((s) => s.currentLocation);
  const [requests, setRequests] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !riderProfile || riderProfile.status !== "approved") {
      setRequests([]);
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, "orders"),
      where("status", "==", "pending"),
      where("riderId", "==", null),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const orders = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as Order
      );

      // Client-side distance filter if we have location
      if (currentLocation) {
        const filtered = orders.filter((order) => {
          if (!order.pickup?.location) return true;
          const dist = distanceBetween(
            [currentLocation.latitude, currentLocation.longitude],
            [order.pickup.location.latitude, order.pickup.location.longitude]
          );
          return dist <= NEARBY_RADIUS_KM;
        });
        setRequests(filtered);
      } else {
        setRequests(orders);
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, riderProfile, currentLocation]);

  return { requests, isLoading };
}
