import React from "react";
import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
  className?: string;
}

export function StarRating({
  rating,
  maxStars = 5,
  size = 20,
  interactive = false,
  onRate,
  className = "",
}: StarRatingProps) {
  return (
    <View className={`flex-row gap-0.5 ${className}`}>
      {Array.from({ length: maxStars }, (_, i) => {
        const starIndex = i + 1;
        const isFilled = starIndex <= Math.floor(rating);
        const isHalf = !isFilled && starIndex <= rating + 0.5;

        const icon = isFilled
          ? "star"
          : isHalf
            ? "star-half"
            : "star-outline";

        const star = (
          <Ionicons
            key={i}
            name={icon}
            size={size}
            color="#DAA520"
          />
        );

        if (interactive && onRate) {
          return (
            <Pressable key={i} onPress={() => onRate(starIndex)}>
              {star}
            </Pressable>
          );
        }

        return star;
      })}
    </View>
  );
}
