import { COLORS } from "@/constants/theme";
import { formatNaira } from "@/lib/format";
import type { Order } from "@goshats/types";
import { Location, MoneyTick, Timer1 } from "iconsax-react-native";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

interface IncomingRequestBannerProps {
  order: Order;
  headerHeight: number;
  onAccept: () => void;
  onReject: () => void;
}

export function IncomingRequestBanner({
  order,
  headerHeight,
  onAccept,
  onReject,
}: IncomingRequestBannerProps) {
  const [timeLeft, setTimeLeft] = useState(60);
  const translateY = useSharedValue(-300);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 18, stiffness: 120 });
  }, []);

  const dismiss = (callback: () => void) => {
    translateY.value = withTiming(-300, { duration: 280 }, () => {
      runOnJS(callback)();
    });
  };

  useEffect(() => {
    if (timeLeft <= 0) {
      dismiss(onReject);
      return;
    }
    const timer = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const isDanger = timeLeft <= 15;
  const estimatedEarnings = (order.fareAmountKobo ?? 0) + (order.tipAmountKobo ?? 0);
  const progressPct = (timeLeft / 60) * 100;

  return (
    <Animated.View
      style={[
        animatedStyle,
        { position: "absolute", top: headerHeight + 8, left: 16, right: 16, zIndex: 9 },
      ]}
    >
      <View
        className="bg-white rounded-3xl overflow-hidden border border-gray-100"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 6,
        }}
      >
        {/* Progress bar */}
        <View className="h-1 bg-gray-100">
          <View
            className="h-full"
            style={{
              width: `${progressPct}%`,
              backgroundColor: isDanger ? "#EF4444" : COLORS.primary,
            }}
          />
        </View>

        <View className="p-4 gap-3">
          {/* Header row: timer + earnings */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: isDanger ? "#FEF2F2" : `${COLORS.primary}15` }}
              >
                <Timer1
                  size={15}
                  color={isDanger ? "#EF4444" : COLORS.primary}
                  variant="Bold"
                />
              </View>
              <View>
                <Text className="font-sans-bold text-[15px] text-gray-900">
                  New Request
                </Text>
                <Text
                  className="font-sans text-[11px]"
                  style={{ color: isDanger ? "#EF4444" : "#9CA3AF" }}
                >
                  {timeLeft}s remaining
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-1">
              <MoneyTick size={15} color={COLORS.primary} variant="Bold" />
              <Text className="font-sans-bold text-[17px]" style={{ color: COLORS.primary }}>
                {formatNaira(estimatedEarnings)}
              </Text>
            </View>
          </View>

          {/* Route card */}
          <View className="bg-gray-50 rounded-2xl p-3 gap-2">
            {/* Pickup */}
            <View className="flex-row items-center gap-2.5">
              <View className="w-2 h-2 rounded-full bg-gray-900" />
              <Text
                className="font-sans-medium text-[13px] text-gray-900 flex-1"
                numberOfLines={1}
              >
                {order.pickup?.address ?? "Pickup location"}
              </Text>
            </View>

            {/* Connector */}
            <View className="w-px h-3 bg-gray-300 ml-[3px]" />

            {/* Dropoff */}
            <View className="flex-row items-center gap-2.5">
              <Location size={10} color={COLORS.primary} variant="Bold" />
              <Text
                className="font-sans-medium text-[13px] text-gray-900 flex-1"
                numberOfLines={1}
              >
                {order.dropoff?.address ?? "Dropoff location"}
              </Text>
            </View>
          </View>

          {/* Buttons */}
          <View className="flex-row gap-2.5">
            <Pressable
              onPress={() => dismiss(onReject)}
              className="flex-1 py-3.5 rounded-full bg-gray-100 items-center active:opacity-70"
            >
              <Text className="font-sans-bold text-[14px] text-gray-700">
                Decline
              </Text>
            </Pressable>
            <Pressable
              onPress={onAccept}
              className="flex-[2] py-3.5 rounded-full items-center active:opacity-80"
              style={{ backgroundColor: COLORS.primary }}
            >
              <Text className="font-sans-bold text-[14px] text-white">
                Accept
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
