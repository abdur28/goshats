import React from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  interpolate,
  interpolateColor,
  type SharedValue,
} from "react-native-reanimated";

interface PaginationDotsProps {
  scrollX: SharedValue<number>;
  total: number;
  screenWidth: number;
}

function Dot({
  index,
  scrollX,
  screenWidth,
}: {
  index: number;
  scrollX: SharedValue<number>;
  screenWidth: number;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * screenWidth,
      index * screenWidth,
      (index + 1) * screenWidth,
    ];

    const width = interpolate(
      Math.abs(scrollX.value),
      inputRange,
      [8, 24, 8],
      "clamp",
    );

    const backgroundColor = interpolateColor(
      Math.abs(scrollX.value),
      inputRange,
      ["#D1D5DB", "#006B3F", "#D1D5DB"],
    );

    return { width, backgroundColor };
  });

  return <Animated.View className="h-1 rounded-full" style={animatedStyle} />;
}

export function PaginationDots({
  scrollX,
  total,
  screenWidth,
}: PaginationDotsProps) {
  return (
    <View className="flex-row items-center gap-1.5">
      {Array.from({ length: total }).map((_, index) => (
        <Dot
          key={index}
          index={index}
          scrollX={scrollX}
          screenWidth={screenWidth}
        />
      ))}
    </View>
  );
}
