import type { Order } from "@goshats/types";
import { TruckFast } from "iconsax-react-native";
import { Pressable, Text, View } from "react-native";

const STATUS_STEP: Record<string, number> = {
  pending: 0,
  accepted: 1,
  arrived_pickup: 1,
  picked_up: 2,
  in_transit: 2,
  delivered: 3,
  cancelled: 0,
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Waiting for Rider",
  accepted: "Rider En Route",
  arrived_pickup: "Now Arriving",
  picked_up: "Picked Up",
  in_transit: "Now Arriving",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function formatEta(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 1) return "< 1 min";
  return `ETA ${mins} min`;
}

interface TrackingTimelineCardProps {
  order: Order;
  onPress?: () => void;
}

export const TrackingTimelineCard = ({
  order,
  onPress,
}: TrackingTimelineCardProps) => {
  const step = STATUS_STEP[order.status] ?? 0;
  const progressPct = (step / 3) * 100;
  const statusLabel = STATUS_LABELS[order.status] ?? "Active";
  const etaLabel = order.estimatedDurationSeconds
    ? formatEta(order.estimatedDurationSeconds)
    : undefined;

  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-[24px] p-4 mb-2 border border-[#DAA520]/20 shadow-sm active:opacity-90"
    >
      <View className="flex-row justify-between items-end mb-4">
        <View className="w-[70%]">
          <Text className="text-[10px] font-sans-bold text-[#DAA520] uppercase tracking-widest mb-1 mt-1">
            {statusLabel}
          </Text>
          <Text
            className="text-[15px] font-sans-black text-gray-900 leading-tight"
            numberOfLines={1}
          >
            {order.dropoff?.address}
          </Text>
        </View>
        {etaLabel && (
          <View className="bg-[#DAA520]/10 px-2.5 py-1.5 rounded-[8px]">
            <Text className="text-[10px] font-sans-bold tracking-widest text-[#DAA520] uppercase">
              {etaLabel}
            </Text>
          </View>
        )}
      </View>

      {/* Timeline graphic container */}
      <View className="px-1 mt-2">
        <View className="relative">
          {/* Line Background */}
          <View className="absolute left-[5%] right-[5%] h-[3px] bg-gray-100 top-[14px] rounded-full" />
          <View
            style={{ width: `${progressPct * 0.9}%` }}
            className="absolute left-[5%] h-[3px] bg-[#DAA520] top-[14px] rounded-full"
          />

          <View className="flex-row justify-between">
            {(["Booked", "Pickup", "Transit", "Dropoff"] as const).map(
              (label, idx) => {
                const done = idx < step;
                const isCurrent = idx === step;
                return (
                  <View key={label} className="items-center w-14 z-10">
                    {isCurrent ? (
                      <View className="w-10 h-10 bg-[#DAA520] border-2 border-white rounded-full items-center justify-center mb-0.5 shadow-sm">
                        <TruckFast size={18} color="#FFF" variant="Bold" />
                      </View>
                    ) : (
                      <View
                        className={`w-3.5 h-3.5 rounded-full border-2 border-white mb-2 mt-[8px] ${done ? "bg-[#DAA520]" : "bg-gray-200"}`}
                      />
                    )}
                    <Text
                      className={`text-[8px] font-sans-bold uppercase tracking-widest ${isCurrent || done ? "text-[#DAA520]" : "text-gray-400"}`}
                    >
                      {label}
                    </Text>
                  </View>
                );
              },
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
};
