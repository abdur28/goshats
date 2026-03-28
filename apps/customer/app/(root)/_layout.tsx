import { useAuthStore } from "@/store/auth-store";
import { Redirect, Stack } from "expo-router";

export default function RootGroupLayout() {
  const { isAuthenticated, authInitialized } = useAuthStore();

  // While Firebase is initialising, render nothing (splash is still showing)
  if (!authInitialized) return null;

  // Not authenticated → send to sign-in
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
      <Stack.Screen
        name="settings"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="(booking)"
        options={{ animation: "slide_from_bottom", gestureEnabled: false }}
      />
    </Stack>
  );
}
