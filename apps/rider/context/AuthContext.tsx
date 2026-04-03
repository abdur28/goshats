import React, {
  createContext,
  useContext,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { type User as FirebaseUser } from "firebase/auth";
import * as SplashScreen from "expo-splash-screen";
import { router } from "expo-router";
import {
  onAuthStateChange,
  signInWithEmail,
  registerWithEmail,
  signOutUser,
  sendPasswordReset,
  updateUserPassword,
  getRider,
  createRider,
} from "@goshats/firebase";
import type { Rider } from "@goshats/types";
import { useAuthStore } from "@/store/auth-store";

SplashScreen.preventAutoHideAsync();

interface AuthContextType {
  user: FirebaseUser | null;
  riderProfile: Rider | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authInitialized: boolean;
  error: string | null;

  signIn: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    profileData: Omit<Rider, "uid" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (current: string, newPass: string) => Promise<void>;
  clearError: () => void;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const store = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        store.setUser(firebaseUser);
        try {
          const profile = await getRider(firebaseUser.uid);
          store.setRiderProfile(profile);
        } catch (err) {
          console.error("Error fetching rider profile:", err);
        }
      } else {
        store.clearAuth();
      }
      store.setLoading(false);
      store.setAuthInitialized(true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (store.authInitialized) {
      SplashScreen.hideAsync();
    }
  }, [store.authInitialized]);

  const signIn = useCallback(async (email: string, password: string) => {
    store.setLoading(true);
    store.setError(null);
    try {
      await signInWithEmail(email, password);
    } catch (err: any) {
      store.setError(err.message || "Failed to sign in");
      throw err;
    } finally {
      store.setLoading(false);
    }
  }, []);

  const register = useCallback(
    async (
      email: string,
      password: string,
      profileData: Omit<Rider, "uid" | "createdAt" | "updatedAt">
    ) => {
      store.setLoading(true);
      store.setError(null);
      try {
        const firebaseUser = await registerWithEmail(email, password);
        await createRider(firebaseUser.uid, profileData);
      } catch (err: any) {
        store.setError(err.message || "Failed to register");
        throw err;
      } finally {
        store.setLoading(false);
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    store.setLoading(true);
    try {
      await signOutUser();
      store.clearAuth();
      router.replace("/(auth)/welcome");
    } catch (err: any) {
      store.setError(err.message || "Failed to sign out");
    } finally {
      store.setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    store.setLoading(true);
    store.setError(null);
    try {
      await sendPasswordReset(email);
    } catch (err: any) {
      store.setError(err.message || "Failed to send reset email");
      throw err;
    } finally {
      store.setLoading(false);
    }
  }, []);

  const changePassword = useCallback(
    async (current: string, newPass: string) => {
      store.setLoading(true);
      store.setError(null);
      try {
        await updateUserPassword(current, newPass);
      } catch (err: any) {
        store.setError(err.message || "Failed to change password");
        throw err;
      } finally {
        store.setLoading(false);
      }
    },
    []
  );

  const clearError = useCallback(() => store.setError(null), []);

  const refetch = useCallback(async () => {
    if (!store.user) return;
    try {
      const profile = await getRider(store.user.uid);
      store.setRiderProfile(profile);
    } catch (err) {
      console.error("Error refetching rider profile:", err);
    }
  }, [store.user]);

  return (
    <AuthContext.Provider
      value={{
        user: store.user,
        riderProfile: store.riderProfile,
        isLoading: store.isLoading,
        isAuthenticated: store.isAuthenticated,
        authInitialized: store.authInitialized,
        error: store.error,
        signIn,
        register,
        signOut,
        resetPassword,
        changePassword,
        clearError,
        refetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
