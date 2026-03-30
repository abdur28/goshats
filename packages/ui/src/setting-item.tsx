import { ArrowRight2 } from "iconsax-react-native";
import type { IconProps } from "iconsax-react-native";
import type { FC } from "react";
import React from "react";
import { Pressable, Text, View } from "react-native";

export interface SettingItemProps {
  icon: FC<IconProps>;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showArrow?: boolean;
  variant?: "primary" | "danger";
  isLast?: boolean;
}

export const SettingItem = ({
  icon: Icon,
  title,
  subtitle,
  onPress,
  showArrow = true,
  variant = "primary",
  isLast = false,
}: SettingItemProps) => {
  const isDanger = variant === "danger";

  // Tailwind equivalent colors based on the app's theme
  const iconColor = isDanger ? "#EF4444" : "#006B3F";
  const iconBgClass = isDanger ? "bg-red-500/15" : "bg-primary/15";
  const titleColorClass = isDanger ? "text-danger" : "text-gray-900";

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center py-[18px] px-6 bg-white rounded-[24px] shadow-sm border border-gray-100 ${
        isLast ? "" : "mb-3"
      }`}
      style={({ pressed }) => ({
        backgroundColor: pressed ? "#F9FAFB" : "#FFFFFF",
      })}
    >
      <View
        className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${iconBgClass}`}
      >
        <Icon size={24} color={iconColor} variant="TwoTone" />
      </View>

      <View className="flex-1 justify-center">
        <Text
          className={`font-sans-semibold text-base ${titleColorClass} ${
            subtitle ? "mb-0.5" : ""
          }`}
        >
          {title}
        </Text>
        {subtitle && (
          <Text className="font-sans text-sm text-gray-500">
            {subtitle}
          </Text>
        )}
      </View>

      {showArrow && (
        <ArrowRight2 size={20} color="#9CA3AF" variant="Linear" />
      )}
    </Pressable>
  );
};
