import { router } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

export default function AddPaymentScreen() {
  useEffect(() => {
    router.replace("/settings/payments" as any);
  }, []);

  return <View />;
}
