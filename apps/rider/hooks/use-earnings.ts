import { useAuthStore } from "@/store/auth-store";
import { getRiderOrders } from "@goshats/firebase/src/firestore/orders";
import type { Order } from "@goshats/types";
import { useCallback, useEffect, useState } from "react";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@goshats/firebase";

type EarningsPeriod = "today" | "week" | "month" | "all";

import { RiderPayout } from "@goshats/types";

interface EarningsData {
  fareKobo: number;
  tipsKobo: number;
  totalKobo: number;
  tripCount: number;
  orders: Order[];
  payouts: RiderPayout[];
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
    fareKobo: 0,
    tipsKobo: 0,
    totalKobo: 0,
    tripCount: 0,
    orders: [],
    payouts: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchEarnings = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const result = await getRiderOrders(user.uid, 50);
      const orders: Order[] = result.orders;

      const startDate = getStartDate(period);

      const filtered = orders.filter((order) => {
        if (order.status !== "delivered") return false;
        if (!startDate) return true;

        const orderDate = order.createdAt?.toDate
          ? order.createdAt.toDate()
          : new Date(order.createdAt as any);
        return orderDate >= startDate;
      });

      const fareKobo = filtered.reduce(
        (sum, order) => sum + (order.fareAmountKobo ?? 0),
        0,
      );
      const tipsKobo = filtered.reduce(
        (sum, order) => sum + (order.tipAmountKobo ?? 0),
        0,
      );

      // Rider actual total earned is Fare + Tip
      const payoutQuery = query(
        collection(db, "rider_payouts"),
        where("riderId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(50)
      );
      
      const payoutDocs = await getDocs(payoutQuery);
      const payouts = payoutDocs.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as RiderPayout));

      // Rider actual total earned in the selected period is Fare + Tip
      const totalKobo = fareKobo + tipsKobo;

      setEarnings({
        fareKobo,
        tipsKobo,
        totalKobo,
        tripCount: filtered.length,
        orders: filtered,
        payouts,
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
