import React from "react";
import { View, Text } from "react-native";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: "bg-green-100",
  warning: "bg-amber-100",
  danger: "bg-red-100",
  info: "bg-blue-100",
  neutral: "bg-gray-100",
};

const textClasses: Record<BadgeVariant, string> = {
  success: "text-green-700",
  warning: "text-amber-700",
  danger: "text-red-700",
  info: "text-blue-700",
  neutral: "text-gray-700",
};

export function Badge({ label, variant = "neutral", className = "" }: BadgeProps) {
  return (
    <View
      className={`px-2.5 py-1 rounded-full self-start ${variantClasses[variant]} ${className}`}
    >
      <Text className={`font-sans-medium text-xs ${textClasses[variant]}`}>
        {label}
      </Text>
    </View>
  );
}
