import React, { useEffect } from "react";
import { View, Text, Pressable, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
}

const toastConfig: Record<
  ToastType,
  { bg: string; icon: keyof typeof Ionicons.glyphMap; iconColor: string }
> = {
  success: { bg: "bg-green-50 border-green-200", icon: "checkmark-circle", iconColor: "#22C55E" },
  error: { bg: "bg-red-50 border-red-200", icon: "alert-circle", iconColor: "#EF4444" },
  info: { bg: "bg-blue-50 border-blue-200", icon: "information-circle", iconColor: "#3B82F6" },
};

export function Toast({
  message,
  type = "info",
  visible,
  onDismiss,
  duration = 3000,
}: ToastProps) {
  const translateY = React.useRef(new Animated.Value(-100)).current;
  const config = toastConfig[type];

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }).start();

      const timeout = setTimeout(onDismiss, duration);
      return () => clearTimeout(timeout);
    } else {
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, duration, onDismiss, translateY]);

  if (!visible) return null;

  return (
    <Animated.View
      style={{ transform: [{ translateY }] }}
      className={`absolute top-14 left-4 right-4 z-50 flex-row items-center p-4 rounded-2xl border ${config.bg}`}
    >
      <Ionicons name={config.icon} size={22} color={config.iconColor} />
      <Text className="font-sans-medium text-sm text-gray-800 flex-1 ml-3">
        {message}
      </Text>
      <Pressable onPress={onDismiss}>
        <Ionicons name="close" size={18} color="#9CA3AF" />
      </Pressable>
    </Animated.View>
  );
}
