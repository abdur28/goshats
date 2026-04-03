import { useAuthStore } from "@/store/auth-store";
import { Redirect, Stack, useSegments } from "expo-router";

export default function AuthLayout() {
  const { isAuthenticated, authInitialized, riderProfile } = useAuthStore();
  const segments = useSegments();

  // Don't redirect if we're already on pending-approval (avoids infinite loop)
  const isOnPendingApproval = (segments as string[]).includes("pending-approval");

  if (authInitialized && isAuthenticated && !isOnPendingApproval) {
    if (riderProfile?.status === "pending" || riderProfile?.status === "suspended") {
      return <Redirect href="/(auth)/pending-approval" />;
    }
    return <Redirect href="/(root)/(tabs)/dashboard" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    />
  );
}
