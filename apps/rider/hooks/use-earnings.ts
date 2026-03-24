import { useState, useEffect, useCallback } from "react";
import { getRiderOrders } from "@goshats/firebase";
import type { Order } from "@goshats/types";
import { useAuthStore } from "@/store/auth-store";

type EarningsPeriod = "today" | "week" | "month" | "all";

interface EarningsData {
  totalKobo: number;
  tripCount: number;
  orders: Order[];
}

function getStartDate(period: EarningsPeriod): Date | null {
  const now = new Date();
  switch (period) {
    case "today":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case "week": {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return d;
    }
    case "month": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      return d;
    }
    case "all":
      return null;
  }
}

export function useEarnings() {
  const user = useAuthStore((s) => s.user);
  const [period, setPeriod] = useState<EarningsPeriod>("today");
  const [earnings, setEarnings] = useState<EarningsData>({
    totalKobo: 0,
    tripCount: 0,
    orders: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchEarnings = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { orders } = await getRiderOrders(user.uid, 100);
      const startDate = getStartDate(period);

      const filtered = orders.filter((order) => {
        if (order.status !== "delivered") return false;
        if (!startDate) return true;

        const orderDate = order.createdAt?.toDate
          ? order.createdAt.toDate()
          : new Date(order.createdAt as any);
        return orderDate >= startDate;
      });

      const totalKobo = filtered.reduce(
        (sum, order) => sum + (order.totalAmountKobo ?? 0),
        0
      );

      setEarnings({
        totalKobo,
        tripCount: filtered.length,
        orders: filtered,
      });
    } catch {
      // Keep existing state on error
    } finally {
      setIsLoading(false);
    }
  }, [user, period]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  return { earnings, period, setPeriod, isLoading, refetch: fetchEarnings };
}
