import { useAuthStore } from "@/store/auth-store";
import { usePricingStore } from "@/store/pricing-store";
import { getUser, listenToPricingSettings, onAuthStateChange } from "@goshats/firebase";
import { useFonts } from "expo-font";
import { Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { ImageBackground, StyleSheet, View } from "react-native";
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

  const ready = fontsLoaded && store.authInitialized;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {ready && <Slot />}
      {!splashDone && (
        <CustomSplash isReady={ready} onDone={() => setSplashDone(true)} />
      )}
    </GestureHandlerRootView>
  );
}
