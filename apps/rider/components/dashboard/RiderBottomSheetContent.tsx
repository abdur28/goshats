import { COLORS } from "@/constants/theme";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import type { ConditionAtPickup, Order, OrderStatus } from "@goshats/types";
import { Radar, WifiSquare } from "iconsax-react-native";
import { useEffect } from "react";
import { Platform, Switch, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { ActiveDeliveryCard } from "./ActiveDeliveryCard";
import { DeliveryCompleteCard } from "./DeliveryCompleteCard";
import { RequestCard } from "./RequestCard";

export type DashboardMode = "offline" | "online" | "requests" | "delivery" | "complete";

interface RiderBottomSheetContentProps {
  mode: DashboardMode;
  isOnline: boolean;
  onToggle: (value: boolean) => void;
  requests: Order[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onRequestPress: (order: Order) => void;
  activeOrder: Order | null;
  onStatusUpdate: (status: OrderStatus) => void;
  onConditionConfirm: (condition: ConditionAtPickup) => void;
  onChat: () => void;
  onDeliveryDone: () => void;
  completedEarningsKobo?: number;
}

function AnimatedDot({ delay, color }: { delay: number; color: string }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 350 }),
          withTiming(0.3, { duration: 350 }),
        ),
        -1,
        false,
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        { width: 4, height: 4, borderRadius: 2, backgroundColor: color },
        style,
      ]}
    />
  );
}

function AnimatedDots({ color }: { color: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
        marginLeft: 3,
      }}
    >
      <AnimatedDot delay={0} color={color} />
      <AnimatedDot delay={200} color={color} />
      <AnimatedDot delay={400} color={color} />
    </View>
  );
}

export function RiderBottomSheetContent({
  mode,
  isOnline,
  onToggle,
  requests,
  onAccept,
  onReject,
  onRequestPress,
  activeOrder,
  onStatusUpdate,
  onConditionConfirm,
  onChat,
  onDeliveryDone,
  completedEarningsKobo,
}: RiderBottomSheetContentProps) {
  const dotColor = isOnline ? "rgba(255,255,255,0.7)" : "#9CA3AF";

  // Delivery complete
  if (mode === "complete") {
    return (
      <BottomSheetScrollView
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 140, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <DeliveryCompleteCard
          earningsKobo={completedEarningsKobo ?? 0}
          onDone={onDeliveryDone}
        />
      </BottomSheetScrollView>
    );
  }

  // Active delivery
  if (mode === "delivery" && activeOrder) {
    return (
      <BottomSheetScrollView
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 140, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <ActiveDeliveryCard
          order={activeOrder}
          onStatusUpdate={onStatusUpdate}
          onConditionConfirm={onConditionConfirm}
          onChat={onChat}
        />
      </BottomSheetScrollView>
    );
  }

  // Idle / requests mode — show toggle + optional cards
  return (
    <BottomSheetScrollView
      contentContainerStyle={{ paddingTop: 8, paddingBottom: 140, paddingHorizontal: 20 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Toggle pill */}
      <View
        className={`flex-row items-center rounded-full py-2.5 pl-2.5 pr-5 gap-3 ${isOnline ? "bg-primary" : "bg-gray-100"}`}
        style={{
          shadowColor: isOnline ? COLORS.primary : "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isOnline ? 0.25 : 0.06,
          shadowRadius: 12,
          elevation: 4,
        }}
      >
        <View
          className="w-[52px] h-[52px] rounded-full items-center justify-center"
          style={{ backgroundColor: isOnline ? "rgba(255,255,255,0.2)" : "#fff" }}
        >
          {isOnline ? (
            <Radar size={24} color="#fff" variant="Bulk" />
          ) : (
            <WifiSquare size={24} color="#9CA3AF" variant="Bulk" />
          )}
        </View>

        <View className="flex-1">
          <Text
            className={`font-sans-bold text-[15px] mb-0.5 ${isOnline ? "text-white" : "text-gray-900"}`}
          >
            {isOnline ? "You're Online" : "You're Offline"}
          </Text>
          <View className="flex-row items-center">
            <Text
              className="font-sans text-xs"
              style={{ color: isOnline ? "rgba(255,255,255,0.7)" : "#9CA3AF" }}
            >
              {isOnline ? "Receiving delivery requests" : "Toggle to start earning"}
            </Text>
            {isOnline && <AnimatedDots color={dotColor} />}
          </View>
        </View>

        <Switch
          value={isOnline}
          onValueChange={onToggle}
          trackColor={{ false: "#D1D5DB", true: "rgba(255,255,255,0.35)" }}
          thumbColor="#ffffff"
          className={Platform.OS === "ios" ? "mt-3" : ""}
          ios_backgroundColor="#D1D5DB"
        />
      </View>

      {/* Request cards */}
      {requests.length > 0 && (
        <View className="mt-4">
          {requests.map((order) => (
            <RequestCard
              key={order.id}
              order={order}
              onAccept={() => onAccept(order.id)}
              onReject={() => onReject(order.id)}
              onPress={() => onRequestPress(order)}
            />
          ))}
        </View>
      )}
    </BottomSheetScrollView>
  );
}
