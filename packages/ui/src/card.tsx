import React from "react";
import { View, Pressable, type ViewProps } from "react-native";

interface CardProps extends ViewProps {
  onPress?: () => void;
  className?: string;
  children: React.ReactNode;
}

export function Card({ onPress, className = "", children, ...props }: CardProps) {
  const cardClasses = `bg-white rounded-2xl p-4 shadow-sm shadow-black/5 ${className}`;

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={`${cardClasses} active:opacity-80`}
        {...props}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View className={cardClasses} {...props}>
      {children}
    </View>
  );
}
