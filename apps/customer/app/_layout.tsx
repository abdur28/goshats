import { useAuthStore } from "@/store/auth-store";
import { usePricingStore } from "@/store/pricing-store";
import { getUser, getRider, listenToPricingSettings, onAuthStateChange, signOutUser } from "@goshats/firebase";
import { useFonts } from "expo-font";
import { Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { Component, type ReactNode, useEffect, useState } from "react";
import { ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import "./global.css";

SplashScreen.preventAutoHideAsync();

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <Text style={{ fontFamily: "PolySans-Bulky", fontSize: 18, color: "#111827", marginBottom: 12 }}>
            Something went wrong
          </Text>
          <Text style={{ fontFamily: "PolySans-Neutral", fontSize: 14, color: "#6B7280", textAlign: "center", marginBottom: 24 }}>
            An unexpected error occurred. Please restart the app.
          </Text>
          <Pressable
            onPress={() => this.setState({ hasError: false })}
            style={{ backgroundColor: "#111827", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 9999 }}
          >
            <Text style={{ fontFamily: "PolySans-Bulky", fontSize: 14, color: "#FFFFFF" }}>Try Again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

function CustomSplash({
  isReady,
  onDone,
}: {
  isReady: boolean;
  onDone: () => void;
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (isReady) {
      scale.value = withSpring(10, { damping: 16, stiffness: 70 });
      opacity.value = withTiming(0, { duration: 550 }, (finished) => {
        if (finished) runOnJS(onDone)();
      });
    }
  }, [isReady]);

  const logoAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const containerAnimStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, containerAnimStyle]}>
      <ImageBackground
        source={require("@/assets/images/background.png")}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      <View className="flex-1 items-center justify-center">
        <Animated.Image
          source={require("@/assets/icons/splash-icon.png")}
          style={[{ width: 160, height: 160 }, logoAnimStyle]}
          resizeMode="contain"
        />
      </View>
    </Animated.View>
  );
}

export default function RootLayout() {
  const store = useAuthStore();
  const [splashDone, setSplashDone] = useState(false);

  const [fontsLoaded] = useFonts({
    "PolySans-Neutral": require("@/assets/fonts/PolySans-Neutral.otf"),
    "PolySans-Median": require("@/assets/fonts/PolySans-Median.otf"),
    "PolySans-Bulky": require("@/assets/fonts/PolySans-Bulky.otf"),
  });

  // Hide native splash immediately — custom animated splash takes over
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  // Listen to admin pricing settings (real-time)
  useEffect(() => {
    const unsub = listenToPricingSettings((settings) => {
      usePricingStore.getState().setSettings(settings);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await getUser(firebaseUser.uid);
          if (!profile) {
            // No customer doc — check if this is a rider account
            const riderProfile = await getRider(firebaseUser.uid);
            if (riderProfile) {
              // Wrong role: rider trying to use customer app
              await signOutUser();
              store.clearAuth();
              store.setError("wrong_role");
              store.setLoading(false);
              store.setAuthInitialized(true);
              return;
            }
            // No profile at all — new user mid-registration, allow through
          }
          store.setUser(firebaseUser);
          store.setUserProfile(profile);
        } catch (err) {
          if (__DEV__) console.error("Error fetching user profile:", err);
          store.setUser(firebaseUser);
        }
      } else {
        store.clearAuth();
      }
      store.setLoading(false);
      store.setAuthInitialized(true);
    });
    return () => unsubscribe();
  }, []);

  const ready = fontsLoaded && store.authInitialized;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        {ready && <Slot />}
        {!splashDone && (
          <CustomSplash isReady={ready} onDone={() => setSplashDone(true)} />
        )}
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
