import React from "react";
import { View, Text } from "react-native";

type RiderTier = "standard" | "premium" | "express";

interface TierBadgeProps {
  tier: RiderTier;
  className?: string;
}

const tierConfig: Record<RiderTier, { bg: string; text: string; label: string }> = {
  standard: { bg: "bg-gray-100", text: "text-gray-700", label: "Standard" },
  premium: { bg: "bg-accent-50", text: "text-accent-700", label: "Premium" },
  express: { bg: "bg-primary-50", text: "text-primary-700", label: "Express" },
};

export function TierBadge({ tier, className = "" }: TierBadgeProps) {
  const config = tierConfig[tier];
  return (
    <View className={`px-3 py-1 rounded-full self-start ${config.bg} ${className}`}>
      <Text className={`font-sans-semibold text-xs ${config.text}`}>
        {config.label}
      </Text>
    </View>
  );
}
