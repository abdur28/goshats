import { create } from "zustand";
import type { Order } from "@goshats/types";

interface OrderState {
  activeOrderId: string | null;
  activeOrder: Order | null;

  setActiveOrder: (id: string, order: Order) => void;
  updateActiveOrder: (order: Order) => void;
  clearActiveOrder: () => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  activeOrderId: null,
  activeOrder: null,

  setActiveOrder: (id, order) => set({ activeOrderId: id, activeOrder: order }),
  updateActiveOrder: (order) => set({ activeOrder: order }),
  clearActiveOrder: () => set({ activeOrderId: null, activeOrder: null }),
}));
