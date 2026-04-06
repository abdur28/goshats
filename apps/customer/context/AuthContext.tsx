import { getAppleCredential } from "@/lib/apple-auth";
import {
  configureGoogleSignIn,
  getGoogleIdToken,
  signOutGoogle,
} from "@/lib/google-auth";
import { useAuthStore } from "@/store/auth-store";
import {
  createUser,
  signInWithApple as firebaseSignInWithApple,
  signInWithGoogle as firebaseSignInWithGoogle,
  getUser,
  onAuthStateChange,
  registerWithEmail,
  sendPasswordReset,
  signInWithEmail,
  signOutUser,
  updateUserPassword,
} from "@goshats/firebase";
import type { User } from "@goshats/types";
import { router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { type User as FirebaseUser } from "firebase/auth";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  type ReactNode,
} from "react";

SplashScreen.preventAutoHideAsync();

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authInitialized: boolean;
  error: string | null;

  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  register: (
    email: string,
    password: string,
    profileData: Omit<User, "uid" | "createdAt" | "updatedAt">,
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
    configureGoogleSignIn();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        store.setUser(firebaseUser);
        try {
          const profile = await getUser(firebaseUser.uid);
          store.setUserProfile(profile);
        } catch (err) {
          console.error("Error fetching user profile:", err);
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

  const handleSignInWithGoogle = useCallback(async () => {
    store.setLoading(true);
    store.setError(null);
    try {
      const idToken = await getGoogleIdToken();
      if (!idToken) {
        store.setLoading(false);
        return;
      }
      await firebaseSignInWithGoogle(idToken);
    } catch (err: any) {
      store.setError(err.message || "Failed to sign in with Google");
      throw err;
    } finally {
      store.setLoading(false);
    }
  }, []);

  const handleSignInWithApple = useCallback(async () => {
    store.setLoading(true);
    store.setError(null);
    try {
      const credential = await getAppleCredential();
      if (!credential) {
        store.setLoading(false);
        return;
      }
      await firebaseSignInWithApple(credential.identityToken, credential.nonce);
    } catch (err: any) {
      store.setError(err.message || "Failed to sign in with Apple");
      throw err;
    } finally {
      store.setLoading(false);
    }
  }, []);

  const register = useCallback(
    async (
      email: string,
      password: string,
      profileData: Omit<User, "uid" | "createdAt" | "updatedAt">,
    ) => {
      store.setLoading(true);
      store.setError(null);
      try {
        const firebaseUser = await registerWithEmail(email, password);
        await createUser(firebaseUser.uid, profileData);
      } catch (err: any) {
        store.setError(err.message || "Failed to register");
        throw err;
      } finally {
        store.setLoading(false);
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    store.setLoading(true);
    try {
      await signOutGoogle();
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
    [],
  );

  const clearError = useCallback(() => {
    store.setError(null);
  }, []);

  const refetch = useCallback(async () => {
    if (!store.user) return;
    try {
      const profile = await getUser(store.user.uid);
      store.setUserProfile(profile);
    } catch (err) {
      console.error("Error refetching profile:", err);
    }
  }, [store.user]);

  return (
    <AuthContext.Provider
      value={{
        user: store.user,
        userProfile: store.userProfile,
        isLoading: store.isLoading,
        isAuthenticated: store.isAuthenticated,
        authInitialized: store.authInitialized,
        error: store.error,
        signIn,
        signInWithGoogle: handleSignInWithGoogle,
        signInWithApple: handleSignInWithApple,
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
