import { useEffect } from "react";
import { listenToActiveOrder } from "@goshats/firebase";
import { useAuthStore } from "@/store/auth-store";
import { useOrderStore } from "@/store/order-store";

export function useActiveOrder() {
  const user = useAuthStore((s) => s.user);
  const { setActiveOrder, updateActiveOrder, clearActiveOrder } = useOrderStore();

  useEffect(() => {
    if (!user) {
      clearActiveOrder();
      return;
    }

    const unsubscribe = listenToActiveOrder(user.uid, (order) => {
      if (order) {
        setActiveOrder(order.id, order);
      } else {
        clearActiveOrder();
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);
}
