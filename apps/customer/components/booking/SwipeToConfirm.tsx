import { COLORS } from "@/constants/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Box1 } from "iconsax-react-native";
import React, { useCallback } from "react";
import { Text, View, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const THUMB_SIZE = 60;
const TRACK_HEIGHT = 72;
const TRACK_PADDING = 6;
const SPRING_CONFIG = { damping: 20, stiffness: 200, mass: 0.8 };

interface SwipeToConfirmProps {
  onConfirm: () => void;
  label?: string;
  disabled?: boolean;
  loading?: boolean;
}

function ArrowChevrons() {
  const a1 = useSharedValue(0);
  const a2 = useSharedValue(0);
  const a3 = useSharedValue(0);

  React.useEffect(() => {
    const duration = 600;
    const delay = 150;
    const animate = (sv: Animated.SharedValue<number>, d: number) => {
      sv.value = withDelay(
        d,
        withRepeat(
          withSequence(
            withTiming(1, { duration, easing: Easing.out(Easing.ease) }),
            withTiming(0, { duration, easing: Easing.in(Easing.ease) }),
          ),
          -1,
        ),
      );
    };
    animate(a1, 0);
    animate(a2, delay);
    animate(a3, delay * 2);
  }, [a1, a2, a3]);

  const s1 = useAnimatedStyle(() => ({ opacity: interpolate(a1.value, [0, 1], [0.2, 0.7]) }));
  const s2 = useAnimatedStyle(() => ({ opacity: interpolate(a2.value, [0, 1], [0.2, 0.7]) }));
  const s3 = useAnimatedStyle(() => ({ opacity: interpolate(a3.value, [0, 1], [0.2, 0.7]) }));

  const chevron = (style: any, key: number) => (
    <Animated.View key={key} style={style}>
      <Text style={{ fontSize: 18, color: "#FFFFFF", fontFamily: "PolySans-Bulky" }}>
        {"\u203A"}
      </Text>
    </Animated.View>
  );

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
      {chevron(s1, 1)}
      {chevron(s2, 2)}
      {chevron(s3, 3)}
    </View>
  );
}

export default function SwipeToConfirm({
  onConfirm,
  label = "Swipe to confirm",
  disabled = false,
  loading = false,
}: SwipeToConfirmProps) {
  const { width: screenWidth } = useWindowDimensions();
  const trackWidth = screenWidth - 40; // 20px padding on each side
  const maxTranslate = trackWidth - THUMB_SIZE - TRACK_PADDING * 2;

  const translateX = useSharedValue(0);
  const confirmed = useSharedValue(false);

  const handleConfirm = useCallback(() => {
    onConfirm();
  }, [onConfirm]);

  const panGesture = Gesture.Pan()
    .enabled(!disabled && !loading)
    .onUpdate((e) => {
      translateX.value = Math.min(Math.max(0, e.translationX), maxTranslate);
    })
    .onEnd(() => {
      if (translateX.value > maxTranslate * 0.7) {
        translateX.value = withSpring(maxTranslate, SPRING_CONFIG);
        confirmed.value = true;
        runOnJS(handleConfirm)();
      } else {
        translateX.value = withSpring(0, SPRING_CONFIG);
      }
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const trackStyle = useAnimatedStyle(() => {
    const progress = translateX.value / maxTranslate;
    return {
      backgroundColor: interpolateColor(
        progress,
        [0, 0.7, 1],
        ["#1A1A1A", "#004D2E", COLORS.primary],
      ),
    };
  });

  const labelStyle = useAnimatedStyle(() => {
    const progress = translateX.value / maxTranslate;
    return {
      opacity: interpolate(progress, [0, 0.3], [1, 0]),
    };
  });

  const rightIconStyle = useAnimatedStyle(() => {
    const progress = translateX.value / maxTranslate;
    return {
      opacity: interpolate(progress, [0, 0.5, 0.8], [1, 0.5, 0]),
      transform: [{ scale: interpolate(progress, [0.6, 1], [1, 0.8]) }],
    };
  });

  return (
    <Animated.View
      style={[
        {
          height: TRACK_HEIGHT,
          borderRadius: TRACK_HEIGHT / 2,
          padding: TRACK_PADDING,
          flexDirection: "row",
          alignItems: "center",
          overflow: "hidden",
        },
        trackStyle,
      ]}
    >
      {/* Thumb (draggable) */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            {
              width: THUMB_SIZE,
              height: THUMB_SIZE,
              borderRadius: THUMB_SIZE / 2,
              backgroundColor: "#FFFFFF",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
              elevation: 4,
            },
            thumbStyle,
          ]}
        >
          {loading ? (
            <Animated.View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                borderWidth: 2.5,
                borderColor: COLORS.primary,
                borderTopColor: "transparent",
              }}
            />
          ) : (
            <MaterialCommunityIcons
              name="truck-fast-outline"
              size={26}
              color={COLORS.primary}
            />
          )}
        </Animated.View>
      </GestureDetector>

      {/* Center label + arrows */}
      <Animated.View
        style={[
          {
            position: "absolute",
            left: 0,
            right: 0,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          },
          labelStyle,
        ]}
      >
        <ArrowChevrons />
        <Text
          style={{
            fontFamily: "PolySans-Median",
            fontSize: 14,
            color: "#FFFFFF",
            letterSpacing: 0.3,
          }}
        >
          {label}
        </Text>
        <ArrowChevrons />
      </Animated.View>

      {/* Right icon (package destination) */}
      <Animated.View
        style={[
          {
            position: "absolute",
            right: TRACK_PADDING,
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            borderRadius: THUMB_SIZE / 2,
            backgroundColor: "rgba(255,255,255,0.15)",
            alignItems: "center",
            justifyContent: "center",
          },
          rightIconStyle,
        ]}
      >
        <Box1 size={26} color="#FFFFFF" variant="Bold" />
      </Animated.View>
    </Animated.View>
  );
}
