import React from "react";
import { View, Text } from "react-native";

interface DividerProps {
  label?: string;
  className?: string;
}

export function Divider({ label, className = "" }: DividerProps) {
  if (label) {
    return (
      <View className={`flex-row items-center my-4 ${className}`}>
        <View className="flex-1 h-px bg-gray-200" />
        <Text className="font-sans text-sm text-gray-400 mx-3">{label}</Text>
        <View className="flex-1 h-px bg-gray-200" />
      </View>
    );
  }

  return <View className={`h-px bg-gray-200 my-4 ${className}`} />;
}
