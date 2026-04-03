import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Dimensions, Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const SPRING_CONFIG = { damping: 18, stiffness: 140 };

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(30);
  const buttonsOpacity = useSharedValue(0);
  const buttonsTranslateY = useSharedValue(25);

  useEffect(() => {
    contentOpacity.value = withDelay(200, withTiming(1, { duration: 500 }));
    contentTranslateY.value = withDelay(200, withSpring(0, SPRING_CONFIG));
    buttonsOpacity.value = withDelay(450, withTiming(1, { duration: 500 }));
    buttonsTranslateY.value = withDelay(450, withSpring(0, SPRING_CONFIG));
  }, []);

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const buttonsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{ translateY: buttonsTranslateY.value }],
  }));

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />

      {/* Hero image */}
      <View className="overflow-hidden" style={{ height: SCREEN_HEIGHT * 0.57 }}>
        <Image
          source={require("@/assets/images/background.png")}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
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

      {/* Content area */}
      <View
        className="flex-1 px-7 py-12 justify-between"
        style={{ paddingBottom: Math.max(insets.bottom, 20) }}
      >
        {/* Title + subtitle */}
        <Animated.View style={contentAnimatedStyle}>
          <Text className="text-[32px] leading-[40px] text-gray-900 font-sans-bold text-center">
            Ride with{"\n"}
            <Text className="text-primary">GO SHATS</Text>
          </Text>
          <Text className="text-[15px] leading-[22px] text-gray-400 font-sans text-center mt-3">
            Join our rider network and start earning{"\n"}on your own schedule.
          </Text>
        </Animated.View>

        {/* Buttons */}
        <Animated.View className="gap-3" style={buttonsAnimatedStyle}>
          {/* Sign In — primary */}
          <Pressable
            onPress={() => router.push("/(auth)/sign-in" as any)}
            style={{
              backgroundColor: "#006B3F",
              paddingVertical: 18,
              borderRadius: 9999,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
            <Text
              style={{
                fontSize: 16,
                fontFamily: "PolySans-Median",
                color: "#FFFFFF",
              }}
            >
              Sign In
            </Text>
          </Pressable>

          {/* Apply to join — outline */}
          <Pressable
            onPress={() => router.push("/(auth)/register" as any)}
            style={{
              paddingVertical: 18,
              borderRadius: 9999,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              borderWidth: 1.5,
              borderColor: "#006B3F",
            }}
          >
            <Ionicons name="bicycle-outline" size={20} color="#006B3F" />
            <Text
              style={{
                fontSize: 16,
                fontFamily: "PolySans-Median",
                color: "#006B3F",
              }}
            >
              Apply to Join
            </Text>
          </Pressable>

          {/* Terms */}
          <Text className="text-xs leading-[18px] text-gray-400 font-sans text-center mt-1">
            By continuing you agree to our{" "}
            <Text className="font-sans-medium text-gray-700 underline">
              Terms of Use
            </Text>{" "}
            and{" "}
            <Text className="font-sans-medium text-gray-700 underline">
              Privacy Policy
            </Text>
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}
