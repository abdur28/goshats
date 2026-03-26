import React from "react";
import { View, Text, Image } from "react-native";

type AvatarSize = "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: AvatarSize;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
};

const textSizeClasses: Record<AvatarSize, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-lg",
  xl: "text-2xl",
};

function getInitials(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
}

export function Avatar({ uri, name, size = "md", className = "" }: AvatarProps) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        className={`${sizeClasses[size]} rounded-full ${className}`}
      />
    );
  }

  return (
    <View
      className={`${sizeClasses[size]} rounded-full bg-primary-100 items-center justify-center ${className}`}
    >
      <Text className={`font-sans-semibold ${textSizeClasses[size]} text-primary`}>
        {getInitials(name)}
      </Text>
    </View>
  );
}
