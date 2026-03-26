import React from "react";
import { ActivityIndicator, View } from "react-native";

interface LoadingSpinnerProps {
  size?: "small" | "large";
  color?: string;
  fullScreen?: boolean;
  className?: string;
}

export function LoadingSpinner({
  size = "large",
  color = "#006B3F",
  fullScreen = false,
  className = "",
}: LoadingSpinnerProps) {
  if (fullScreen) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size={size} color={color} />
      </View>
    );
  }

  return (
    <View className={`items-center justify-center py-4 ${className}`}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}
