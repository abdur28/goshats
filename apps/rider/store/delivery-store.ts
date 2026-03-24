import { create } from "zustand";
import type { Order } from "@goshats/types";

interface DeliveryState {
  activeOrder: Order | null;
  currentStopIndex: number;
  isNavigating: boolean;
  isOnline: boolean;

  setActiveOrder: (order: Order | null) => void;
  setCurrentStopIndex: (index: number) => void;
  setIsNavigating: (navigating: boolean) => void;
  setIsOnline: (online: boolean) => void;
  clearDelivery: () => void;
}

export const useDeliveryStore = create<DeliveryState>((set) => ({
  activeOrder: null,
  currentStopIndex: 0,
  isNavigating: false,
  isOnline: false,

  setActiveOrder: (activeOrder) => set({ activeOrder }),
  setCurrentStopIndex: (currentStopIndex) => set({ currentStopIndex }),
  setIsNavigating: (isNavigating) => set({ isNavigating }),
  setIsOnline: (isOnline) => set({ isOnline }),
  clearDelivery: () =>
    set({
      activeOrder: null,
      currentStopIndex: 0,
      isNavigating: false,
    }),
}));
