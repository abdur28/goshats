import { create } from "zustand";

type ToastType = "success" | "error" | "info";

interface UIState {
  isGlobalLoading: boolean;
  toastMessage: string | null;
  toastType: ToastType | null;

  setGlobalLoading: (loading: boolean) => void;
  showToast: (message: string, type: ToastType) => void;
  hideToast: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isGlobalLoading: false,
  toastMessage: null,
  toastType: null,

  setGlobalLoading: (isGlobalLoading) => set({ isGlobalLoading }),
  showToast: (toastMessage, toastType) => set({ toastMessage, toastType }),
  hideToast: () => set({ toastMessage: null, toastType: null }),
}));
