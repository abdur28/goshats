import { OnboardingSlide } from "@/components/onboarding/OnboardingSlide";
import { PaginationDots } from "@/components/onboarding/PaginationDots";
import { onboardingSlides } from "@/constants/onboarding";
import { useAuthStore } from "@/store/auth-store";
import { Redirect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useState } from "react";
import { Dimensions, Pressable, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TOTAL_SLIDES = onboardingSlides.length;

const TIMING_CONFIG = {
  duration: 350,
  easing: Easing.out(Easing.cubic),
};

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, authInitialized } = useAuthStore();
  const [activeIndex, setActiveIndex] = useState(0);

  const translateX = useSharedValue(0);
  const offsetX = useSharedValue(0);

  const updateIndex = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const snapToSlide = useCallback(
    (index: number) => {
      "worklet";
      translateX.value = withTiming(-index * SCREEN_WIDTH, TIMING_CONFIG);
      runOnJS(updateIndex)(index);
    },
    [translateX, updateIndex],
  );

  const handleNext = useCallback(() => {
    if (activeIndex < TOTAL_SLIDES - 1) {
      const next = activeIndex + 1;
      translateX.value = withTiming(-next * SCREEN_WIDTH, TIMING_CONFIG);
      setActiveIndex(next);
    }
  }, [activeIndex, translateX]);

  const handleFinish = useCallback(() => {
    router.push("/(auth)/welcome" as any);
  }, [router]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .onStart(() => {
      offsetX.value = translateX.value;
    })
    .onUpdate((event) => {
      const newValue = offsetX.value + event.translationX;
      const maxScroll = -(TOTAL_SLIDES - 1) * SCREEN_WIDTH;
      if (newValue > 0) {
        translateX.value = newValue * 0.2;
      } else if (newValue < maxScroll) {
        translateX.value = maxScroll + (newValue - maxScroll) * 0.2;
      } else {
        translateX.value = newValue;
      }
    })
    .onEnd((event) => {
      const progress = -translateX.value / SCREEN_WIDTH;
      let targetIndex = Math.round(progress);

      if (Math.abs(event.velocityX) > 300) {
        if (event.velocityX < 0) {
          targetIndex = Math.ceil(progress);
        } else {
          targetIndex = Math.floor(progress);
        }
      }

      targetIndex = Math.max(0, Math.min(targetIndex, TOTAL_SLIDES - 1));
      snapToSlide(targetIndex);
    });

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const isLastSlide = activeIndex === TOTAL_SLIDES - 1;

  // Skip onboarding for authenticated users
  if (authInitialized && isAuthenticated) {
    return <Redirect href={"/(root)/" as any} />;
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />

      {/* Slides */}
      <View className="flex-1">
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              {
                flexDirection: "row",
                width: SCREEN_WIDTH * TOTAL_SLIDES,
                flex: 1,
              },
              containerAnimatedStyle,
            ]}
          >
            {onboardingSlides.map((slide, index) => (
              <OnboardingSlide
                key={slide.id}
                slide={slide}
                index={index}
                scrollX={translateX}
                screenWidth={SCREEN_WIDTH}
              />
            ))}
          </Animated.View>
        </GestureDetector>
      </View>

      {/* Bottom bar */}
      <View
        className="px-6 pt-4 gap-5 bg-white"
        style={{ paddingBottom: Math.max(insets.bottom, 24) }}
      >
        <View className="items-center">
          <PaginationDots
            scrollX={translateX}
            total={TOTAL_SLIDES}
            screenWidth={SCREEN_WIDTH}
          />
        </View>

        <Pressable
          onPress={isLastSlide ? handleFinish : handleNext}
          className="bg-primary py-[18px] rounded-full items-center justify-center active:opacity-85"
        >
          <Text className="text-[17px] font-sans-semibold text-white">
            Continue
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
