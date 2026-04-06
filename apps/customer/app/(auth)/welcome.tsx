import { getAppleCredential } from "@/lib/apple-auth";
import { configureGoogleSignIn, getGoogleIdToken } from "@/lib/google-auth";
import { useAuthStore } from "@/store/auth-store";
import { Ionicons } from "@expo/vector-icons";
import {
  createUser,
  getRider,
  getUser,
  signInWithApple,
  signInWithGoogle,
  signOutUser,
} from "@goshats/firebase";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import type { User as FirebaseUser } from "firebase/auth";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const SPRING_CONFIG = {
  damping: 18,
  stiffness: 140,
};

// ── Helpers ──────────────────────────────────────────────────────
function generateReferralCode(name: string): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const prefix = name
    .replace(/[^a-zA-Z]/g, "")
    .substring(0, 4)
    .toUpperCase()
    .padEnd(4, "X");
  const suffix = Array.from(
    { length: 4 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
  return prefix + suffix;
}

/**
 * After social sign-in, ensure the user has a Firestore profile.
 * - If they're a rider → sign out and throw "wrong_role"
 * - If brand-new → create a minimal profile from OAuth data
 */
async function ensureUserProfile(
  firebaseUser: FirebaseUser,
  extraData?: { surname?: string; otherName?: string },
): Promise<void> {
  const existing = await getUser(firebaseUser.uid);
  if (existing) return;

  const riderProfile = await getRider(firebaseUser.uid);
  if (riderProfile) {
    await signOutUser();
    throw new Error("wrong_role");
  }

  const displayName = firebaseUser.displayName ?? "";
  const parts = displayName.trim().split(/\s+/);
  const surname = extraData?.surname || parts.pop() || "";
  const otherName = extraData?.otherName || parts.join(" ") || "";

  await createUser(firebaseUser.uid, {
    surname,
    otherName,
    email: firebaseUser.email ?? "",
    phone: "",
    countryCode: "NG",
    profilePhotoUrl: firebaseUser.photoURL ?? null,
    referralCode: generateReferralCode(surname || "USER"),
    referralCredits: 0,
    isPhoneVerified: false,
    isEmailVerified: !!firebaseUser.email,
    status: "active",
    fcmTokens: [],
    notifyPush: true,
    notifyEmail: true,
    notifySms: true,
    notifyNewsletter: true,
  });
}

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const storeError = useAuthStore((s) => s.error);
  const setStoreError = useAuthStore((s) => s.setError);

  const [loading, setLoading] = useState<"apple" | "google" | null>(null);
  const [socialError, setSocialError] = useState("");

  useEffect(() => {
    configureGoogleSignIn();
    return () => setStoreError(null);
  }, []);

  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(30);
  const buttonsOpacity = useSharedValue(0);
  const buttonsTranslateY = useSharedValue(25);

  useEffect(() => {
    contentOpacity.value = withDelay(200, withTiming(1, { duration: 500 }));
    contentTranslateY.value = withDelay(200, withSpring(0, SPRING_CONFIG));

    buttonsOpacity.value = withDelay(450, withTiming(1, { duration: 500 }));
    buttonsTranslateY.value = withDelay(450, withSpring(0, SPRING_CONFIG));
  }, []);

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const buttonsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{ translateY: buttonsTranslateY.value }],
  }));

  // ── Apple sign-in (uses existing lib/apple-auth.ts) ────────────
  const onApple = async () => {
    if (loading) return;
    setLoading("apple");
    setSocialError("");
    setStoreError(null);
    try {
      const credential = await getAppleCredential();
      if (!credential) {
        // User cancelled
        setLoading(null);
        return;
      }

      const firebaseUser = await signInWithApple(
        credential.identityToken,
        credential.nonce,
      );
      await ensureUserProfile(firebaseUser, {
        surname: credential.fullName.familyName ?? undefined,
        otherName: credential.fullName.givenName ?? undefined,
      });
      const profile = await getUser(firebaseUser.uid);
      useAuthStore.getState().setUser(firebaseUser);
      useAuthStore.getState().setUserProfile(profile);
      router.replace("/(root)/" as any);
    } catch (error: any) {
      if (error?.message === "wrong_role") {
        setStoreError("wrong_role");
      } else {
        console.error("Apple sign-in error:", error);
        setSocialError(
          "Something went wrong with Apple sign-in. Please try again.",
        );
      }
    } finally {
      setLoading(null);
    }
  };

  // ── Google sign-in (uses existing lib/google-auth.ts) ──────────
  const onGoogle = async () => {
    if (loading) return;
    setLoading("google");
    setSocialError("");
    setStoreError(null);
    try {
      const idToken = await getGoogleIdToken();
      if (!idToken) {
        // User cancelled
        setLoading(null);
        return;
      }

      const firebaseUser = await signInWithGoogle(idToken);
      await ensureUserProfile(firebaseUser);
      const profile = await getUser(firebaseUser.uid);
      useAuthStore.getState().setUser(firebaseUser);
      useAuthStore.getState().setUserProfile(profile);
      router.replace("/(root)/" as any);
    } catch (error: any) {
      if (error?.message === "wrong_role") {
        setStoreError("wrong_role");
      } else {
        console.error("Google sign-in error:", error);
        setSocialError(
          "Something went wrong with Google sign-in. Please try again.",
        );
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />

      {/* Hero image */}
      <View
        className="overflow-hidden"
        style={{ height: SCREEN_HEIGHT * 0.57 }}
      >
        <Image
          source={require("@/assets/images/background.png")}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />

        <LinearGradient
          colors={["transparent", "rgba(255,255,255,0.5)", "#FFFFFF"]}
          locations={[0.2, 0.65, 1]}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "50%",
          }}
        />
      </View>

      {/* Content area */}
      <View
        className="flex-1 px-7 py-12 justify-between"
        style={{ paddingBottom: Math.max(insets.bottom, 20) }}
      >
        {/* Title + subtitle */}
        <Animated.View style={contentAnimatedStyle}>
          <Text className="text-[32px] leading-[40px] text-gray-900 font-sans-bold text-center">
            Welcome to{"\n"}
            <Text className="text-primary">GO SHATS</Text>
          </Text>
          <Text className="text-[15px] leading-[22px] text-gray-400 font-sans text-center mt-3">
            Send packages easily and enjoy fast,{"\n"}
            reliable delivery — simple and convenient.
          </Text>
        </Animated.View>

        {/* Auth buttons */}
        <Animated.View className="gap-3" style={buttonsAnimatedStyle}>
          {/* Wrong-role warning */}
          {storeError === "wrong_role" ? (
            <View className="bg-amber-50 border border-amber-100 rounded-2xl px-5 py-3.5 flex-row items-center gap-2">
              <Ionicons
                name="information-circle-outline"
                size={16}
                color="#D97706"
              />
              <Text className="text-sm font-sans text-amber-700 flex-1">
                This account is registered as a rider. Please use the GoShats
                Rider app.
              </Text>
            </View>
          ) : null}

          {/* General social error */}
          {socialError ? (
            <View className="bg-red-50 border border-red-100 rounded-full px-5 py-3.5 flex-row items-center gap-2">
              <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
              <Text className="text-sm font-sans text-danger flex-1">
                {socialError}
              </Text>
            </View>
          ) : null}

          {/* Continue with Apple (iOS only) */}
          {Platform.OS === "ios" ? (
            <Pressable
              onPress={onApple}
              disabled={!!loading}
              className="bg-gray-900 py-[18px] rounded-full flex-row items-center justify-center gap-2.5 active:opacity-85"
              style={loading ? { opacity: 0.6 } : undefined}
            >
              {loading === "apple" ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
                  <Text className="text-base font-sans-semibold text-white">
                    Continue with Apple
                  </Text>
                </>
              )}
            </Pressable>
          ) : null}

          {/* Row: Google + Email */}
          <View className="flex-row gap-3">
            <Pressable
              onPress={onGoogle}
              disabled={!!loading}
              className="flex-1 py-4 rounded-full border-[1.5px] flex-row items-center justify-center gap-2 active:opacity-70"
              style={loading ? { opacity: 0.6 } : undefined}
            >
              {loading === "google" ? (
                <ActivityIndicator size="small" color="#111827" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={18} />
                  <Text className="text-sm font-sans-medium">Google</Text>
                </>
              )}
            </Pressable>

            <Pressable
              onPress={() => router.push("/(auth)/sign-in" as any)}
              disabled={!!loading}
              className="flex-1 py-4 rounded-full border-[1.5px] flex-row items-center justify-center gap-2 active:opacity-70"
              style={loading ? { opacity: 0.6 } : undefined}
            >
              <Ionicons name="mail-outline" size={18} />
              <Text className="text-sm font-sans-medium">Email</Text>
            </Pressable>
          </View>

          {/* Terms */}
          <Text className="text-xs leading-[18px] text-gray-400 font-sans text-center mt-1">
            By signing in you agree to our{" "}
            <Text className="font-sans-medium text-gray-700 underline">
              Terms of Use
            </Text>{" "}
            and{" "}
            <Text className="font-sans-medium text-gray-700 underline">
              Privacy Policy
            </Text>
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}
