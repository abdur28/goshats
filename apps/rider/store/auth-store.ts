import { create } from "zustand";
import type { User as FirebaseUser } from "firebase/auth";
import type { Rider } from "@goshats/types";

interface AuthState {
  user: FirebaseUser | null;
  riderProfile: Rider | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authInitialized: boolean;
  error: string | null;

  setUser: (user: FirebaseUser | null) => void;
  setRiderProfile: (profile: Rider | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setAuthInitialized: (initialized: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  riderProfile: null,
  isLoading: true,
  isAuthenticated: false,
  authInitialized: false,
  error: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setRiderProfile: (riderProfile) => set({ riderProfile }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setAuthInitialized: (authInitialized) => set({ authInitialized }),
  clearAuth: () =>
    set({
      user: null,
      riderProfile: null,
      isAuthenticated: false,
      error: null,
    }),
}));
