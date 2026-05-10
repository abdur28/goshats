import { create } from "zustand";

interface LocationState {
  currentLocation: { latitude: number; longitude: number } | null;
  currentAddress: string | null;
  heading: number | null;
  hasPermission: boolean;
  isWatching: boolean;

  viewLocation: { latitude: number; longitude: number } | null;
  viewLabel: string | null;

  setCurrentLocation: (latitude: number, longitude: number) => void;
  setCurrentAddress: (address: string | null) => void;
  setHeading: (heading: number | null) => void;
  setHasPermission: (status: boolean) => void;
  setIsWatching: (watching: boolean) => void;

  setViewLocation: (latitude: number, longitude: number, label?: string | null) => void;
  clearViewLocation: () => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  currentLocation: null,
  currentAddress: null,
  heading: null,
  hasPermission: false,
  isWatching: false,

  viewLocation: null,
  viewLabel: null,

  setCurrentLocation: (latitude, longitude) =>
    set({ currentLocation: { latitude, longitude } }),
  setCurrentAddress: (currentAddress) => set({ currentAddress }),
  setHeading: (heading) => set({ heading }),
  setHasPermission: (hasPermission) => set({ hasPermission }),
  setIsWatching: (isWatching) => set({ isWatching }),

  setViewLocation: (latitude, longitude, label = null) =>
    set({ viewLocation: { latitude, longitude }, viewLabel: label }),
  clearViewLocation: () => set({ viewLocation: null, viewLabel: null }),
}));
