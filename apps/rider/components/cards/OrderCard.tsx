import { router } from "expo-router";
import {
  ArrowRight2,
  Box,
  Category2,
  DocumentText,
  Reserve,
} from "iconsax-react-native";
import { memo } from "react";
import { Pressable, Text, View } from "react-native";

export type OrderType = "food" | "parcel" | "document" | "other";
export type OrderStatus =
  | "pending"
  | "accepted"
  | "arrived_pickup"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "cancelled";

export interface Order {
  id: string;
  loadType: OrderType;
  dropoff: {
    address: string;
  };
  date: string;
  totalAmountKobo: number;
  status: OrderStatus;
}

export const formatPrice = (kobo: number) => {
  return `₦${(kobo / 100).toLocaleString()}`;
};

export const getStatusConfig = (status: OrderStatus) => {
  switch (status) {
    case "delivered":
      return { text: "text-[#006B3F]" };
    case "cancelled":
      return { text: "text-[#ef4444]" };
    default:
      return { text: "text-[#f59e0b]" };
  }
};

export const getTypeIcon = (type: OrderType, size = 24) => {
  switch (type) {
    case "food":
      return <Reserve size={size} color="#006B3F" variant="Bulk" />;
    case "parcel":
      return <Box size={size} color="#006B3F" variant="Bulk" />;
    case "document":
      return <DocumentText size={size} color="#006B3F" variant="Bulk" />;
    case "other":
      return <Category2 size={size} color="#006B3F" variant="Bulk" />;
  }
};

interface OrderCardProps {
  item: Order;
  onPress?: () => void;
  styleClass?: string;
}

export const OrderCard = memo(
  ({ item, onPress, styleClass = "mb-4 mx-5" }: OrderCardProps) => {
    const statusConfig = getStatusConfig(item.status);

    const handlePress = () => {
      if (onPress) {
        onPress();
      } else {
        router.push({
          pathname: "/orders/[id]",
          params: { id: item.id },
        } as any);
      }
    };

    return (
      <Pressable
        onPress={handlePress}
        className={`bg-white rounded-[24px] p-5 border border-gray-100/60 active:opacity-80 ${styleClass}`}
      >
        {/* Top Row: Icon + Title + Price */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-4 flex-1">
            <View className="w-[48px] h-[48px] rounded-[16px] items-center justify-center bg-primary/5 border border-primary/10">
              {getTypeIcon(item.loadType)}
            </View>
            <View className="flex-1 pr-2">
              <Text
                className="text-[16px] font-sans text-gray-900 mb-0.5"
                numberOfLines={1}
              >
                {item.dropoff.address}
              </Text>
              <Text className="text-[13px] font-sans text-gray-500 capitalize">
                {item.loadType} · {item.date}
              </Text>
            </View>
          </View>
          <View className="items-end pl-1">
            <Text className="text-[16px] font-sans text-gray-900">
              {formatPrice(item.totalAmountKobo)}
            </Text>
          </View>
        </View>

        {/* Bottom Row: Status Tag + Details Icon */}
        <View className="flex-row items-center justify-between bg-gray-50/50 pt-3 pb-1 border-t border-gray-100/50 mt-1">
          <View className={`flex-row items-center px-2 py-1 rounded-[6px] `}>
            <Text
              className={`text-[9px] font-sans-bold uppercase tracking-widest ${statusConfig.text}`}
            >
              {item.status.replace("_", " ")}
            </Text>
          </View>

          <View className="p-1">
            <ArrowRight2 size={16} color="#9CA3AF" variant="Linear" />
          </View>
        </View>
      </Pressable>
    );
  },
);
