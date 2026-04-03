import { formatNaira } from "@/lib/format";
import { Skeleton } from "@goshats/ui";
import { MoneyTick, Timer1, Wallet2, WalletCheck } from "iconsax-react-native";
import { Text, View } from "react-native";

interface EarningsLedgerCardProps {
  withdrawableKobo: number;
  processingKobo: number;
  totalEarnedKobo: number;
  totalWithdrawnKobo: number;
  isLoading?: boolean;
}

export function EarningsHeroCard({
  withdrawableKobo,
  processingKobo,
  totalEarnedKobo,
  totalWithdrawnKobo,
  isLoading,
}: EarningsLedgerCardProps) {
  if (isLoading) {
    return (
      <View className="mb-6 mx-5">
        <Skeleton height={180} borderRadius={24} />
      </View>
    );
  }

  return (
    <View className="mx-5 mb-6 rounded-[28px] overflow-hidden bg-[#111827] shadow-sm">
      <View className="p-6 flex-row items-center justify-between">
        <View>
          <Text className="text-white/70 font-sans-medium text-[13px] mb-1">
            Wallet Balance
          </Text>
          <Text
            className="text-white text-[34px] tracking-tight"
            style={{ fontFamily: "PolySans-Bulky" }}
          >
            {formatNaira(withdrawableKobo)}
          </Text>
        </View>
        <View className="w-12 h-12 rounded-full bg-white/10 items-center justify-center">
          <Wallet2 size={24} color="#FFF" variant="Bulk" />
        </View>
      </View>

      {/* Breakdown Row */}
      <View className="bg-white/5 px-5 py-4 flex-row items-center justify-between">
        <View className="flex-1 items-center">
          <Text className="text-white/60 font-sans-medium text-[10px] uppercase tracking-wider mb-1 text-center">
            Processing
          </Text>
          <Text className="text-white font-sans-bold text-[14px]">
            {formatNaira(processingKobo)}
          </Text>
        </View>

        <View className="w-[1px] h-8 bg-white/10" />

        <View className="flex-1 items-center">
          <Text className="text-white/60 font-sans-medium text-[10px] uppercase tracking-wider mb-1 text-center">
            Total Earned
          </Text>
          <Text className="text-white font-sans-bold text-[14px]">
            {formatNaira(totalEarnedKobo)}
          </Text>
        </View>

        <View className="w-[1px] h-8 bg-white/10" />

        <View className="flex-1 items-center">
          <Text className="text-white/60 font-sans-medium text-[10px] uppercase tracking-wider mb-1 text-center">
            Withdrawn
          </Text>
          <Text className="text-white font-sans-bold text-[14px]">
            {formatNaira(totalWithdrawnKobo)}
          </Text>
        </View>
      </View>
    </View>
  );
}
