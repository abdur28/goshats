import { useState, useCallback } from "react";
import { getUserOrders } from "@goshats/firebase";
import type { Order } from "@goshats/types";
import type { DocumentSnapshot } from "firebase/firestore";
import { useAuthStore } from "@/store/auth-store";

export function useOrders(pageSize: number = 20) {
  const user = useAuthStore((s) => s.user);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(
    async (refresh?: boolean) => {
      if (!user || isLoading) return;

      setIsLoading(true);
      try {
        const result = await getUserOrders(
          user.uid,
          pageSize,
          refresh ? undefined : lastDoc ?? undefined
        );

        if (refresh) {
          setOrders(result.orders);
        } else {
          setOrders((prev) => [...prev, ...result.orders]);
        }

        setLastDoc(result.lastDoc);
        setHasMore(result.orders.length === pageSize);
      } catch (err) {
        console.error("Error loading orders:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [user, isLoading, lastDoc, pageSize]
  );

  const refresh = useCallback(() => {
    setLastDoc(null);
    setHasMore(true);
    return loadMore(true);
  }, [loadMore]);

  return { orders, isLoading, loadMore: () => loadMore(), refresh, hasMore };
}
