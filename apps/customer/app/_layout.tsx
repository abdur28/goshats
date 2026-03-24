import { Stack } from "expo-router";
// import { AuthProvider } from "@/context/AuthContext";
// import { NotificationProvider } from "@/context/NotificationContext";
import "./global.css";

export default function RootLayout() {
  // TODO: Re-enable providers once using dev build (not Expo Go)
  // <AuthProvider><NotificationProvider>...</NotificationProvider></AuthProvider>
  return <Stack />;
}
