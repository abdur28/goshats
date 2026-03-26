import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface HeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  className?: string;
}

export function Header({ title, onBack, rightAction, className = "" }: HeaderProps) {
  return (
    <View className={`flex-row items-center justify-between px-4 py-3 ${className}`}>
      <View className="w-10">
        {onBack && (
          <Pressable
            onPress={onBack}
            className="w-10 h-10 items-center justify-center rounded-full active:opacity-80"
          >
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </Pressable>
        )}
      </View>
      <Text className="font-sans-semibold text-lg text-gray-900 flex-1 text-center">
        {title}
      </Text>
      <View className="w-10 items-end">{rightAction}</View>
    </View>
  );
}
