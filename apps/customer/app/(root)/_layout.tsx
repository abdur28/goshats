import { useActiveOrder } from "@/hooks/use-active-order";
import { useAuthStore } from "@/store/auth-store";
import { Redirect, Stack } from "expo-router";

function ActiveOrderListener() {
  useActiveOrder();
  return null;
}

export default function RootGroupLayout() {
  const { isAuthenticated, authInitialized } = useAuthStore();

  if (!authInitialized) return null;

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <>
      <ActiveOrderListener />
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
        <Stack.Screen
          name="(tracking)"
          options={{ animation: "slide_from_bottom", gestureEnabled: false }}
        />
        <Stack.Screen
          name="review"
          options={{ animation: "slide_from_bottom" }}
        />
      </Stack>
    </>
  );
}
