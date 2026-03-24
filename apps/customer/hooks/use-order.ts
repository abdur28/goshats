import { useState, useEffect } from "react";
import { listenToOrder } from "@goshats/firebase";
import type { Order } from "@goshats/types";

export function useOrder(orderId: string | null) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = listenToOrder(orderId, (order) => {
      setOrder(order);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [orderId]);

  return { order, isLoading };
}
