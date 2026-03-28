import { create } from "zustand";
import type { Region } from "react-native-maps";

interface MapState {
  selectedRiderId: string | null;
  isSearchActive: boolean;
  routePolyline: { latitude: number; longitude: number }[];
  routeInfo: { distanceMeters: number; durationSeconds: number } | null;
  mapRegion: Region | null;

  setSelectedRider: (riderId: string | null) => void;
  clearSelectedRider: () => void;
  setSearchActive: (active: boolean) => void;
  setRoute: (
    polyline: { latitude: number; longitude: number }[],
    info: { distanceMeters: number; durationSeconds: number }
  ) => void;
  clearRoute: () => void;
  setMapRegion: (region: Region) => void;
}

export const useMapStore = create<MapState>((set) => ({
  selectedRiderId: null,
  isSearchActive: false,
  routePolyline: [],
  routeInfo: null,
  mapRegion: null,

  setSelectedRider: (selectedRiderId) => set({ selectedRiderId }),
  clearSelectedRider: () => set({ selectedRiderId: null }),
  setSearchActive: (isSearchActive) => set({ isSearchActive }),
  setRoute: (routePolyline, routeInfo) => set({ routePolyline, routeInfo }),
  clearRoute: () => set({ routePolyline: [], routeInfo: null }),
  setMapRegion: (mapRegion) => set({ mapRegion }),
}));
