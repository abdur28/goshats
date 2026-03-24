import { useState, useEffect } from "react";
import {
  onSnapshot,
  query,
  collection,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db, getStops } from "@goshats/firebase";
import type { Order, OrderStop } from "@goshats/types";
import { useAuthStore } from "@/store/auth-store";
import { useDeliveryStore } from "@/store/delivery-store";

const ACTIVE_STATUSES = [
  "accepted",
  "arrived_pickup",
  "picked_up",
  "in_transit",
];

export function useActiveOrder() {
  const user = useAuthStore((s) => s.user);
  const { setActiveOrder } = useDeliveryStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [stops, setStops] = useState<OrderStop[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, "orders"),
      where("riderId", "==", user.uid),
      where("status", "in", ACTIVE_STATUSES),
      orderBy("createdAt", "desc"),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, async (snap) => {
      if (snap.empty) {
        setOrder(null);
        setStops([]);
        setActiveOrder(null);
        setIsLoading(false);
        return;
      }

      const doc = snap.docs[0];
      const activeOrder = { id: doc.id, ...doc.data() } as Order;
      setOrder(activeOrder);
      setActiveOrder(activeOrder);

      try {
        const orderStops = await getStops(activeOrder.id);
        setStops(orderStops);
      } catch {
        setStops([]);
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return { order, stops, isLoading };
}
