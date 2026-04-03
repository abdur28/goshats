import { OrderCard } from "@/components/cards/OrderCard";
import { EarningsHeroCard } from "@/components/earnings/EarningsHeroCard";
import { COLORS } from "@/constants/theme";
import { useEarnings } from "@/hooks/use-earnings";
import { Skeleton } from "@goshats/ui";
import { DocumentText, MoneySend, WalletAdd } from "iconsax-react-native";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/auth-store";
import { useState } from "react";
import { formatNaira } from "@/lib/format";

const PERIODS = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "All Time", value: "all" },
] as const;

function OrderCardSkeleton() {
  return (
    <View
      style={{
        marginHorizontal: 20,
        marginBottom: 12,
        padding: 20,
        backgroundColor: "#fff",
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "#F3F4F6",
      }}
    >
      <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
        <Skeleton width={40} height={40} borderRadius={12} />
        <View style={{ flex: 1, gap: 8 }}>
          <Skeleton height={12} width="60%" borderRadius={6} />
          <Skeleton height={10} width="40%" borderRadius={6} />
        </View>
        <Skeleton width={60} height={24} borderRadius={12} />
      </View>
    </View>
  );
}

export default function EarningsScreen() {
  const { earnings, period, setPeriod, isLoading, refetch } = useEarnings();
  const riderProfile = useAuthStore((s) => s.riderProfile);
  const [activeTab, setActiveTab] = useState<"deliveries" | "payouts">("deliveries");
  const withdrawableKobo = riderProfile?.withdrawableBalanceKobo ?? 0;

  const data = activeTab === "deliveries" ? earnings.orders : earnings.payouts;

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]" edges={["top"]}>
      <View className="px-6 pt-4 pb-2">
        <Text className="text-[34px] font-sans-black text-gray-900 tracking-tight">
          My Earnings
        </Text>
      </View>

      {/* Period Filters */}
      <View className="mb-4">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 10 }}
          data={PERIODS}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => {
            const isActive = period === item.value;
            return (
              <Pressable
                onPress={() => setPeriod(item.value)}
                className={`px-6 py-3 my-2 rounded-[20px] shadow-sm ${
                  isActive
                    ? "bg-primary border border-primary"
                    : "bg-white border border-gray-100"
                }`}
              >
                <Text
                  className={`text-[13px] font-sans-semibold capitalize ${isActive ? "text-white" : "text-gray-600"}`}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      <FlatList
        data={data as any[]}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && earnings.orders.length === 0}
            onRefresh={refetch}
            tintColor={COLORS.primary}
          />
        }
        ListHeaderComponent={
          <>
            {isLoading && earnings.totalKobo === 0 ? (
              <View className="mb-6 mx-5">
                <Skeleton height={200} borderRadius={28} />
              </View>
            ) : (
              <>
                <EarningsHeroCard
                  withdrawableKobo={riderProfile?.withdrawableBalanceKobo ?? 0}
                  processingKobo={riderProfile?.processingPayoutsKobo ?? 0}
                  totalEarnedKobo={riderProfile?.totalEarningsKobo ?? 0}
                  totalWithdrawnKobo={riderProfile?.completedPayoutsKobo ?? 0}
                  isLoading={false}
                />
                
                {/* Manual Withdraw Button if there are stuck funds */}
                {withdrawableKobo > 0 && (
                  <Pressable
                    className="mx-5 mb-8 bg-[#F9FAFB] border border-primary/20 flex-row items-center justify-center py-4 rounded-[20px]"
                  >
                    <WalletAdd size={20} color={COLORS.primary} variant="Bulk" style={{ marginRight: 8 }} />
                    <Text className="text-primary font-sans-bold text-[15px]">
                      Withdraw {formatNaira(withdrawableKobo)}
                    </Text>
                  </Pressable>
                )}
              </>
            )}

            {/* Toggle Tabs */}
            <View className="px-6 flex-row items-center gap-4 mb-4">
              <Pressable onPress={() => setActiveTab("deliveries")} className={`pb-2 border-b-2 ${activeTab === "deliveries" ? "border-primary" : "border-transparent"}`}>
                <Text className={`text-[16px] font-sans-bold ${activeTab === "deliveries" ? "text-gray-900" : "text-gray-400"}`}>
                  Deliveries
                </Text>
              </Pressable>
              <Pressable onPress={() => setActiveTab("payouts")} className={`pb-2 border-b-2 ${activeTab === "payouts" ? "border-primary" : "border-transparent"}`}>
                <Text className={`text-[16px] font-sans-bold ${activeTab === "payouts" ? "text-gray-900" : "text-gray-400"}`}>
                  Payouts
                </Text>
              </Pressable>
            </View>
          </>
        }
        renderItem={({ item }) => {
          if (activeTab === "payouts") {
            const payout = item as any; // RiderPayout
            return (
              <View className="mx-5 mb-3 p-4 bg-white rounded-[20px] border border-gray-100 flex-row items-center justify-between">
                <View className="flex-row items-center gap-4">
                  <View className={`w-10 h-10 rounded-full items-center justify-center ${
                    payout.status === "completed" ? "bg-green-100" :
                    payout.status === "processing" ? "bg-blue-100" : "bg-red-100"
                  }`}>
                    <MoneySend size={20} color={
                      payout.status === "completed" ? "#10B981" :
                      payout.status === "processing" ? "#3B82F6" : "#EF4444"
                    } variant="Bulk" />
                  </View>
                  <View>
                    <Text className="text-gray-900 font-sans-semibold text-[15px] mb-0.5">
                      Payout
                    </Text>
                    <Text className="text-gray-500 font-sans-medium text-[12px] capitalize">
                      {payout.status}
                    </Text>
                  </View>
                </View>
                <Text className="text-gray-900 font-sans-bold text-[15px]">
                  {formatNaira(payout.amountKobo)}
                </Text>
              </View>
            );
          }

          return (
          <OrderCard
            item={{
              id: item.id,
              loadType: item.loadType ?? "other",
              dropoff: { address: item.dropoff?.address ?? "Unknown address" },
              date: "Completed",
              totalAmountKobo:
                (item.fareAmountKobo ?? 0) + (item.tipAmountKobo ?? 0),
              status: item.status ?? "delivered",
            }}
          />
        )}}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ marginTop: 8 }}>
              <OrderCardSkeleton />
              <OrderCardSkeleton />
              <OrderCardSkeleton />
            </View>
          ) : (
            <View className="flex-1 items-center justify-center mt-64">
              <View className="w-20 h-20 rounded-[24px] bg-white items-center justify-center mb-4 border border-gray-100 shadow-sm">
                <DocumentText size={32} color="#9CA3AF" variant="Bulk" />
              </View>
              <Text className="text-gray-500 font-sans-medium text-[15px] text-center mt-2">
                No trips found.
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}
