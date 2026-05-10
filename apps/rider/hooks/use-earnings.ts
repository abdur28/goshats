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
    payouts: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchEarnings = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Fetch delivered orders for earnings summary
      const startDate = getStartDate(period);
      let fareKobo = 0;
      let tipsKobo = 0;
      let tripCount = 0;

      try {
        const result = await getRiderOrders(user.uid, 50);
        const filtered = result.orders.filter((order: Order) => {
          if (order.status !== "delivered") return false;
          if (!startDate) return true;
          const orderDate = order.createdAt?.toDate
            ? order.createdAt.toDate()
            : new Date(order.createdAt as any);
          return orderDate >= startDate;
        });
        fareKobo = filtered.reduce((sum: number, o: Order) => sum + (o.fareAmountKobo ?? 0), 0);
        tipsKobo = filtered.reduce((sum: number, o: Order) => sum + (o.tipAmountKobo ?? 0), 0);
        tripCount = filtered.length;
      } catch {
        // Orders query failed — keep zeros
      }

      // Fetch payouts separately so one failure doesn't kill the other
      let payouts: RiderPayout[] = [];
      try {
        const payoutQuery = query(
          collection(db, "rider_payouts"),
          where("riderId", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(50)
        );
        const payoutDocs = await getDocs(payoutQuery);
        payouts = payoutDocs.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as RiderPayout));
      } catch {
        // Payout query failed (possibly missing index) — keep empty
      }

      setEarnings({
        fareKobo,
        tipsKobo,
        totalKobo: fareKobo + tipsKobo,
        tripCount,
        payouts,
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, period]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  return { earnings, period, setPeriod, isLoading, refetch: fetchEarnings };
}
