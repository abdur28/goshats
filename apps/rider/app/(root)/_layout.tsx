import { NotificationProvider } from "@/context/NotificationContext";
import { useAuthStore } from "@/store/auth-store";
import { Redirect, Stack } from "expo-router";

export default function RootGroupLayout() {
  const { isAuthenticated, authInitialized, riderProfile } = useAuthStore();

  if (!authInitialized) return null;

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (riderProfile?.status === "pending") {
    return <Redirect href="/(auth)/pending-approval" />;
  }

  return (
    <NotificationProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
        <Stack.Screen
          name="profile"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="chat"
          options={{ animation: "slide_from_right" }}
        />
      </Stack>
    </NotificationProvider>
  );
}
