import { create } from "zustand";
import type { User as FirebaseUser } from "firebase/auth";
import type { User } from "@goshats/types";

interface AuthState {
  user: FirebaseUser | null;
  userProfile: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authInitialized: boolean;
  error: string | null;

  setUser: (user: FirebaseUser | null) => void;
  setUserProfile: (profile: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setAuthInitialized: (initialized: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  userProfile: null,
  isLoading: true,
  isAuthenticated: false,
  authInitialized: false,
  error: null,

  setUser: (user) =>
    set({ user, isAuthenticated: !!user }),
  setUserProfile: (userProfile) => set({ userProfile }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setAuthInitialized: (authInitialized) => set({ authInitialized }),
  clearAuth: () =>
    set({
      user: null,
      userProfile: null,
      isAuthenticated: false,
      error: null,
    }),
}));
