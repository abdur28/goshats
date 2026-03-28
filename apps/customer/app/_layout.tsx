import { useAuthStore } from "@/store/auth-store";
import { usePricingStore } from "@/store/pricing-store";
import { getUser, listenToPricingSettings, onAuthStateChange } from "@goshats/firebase";
import { useFonts } from "expo-font";
import { Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "./global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const store = useAuthStore();

  const [fontsLoaded] = useFonts({
    "PolySans-Neutral": require("@/assets/fonts/PolySans-Neutral.otf"),
    "PolySans-Median": require("@/assets/fonts/PolySans-Median.otf"),
    "PolySans-Bulky": require("@/assets/fonts/PolySans-Bulky.otf"),
  });

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

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Slot />
    </GestureHandlerRootView>
  );
}
