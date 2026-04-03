import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { Marker } from "react-native-maps";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";

interface UserLocationMarkerProps {
  latitude: number;
  longitude: number;
  heading?: number | null;
}

export default function UserLocationMarker({
  latitude,
  longitude,
  heading,
}: UserLocationMarkerProps) {
  // tracksViewChanges must be true initially so the custom view renders,
  // then set to false to stop forcing a native redraw every frame.
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  // First pulse ring
  const pulse1Scale = useSharedValue(0.6);
  const pulse1Opacity = useSharedValue(0.5);

  // Second pulse ring (staggered)
  const pulse2Scale = useSharedValue(0.6);
  const pulse2Opacity = useSharedValue(0.5);

  // Subtle breathing glow on the dot
  const glowScale = useSharedValue(1);

  useEffect(() => {
    // Ring 1: expand and fade
    pulse1Scale.value = withRepeat(
      withTiming(2.8, { duration: 2000, easing: Easing.out(Easing.cubic) }),
      -1,
      false,
    );
    pulse1Opacity.value = withRepeat(
      withTiming(0, { duration: 2000, easing: Easing.out(Easing.cubic) }),
      -1,
      false,
    );

    // Ring 2: same but delayed 1s for double-ripple effect
    pulse2Scale.value = withDelay(
      1000,
      withRepeat(
        withTiming(2.8, { duration: 2000, easing: Easing.out(Easing.cubic) }),
        -1,
        false,
      ),
    );
    pulse2Opacity.value = withDelay(
      1000,
      withRepeat(
        withTiming(0, { duration: 2000, easing: Easing.out(Easing.cubic) }),
        -1,
        false,
      ),
    );

    // Gentle breathing on the main dot
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );

    // Stop tracking view changes after the first render cycle so the native
    // map layer doesn't re-composite the marker on every animation frame.
    const timer = setTimeout(() => setTracksViewChanges(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const pulse1Style = useAnimatedStyle(() => ({
    transform: [{ scale: pulse1Scale.value }],
    opacity: pulse1Opacity.value,
  }));

  const pulse2Style = useAnimatedStyle(() => ({
    transform: [{ scale: pulse2Scale.value }],
    opacity: pulse2Opacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
  }));

  return (
    <Marker
      coordinate={{ latitude, longitude }}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={tracksViewChanges}
    >
      <View style={{ width: 80, height: 80, alignItems: "center", justifyContent: "center" }}>
        {/* Pulse ring 1 */}
        <Animated.View
          style={[
            {
              position: "absolute",
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: "rgba(0, 107, 63, 0.2)",
              borderWidth: 1.5,
              borderColor: "rgba(0, 107, 63, 0.15)",
            },
            pulse1Style,
          ]}
        />

        {/* Pulse ring 2 (staggered) */}
        <Animated.View
          style={[
            {
              position: "absolute",
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: "rgba(0, 107, 63, 0.15)",
              borderWidth: 1,
              borderColor: "rgba(0, 107, 63, 0.1)",
            },
            pulse2Style,
          ]}
        />

        {/* Heading direction cone */}
        {heading != null && heading >= 0 && (
          <View
            style={{
              position: "absolute",
              width: 44,
              height: 44,
              alignItems: "center",
              transform: [{ rotate: `${heading}deg` }],
            }}
          >
            <View
              style={{
                width: 0,
                height: 0,
                borderLeftWidth: 8,
                borderRightWidth: 8,
                borderBottomWidth: 18,
                borderLeftColor: "transparent",
                borderRightColor: "transparent",
                borderBottomColor: "rgba(0, 107, 63, 0.18)",
                marginTop: -4,
              }}
            />
          </View>
        )}

        {/* Main dot with breathing glow */}
        <Animated.View
          style={[
            {
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: "white",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#006B3F",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 6,
              elevation: 6,
            },
            glowStyle,
          ]}
        >
          {/* Inner green dot */}
          <View
            style={{
              width: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: "#006B3F",
            }}
          />
          {/* Shine highlight */}
          <View
            style={{
              position: "absolute",
              top: 8,
              left: 9,
              width: 5,
              height: 5,
              borderRadius: 2.5,
              backgroundColor: "rgba(255, 255, 255, 0.6)",
            }}
          />
        </Animated.View>
      </View>
    </Marker>
  );
}
