import { create } from "zustand";

interface LocationState {
  currentLocation: { latitude: number; longitude: number } | null;
  currentAddress: string | null;
  heading: number | null;
  hasPermission: boolean;
  isWatching: boolean;

  setCurrentLocation: (latitude: number, longitude: number) => void;
  setCurrentAddress: (address: string | null) => void;
  setHeading: (heading: number | null) => void;
  setHasPermission: (status: boolean) => void;
  setIsWatching: (watching: boolean) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  currentLocation: null,
  currentAddress: null,
  heading: null,
  hasPermission: false,
  isWatching: false,

  setCurrentLocation: (latitude, longitude) =>
    set({ currentLocation: { latitude, longitude } }),
  setCurrentAddress: (currentAddress) => set({ currentAddress }),
  setHeading: (heading) => set({ heading }),
  setHasPermission: (hasPermission) => set({ hasPermission }),
  setIsWatching: (isWatching) => set({ isWatching }),
}));
