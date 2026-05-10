import { NotificationProvider } from "@/context/NotificationContext";
import { useActiveOrder } from "@/hooks/use-active-order";
import { usePresence } from "@/hooks/use-presence";
import { getSessionId } from "@/lib/session-id";
import { useAuthStore } from "@/store/auth-store";
import { listenToRider, signOutUser } from "@goshats/firebase";
import { Redirect, Stack } from "expo-router";
import { useEffect } from "react";

export default function RootGroupLayout() {
  const { isAuthenticated, authInitialized, riderProfile, user, setRiderProfile, clearAuth } =
    useAuthStore();
  // Active-order subscription mounts here (not dashboard) so the delivery store
  // is populated immediately on launch, before usePresence decides whether to
  // suppress its inactivity timer or override the offline toggle.
  useActiveOrder();
  usePresence();

  // Live rider-profile listener: keeps local store in sync with Firestore
  // (e.g. mirror CF flipping isOnline, isAvailable lifecycle from CF, admin
  // status changes). Also enforces single-device sessions: if the
  // activeDeviceId field stops matching this session, sign out.
  useEffect(() => {
    if (!user?.uid) return;
    const ourSessionId = getSessionId();
    const unsubscribe = listenToRider(user.uid, async (rider) => {
      if (!rider) return;

      // Single-device enforcement
      if (
        rider.activeDeviceId &&
        rider.activeDeviceId !== ourSessionId
      ) {
        await signOutUser().catch(() => {});
        clearAuth();
        return;
      }

      setRiderProfile(rider);
    });
    return () => unsubscribe();
  }, [user?.uid, setRiderProfile, clearAuth]);

  if (!authInitialized) return null;

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (riderProfile?.status === "pending" || riderProfile?.status === "suspended") {
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
