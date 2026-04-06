import type { Order } from "@goshats/types";
import { Pressable, Text, View } from "react-native";

interface RequestCardProps {
  order: Order;
  onAccept: () => void;
  onReject: () => void;
  onPress: () => void;
}

export function RequestCard({ order, onAccept, onReject, onPress }: RequestCardProps) {
  return (
    <Pressable onPress={onPress} style={{ backgroundColor: "#fff", borderRadius: 24, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#F3F4F6" }}>
      <Text style={{ fontFamily: "PolySans-Bulky", fontSize: 14, color: "#111827", marginBottom: 8 }}>
        {order.pickup?.address ?? "Pickup"} → {order.dropoff?.address ?? "Dropoff"}
      </Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Pressable onPress={onAccept} style={{ flex: 1, backgroundColor: "#006B3F", borderRadius: 9999, paddingVertical: 10, alignItems: "center" }}>
          <Text style={{ fontFamily: "PolySans-Bulky", fontSize: 13, color: "#fff" }}>Accept</Text>
        </Pressable>
        <Pressable onPress={onReject} style={{ flex: 1, backgroundColor: "#F3F4F6", borderRadius: 9999, paddingVertical: 10, alignItems: "center" }}>
          <Text style={{ fontFamily: "PolySans-Bulky", fontSize: 13, color: "#374151" }}>Decline</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}
