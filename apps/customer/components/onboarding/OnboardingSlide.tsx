import { type OnboardingSlide as SlideData } from "@/constants/onboarding";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Image, Text, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

interface OnboardingSlideProps {
  slide: SlideData;
  index: number;
  scrollX: SharedValue<number>;
  screenWidth: number;
}

export function OnboardingSlide({
  slide,
  index,
  scrollX,
  screenWidth,
}: OnboardingSlideProps) {
  const inputRange = [
    (index - 1) * screenWidth,
    index * screenWidth,
    (index + 1) * screenWidth,
  ];

  const imageAnimatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      Math.abs(scrollX.value),
      inputRange,
      [-screenWidth * 0.15, 0, screenWidth * 0.15],
      "clamp",
    );
    return { transform: [{ translateX }] };
  });

  const textAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      Math.abs(scrollX.value),
      inputRange,
      [0, 1, 0],
      "clamp",
    );
    const translateY = interpolate(
      Math.abs(scrollX.value),
      inputRange,
      [20, 0, 20],
      "clamp",
    );
    return { opacity, transform: [{ translateY }] };
  });

  return (
    <View style={{ width: screenWidth }} className="flex-1">
      {/* Hero image — 70% */}
      <View className="overflow-hidden" style={{ flex: 8 }}>
        <Animated.View
          style={[
            {
              width: screenWidth * 1.3,
              height: "110%",
              marginLeft: -screenWidth * 0.15,
            },
            imageAnimatedStyle,
          ]}
        >
          <Image
            source={slide.image}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        </Animated.View>

        <LinearGradient
          colors={["transparent", "rgba(255,255,255,0.5)", "#FFFFFF"]}
          locations={[0.2, 0.65, 1]}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "50%",
          }}
        />
      </View>

      {/* Text — 30% */}
      <Animated.View
        style={[{ flex: 1 }, textAnimatedStyle]}
        className="px-7 py-6 my-4 justify-start"
      >
        <Text className="text-[28px] leading-[38px] text-gray-900 font-sans-medium">
          {slide.titleParts.map((part, i) =>
            part.emphasized ? (
              <Text key={i} className="font-sans-bold italic text-accent">
                {part.text}
              </Text>
            ) : (
              <Text key={i} className="font-sans">
                {part.text}
              </Text>
            ),
          )}
        </Text>

        <Text className="text-sm leading-[21px] text-gray-400 font-sans mt-2.5">
          {slide.subtitle}
        </Text>
      </Animated.View>
    </View>
  );
}
