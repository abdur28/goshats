import { useState, useEffect } from "react";
import {
  onSnapshot,
  query,
  collection,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@goshats/firebase";
import type { Order } from "@goshats/types";
import { useAuthStore } from "@/store/auth-store";

export function useIncomingRequests(isOnline?: boolean) {
  const user = useAuthStore((s) => s.user);
  const riderProfile = useAuthStore((s) => s.riderProfile);
  const [requests, setRequests] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOnline || !user || !riderProfile || riderProfile.status !== "approved") {
      setRequests([]);
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, "orders"),
      where("riderId", "==", user.uid),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const now = Date.now();
      const thirtyMins = 30 * 60 * 1000;

      const orders = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as Order)
        .filter((o) => {
          // Hide pending orders older than 30 mins
          let time = 0;
          if (o.createdAt && (o.createdAt as any).toMillis) {
            time = (o.createdAt as any).toMillis();
          } else if (o.createdAt instanceof Date) {
            time = o.createdAt.getTime();
          }
          return time === 0 || now - time < thirtyMins;
        });

      setRequests(orders);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, riderProfile, isOnline]);

  const dismissRequest = (id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  return { requests, isLoading, dismissRequest };
}
