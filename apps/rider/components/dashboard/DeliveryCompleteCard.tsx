import { COLORS } from "@/constants/theme";
import { formatNaira } from "@/lib/format";
import { TickCircle } from "iconsax-react-native";
import { Pressable, Text, View } from "react-native";

interface DeliveryCompleteCardProps {
  earningsKobo: number;
  onDone: () => void;
}

export function DeliveryCompleteCard({
  earningsKobo,
  onDone,
}: DeliveryCompleteCardProps) {
  return (
    <View className="gap-3">
      {/* Success banner */}
      <View
        className="rounded-3xl p-6 items-center"
        style={{ backgroundColor: COLORS.primary }}
      >
        <View className="w-14 h-14 rounded-full items-center justify-center mb-3" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
          <TickCircle size={28} color="#fff" variant="Bold" />
        </View>
        <Text className="font-sans-bold text-[10px] uppercase tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>
          Delivered
        </Text>
        <Text className="font-sans-bold text-[20px] text-white mb-1">
          Package Delivered!
        </Text>
        <Text className="font-sans text-[14px]" style={{ color: "rgba(255,255,255,0.7)" }}>
          You earned {formatNaira(earningsKobo)}
        </Text>
      </View>

      {/* Done */}
      <Pressable
        onPress={onDone}
        style={{
          paddingVertical: 16,
          borderRadius: 9999,
          alignItems: "center",
          backgroundColor: COLORS.primary,
        }}
      >
        <Text className="font-sans-bold text-[15px] text-white">
          Back to Dashboard
        </Text>
      </Pressable>
    </View>
  );
}
