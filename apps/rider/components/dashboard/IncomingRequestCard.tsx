import { COLORS } from "@/constants/theme";
import { formatNaira } from "@/lib/format";
import type { Order } from "@goshats/types";
import { Location, MoneyTick, Routing2, Timer1 } from "iconsax-react-native";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

interface IncomingRequestCardProps {
  order: Order;
  onAccept: () => void;
  onReject: () => void;
}

export function IncomingRequestCard({
  order,
  onAccept,
  onReject,
}: IncomingRequestCardProps) {
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    if (timeLeft <= 0) {
      onReject();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, onReject]);

  const progressPercentage = (timeLeft / 60) * 100;
  const isDanger = timeLeft <= 10;
  
  // Calculate potential earnings (Fare + Tip) ignoring booking fees
  const estimatedEarnings = (order.fareAmountKobo || 0) + (order.tipAmountKobo || 0);

  return (
    <View className="bg-white rounded-[32px] overflow-hidden">
      {/* Top Banner indicating Request */}
      <View className={`${isDanger ? "bg-red-500" : "bg-primary"} p-4 items-center`}>
        <View className="flex-row items-center gap-2 mb-2">
          <Timer1 size={20} color="#FFF" variant="Bold" />
          <Text className="text-white font-sans-bold text-[18px]">
            New Delivery Request
          </Text>
        </View>
        <Text className="font-sans-medium text-[15px]" style={{ color: "rgba(255,255,255,0.9)" }}>
          {timeLeft} seconds remaining...
        </Text>
      </View>

      {/* Timer Progress Bar */}
      <View className="h-1.5 w-full bg-gray-200">
        <View
          className={`h-full ${isDanger ? "bg-red-500" : "bg-primary"}`}
          style={{ width: `${progressPercentage}%` }}
        />
      </View>

      <View className="px-6 py-6 border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-gray-500 font-sans-medium text-[13px] uppercase tracking-wider mb-1">
              Estimated Earnings
            </Text>
            <Text
              className="text-gray-900 text-[32px] tracking-tight"
              style={{ fontFamily: "PolySans-Bulky" }}
            >
              {formatNaira(estimatedEarnings)}
            </Text>
          </View>
          <View className="w-12 h-12 bg-green-50 rounded-full items-center justify-center">
            <MoneyTick size={24} color={COLORS.primary} variant="Bulk" />
          </View>
        </View>

        {/* Route Details */}
        <View className="bg-gray-50 p-4 rounded-2xl">
          <View className="flex-row gap-3">
            <View className="items-center pb-1 pt-1">
              <View className="w-4 h-4 rounded-full bg-gray-900 border-[3px] border-gray-200" />
              <View className="w-0.5 h-10 bg-gray-200 my-1" />
              <Location size={16} color={COLORS.primary} variant="Bold" />
            </View>
            <View className="flex-1 justify-between">
              <View>
                <Text className="text-gray-500 font-sans-medium text-xs mb-0.5">
                  PICKUP
                </Text>
                <Text
                  className="text-gray-900 font-sans-bold text-[15px]"
                  numberOfLines={1}
                >
                  {order.pickup.address}
                </Text>
              </View>

              <View>
                <Text className="text-gray-500 font-sans-medium text-xs mt-2 mb-0.5">
                  DROPOFF
                </Text>
                <Text
                  className="text-gray-900 font-sans-bold text-[15px]"
                  numberOfLines={1}
                >
                  {order.dropoff.address}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        <View className="flex-row items-center gap-2 mt-4 ml-1">
           <Routing2 size={16} color="#6B7280" />
           <Text className="text-gray-500 font-sans-semibold capitalize text-[13px]">
             Load Type: {order.loadType}
           </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="p-6 flex-row gap-4">
        <Pressable
          onPress={onReject}
          style={{
            flex: 1,
            paddingVertical: 16,
            borderRadius: 16,
            backgroundColor: "#F3F4F6",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text className="text-gray-900 font-sans-bold text-[16px]">Decline</Text>
        </Pressable>
        <Pressable
          onPress={onAccept}
          style={{
            flex: 2,
            paddingVertical: 16,
            borderRadius: 16,
            backgroundColor: COLORS.primary,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
          }}
        >
          <Text className="text-white font-sans-bold text-[16px]">Accept Delivery</Text>
        </Pressable>
      </View>
    </View>
  );
}
