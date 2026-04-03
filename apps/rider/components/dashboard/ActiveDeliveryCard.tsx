import { COLORS } from "@/constants/theme";
import { formatNaira } from "@/lib/format";
import { getUser } from "@goshats/firebase";
import type { ConditionAtPickup, Order, OrderStatus, User } from "@goshats/types";
import { Avatar } from "@goshats/ui";
import {
  Call,
  CloseCircle,
  Message,
  TickCircle,
  TruckFast,
  Warning2,
} from "iconsax-react-native";
import { useEffect, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";

const STATUS_STEP: Record<string, number> = {
  accepted: 0,
  arrived_pickup: 1,
  picked_up: 2,
  in_transit: 2,
  delivered: 3,
};

const STATUS_LABELS: Record<string, string> = {
  accepted: "En Route to Pickup",
  arrived_pickup: "At Pickup Location",
  picked_up: "Package Collected",
  in_transit: "On the Way",
  delivered: "Delivered",
};

const ACTION_LABELS: Record<string, string> = {
  accepted: "Arrived at Pickup",
  arrived_pickup: "Confirm Pickup",
  picked_up: "Start Delivery",
  in_transit: "Confirm Delivery",
};

const NEXT_STATUS: Record<string, OrderStatus> = {
  accepted: "arrived_pickup",
  arrived_pickup: "picked_up",
  picked_up: "in_transit",
  in_transit: "delivered",
};

const CONDITION_OPTIONS: {
  value: ConditionAtPickup;
  label: string;
  icon: typeof TickCircle;
  color: string;
  bg: string;
}[] = [
  {
    value: "good",
    label: "Good Condition",
    icon: TickCircle,
    color: COLORS.primary,
    bg: `${COLORS.primary}15`,
  },
  {
    value: "damaged",
    label: "Already Damaged",
    icon: Warning2,
    color: "#F59E0B",
    bg: "#FEF3C7",
  },
  {
    value: "refused",
    label: "Refused by Sender",
    icon: CloseCircle,
    color: "#EF4444",
    bg: "#FEE2E2",
  },
];

interface ActiveDeliveryCardProps {
  order: Order;
  onStatusUpdate: (status: OrderStatus) => void;
  onConditionConfirm: (condition: ConditionAtPickup) => void;
  onChat: () => void;
}

export function ActiveDeliveryCard({
  order,
  onStatusUpdate,
  onConditionConfirm,
  onChat,
}: ActiveDeliveryCardProps) {
  const step = STATUS_STEP[order.status] ?? 0;
  const progressPct = (step / 3) * 100;
  const statusLabel = STATUS_LABELS[order.status] ?? "Active";
  const actionLabel = ACTION_LABELS[order.status];
  const nextStatus = NEXT_STATUS[order.status];

  const [customer, setCustomer] = useState<User | null>(null);

  useEffect(() => {
    if (!order.customerId) return;
    getUser(order.customerId)
      .then(setCustomer)
      .catch((e) => console.warn("[ActiveDeliveryCard] getUser failed:", e));
  }, [order.customerId]);

  const customerName = customer
    ? `${customer.otherName} ${customer.surname}`
    : "Customer";
  const customerPhone = customer?.phone ?? null;

  const handleCall = () => {
    if (customerPhone) Linking.openURL(`tel:${customerPhone}`);
  };

  return (
    <View className="gap-3">
      {/* Status + address card */}
      <View
        className="rounded-3xl p-[18px]"
        style={{ backgroundColor: "#1A1A1A" }}
      >
        <Text
          className="font-sans-bold text-[10px] uppercase tracking-widest mb-1"
          style={{ color: COLORS.primary }}
        >
          {statusLabel}
        </Text>
        <Text
          className="font-sans-bold text-[16px] text-white mb-1.5"
          numberOfLines={2}
        >
          {order.status === "accepted" || order.status === "arrived_pickup"
            ? order.pickup?.address
            : order.dropoff?.address}
        </Text>
        <Text
          className="font-sans text-xs"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          {formatNaira(order.fareAmountKobo + (order.tipAmountKobo ?? 0))} ·{" "}
          {order.loadType ?? "parcel"}
        </Text>
      </View>

      {/* Customer card */}
      <View className="flex-row items-center bg-white rounded-3xl p-4 border border-gray-100 gap-3">
        <Avatar
          uri={customer?.profilePhotoUrl ?? undefined}
          name={customerName}
          size="md"
        />
        <View className="flex-1">
          <Text className="font-sans-bold text-[15px] text-gray-900">
            {customerName}
          </Text>
          <Text className="font-sans text-xs text-gray-500 mt-0.5">
            Customer
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={onChat}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#F9FAFB",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "#F3F4F6",
            }}
          >
            <Message size={18} color="#374151" variant="Bold" />
          </Pressable>
          {customerPhone && (
            <Pressable
              onPress={handleCall}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "#F9FAFB",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "#F3F4F6",
              }}
            >
              <Call size={18} color="#374151" variant="Bold" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Horizontal progress timeline */}
      <View className="bg-white rounded-3xl p-4 border border-gray-100">
        <View className="px-1">
          <View className="relative">
            {/* Background line */}
            <View className="absolute left-[5%] right-[5%] h-[3px] bg-gray-100 top-[14px] rounded-full" />
            {/* Progress line */}
            <View
              style={{ width: `${progressPct * 0.9}%` }}
              className="absolute left-[5%] h-[3px] bg-[#DAA520] top-[14px] rounded-full"
            />

            <View className="flex-row justify-between">
              {(["Accepted", "Pickup", "Transit", "Delivered"] as const).map(
                (label, idx) => {
                  const done = idx < step;
                  const isCurrent = idx === step;
                  return (
                    <View key={label} className="items-center w-14 z-10">
                      {isCurrent ? (
                        <View
                          className="w-10 h-10 bg-[#DAA520] border-2 border-white rounded-full items-center justify-center mb-0.5"
                          style={{
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.05,
                            shadowRadius: 2,
                            elevation: 1,
                          }}
                        >
                          <TruckFast size={18} color="#FFF" variant="Bold" />
                        </View>
                      ) : (
                        <View
                          className={`w-3.5 h-3.5 rounded-full border-2 border-white mb-2 mt-[8px] ${done ? "bg-[#DAA520]" : "bg-gray-200"}`}
                        />
                      )}
                      <Text
                        className={`text-[7px] font-sans-bold uppercase tracking-widest ${isCurrent || done ? "text-[#DAA520]" : "text-gray-400"}`}
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
      </View>

      {/* Inline condition selection at arrived_pickup */}
      {order.status === "arrived_pickup" ? (
        <View className="gap-2">
          <Text className="font-sans-bold text-[13px] text-gray-900 text-center mb-1">
            Confirm Package Condition
          </Text>
          {CONDITION_OPTIONS.map(({ value, label, icon: Icon, color, bg }) => (
            <Pressable
              key={value}
              onPress={() => onConditionConfirm(value)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                borderRadius: 9999,
                paddingVertical: 14,
                paddingHorizontal: 20,
                backgroundColor: bg,
              }}
            >
              <Icon size={20} color={color} variant="Bold" />
              <Text
                className="font-sans-bold text-[15px] flex-1"
                style={{ color }}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : (
        actionLabel &&
        nextStatus && (
          <Pressable
            onPress={() => onStatusUpdate(nextStatus)}
            style={{
              paddingVertical: 16,
              borderRadius: 9999,
              alignItems: "center",
              backgroundColor: COLORS.primary,
            }}
          >
            <Text className="font-sans-bold text-[16px] text-white">
              {actionLabel}
            </Text>
          </Pressable>
        )
      )}
    </View>
  );
}
