import React from "react";
import {
  Pressable,
  Text,
  ActivityIndicator,
  type PressableProps,
  type ViewStyle,
} from "react-native";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<PressableProps, "children"> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  className?: string;
  textClassName?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary",
  secondary: "bg-accent",
  outline: "bg-transparent border-2 border-primary",
  ghost: "bg-transparent",
  destructive: "bg-danger",
};

const variantTextClasses: Record<ButtonVariant, string> = {
  primary: "text-white",
  secondary: "text-white",
  outline: "text-primary",
  ghost: "text-primary",
  destructive: "text-white",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "py-2.5 px-5",
  md: "py-3.5 px-6",
  lg: "py-[18px] px-8",
};

const sizeTextClasses: Record<ButtonSize, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

export function Button({
  title,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  className = "",
  textClassName = "",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      className={`flex-row items-center justify-center rounded-full ${variantClasses[variant]} ${sizeClasses[size]} ${isDisabled ? "opacity-50" : "active:opacity-80"} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "outline" || variant === "ghost" ? "#006B3F" : "#FFFFFF"}
        />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text
            className={`font-sans-semibold ${variantTextClasses[variant]} ${sizeTextClasses[size]} ${icon ? "ml-2" : ""} ${textClassName}`}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}
