import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "./global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    "PolySans-Neutral": require("@/assets/fonts/PolySans-Neutral.otf"),
    "PolySans-Median": require("@/assets/fonts/PolySans-Median.otf"),
    "PolySans-Bulky": require("@/assets/fonts/PolySans-Bulky.otf"),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  // TODO: Re-enable providers once using dev build (not Expo Go)
  // <AuthProvider><NotificationProvider>...</NotificationProvider></AuthProvider>
  return <Stack screenOptions={{ headerShown: false }} />;
}
