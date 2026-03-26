import React from "react";
import { Pressable, type PressableProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type IconButtonVariant = "primary" | "ghost" | "outline";
type IconButtonSize = "sm" | "md" | "lg";

interface IconButtonProps extends Omit<PressableProps, "children"> {
  icon: keyof typeof Ionicons.glyphMap;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  className?: string;
}

const variantClasses: Record<IconButtonVariant, string> = {
  primary: "bg-primary",
  ghost: "bg-transparent",
  outline: "bg-transparent border border-gray-200",
};

const iconColors: Record<IconButtonVariant, string> = {
  primary: "#FFFFFF",
  ghost: "#006B3F",
  outline: "#374151",
};

const sizeConfig: Record<IconButtonSize, { container: string; iconSize: number }> = {
  sm: { container: "w-8 h-8", iconSize: 16 },
  md: { container: "w-10 h-10", iconSize: 20 },
  lg: { container: "w-12 h-12", iconSize: 24 },
};

export function IconButton({
  icon,
  variant = "ghost",
  size = "md",
  className = "",
  ...props
}: IconButtonProps) {
  const config = sizeConfig[size];

  return (
    <Pressable
      className={`items-center justify-center rounded-full ${config.container} ${variantClasses[variant]} active:opacity-70 ${className}`}
      {...props}
    >
      <Ionicons name={icon} size={config.iconSize} color={iconColors[variant]} />
    </Pressable>
  );
}
