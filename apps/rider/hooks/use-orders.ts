import { useAuthStore } from "@/store/auth-store";
import { getRiderOrders } from "@goshats/firebase/src/firestore/orders";
import type { Order } from "@goshats/types";
import type { DocumentSnapshot } from "firebase/firestore";
import { useCallback, useState } from "react";

export function useOrders(pageSize: number = 20) {
  const user = useAuthStore((s) => s.user);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(
    async (refresh?: boolean) => {
      if (!user || isLoading) return;

      setIsLoading(true);
      setError(null);
      try {
        const result = await getRiderOrders(
          user.uid,
          pageSize,
          refresh ? undefined : (lastDoc ?? undefined),
        );

        if (refresh) {
          setOrders(result.orders);
        } else {
          setOrders((prev) => [...prev, ...result.orders]);
        }

        setLastDoc(result.lastDoc);
        setHasMore(result.orders.length === pageSize);
      } catch (err: any) {
        setError(err.message || "Failed to load orders");
      } finally {
        setIsLoading(false);
      }
    },
    [user, isLoading, lastDoc, pageSize],
  );

  const refresh = useCallback(() => {
    setLastDoc(null);
    setHasMore(true);
    return loadMore(true);
  }, [loadMore]);

  return {
    orders,
    isLoading,
    error,
    loadMore: () => loadMore(),
    refresh,
    hasMore,
  };
}
