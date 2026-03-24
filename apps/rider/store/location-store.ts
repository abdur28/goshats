import { create } from "zustand";

interface LocationState {
  currentLocation: { latitude: number; longitude: number } | null;
  currentAddress: string | null;
  hasPermission: boolean;
  isWatching: boolean;

  setCurrentLocation: (latitude: number, longitude: number) => void;
  setCurrentAddress: (address: string | null) => void;
  setHasPermission: (status: boolean) => void;
  setIsWatching: (watching: boolean) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  currentLocation: null,
  currentAddress: null,
  hasPermission: false,
  isWatching: false,

  setCurrentLocation: (latitude, longitude) =>
    set({ currentLocation: { latitude, longitude } }),
  setCurrentAddress: (currentAddress) => set({ currentAddress }),
  setHasPermission: (hasPermission) => set({ hasPermission }),
  setIsWatching: (isWatching) => set({ isWatching }),
}));
