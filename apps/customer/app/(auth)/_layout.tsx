import { useAuthStore } from "@/store/auth-store";
import { Redirect, Stack } from "expo-router";

export default function AuthLayout() {
  const { isAuthenticated, authInitialized } = useAuthStore();

  if (authInitialized && isAuthenticated) {
    return <Redirect href={"/(root)/" as any} />;
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
