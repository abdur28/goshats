import { OrderCard } from "@/components/cards/OrderCard";
import { TrackingTimelineCard } from "@/components/cards/TrackingTimelineCard";
import { COLORS } from "@/constants/theme";
import { useOrders } from "@/hooks/use-orders";
import { useOrderStore } from "@/store/order-store";
import { getActivePromos } from "@goshats/firebase";
import type { PromoCode } from "@goshats/types";
import { Skeleton } from "@goshats/ui";
import { router } from "expo-router";
import { Timestamp } from "firebase/firestore";
import {
  ArrowRight,
  DocumentText,
  ReceiptDiscount,
} from "iconsax-react-native";
import { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PROMO_COLORS = ["#006B3F", "#f59e0b", "#4F46E5"];

function formatOrderDate(ts: Timestamp | any): string {
  const date =
    ts instanceof Timestamp
      ? ts.toDate()
      : ts?.seconds
        ? new Date(ts.seconds * 1000)
        : null;
  if (!date) return "—";
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  const time = date.toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (isToday) return `Today, ${time}`;
  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
  });
}

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

export default function ActivityScreen() {
  const { orders, isLoading, error, refresh } = useOrders(5);
  const activeOrder = useOrderStore((s) => s.activeOrder);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [promosLoading, setPromosLoading] = useState(true);

  useEffect(() => {
    refresh();
    getActivePromos(5)
      .then(setPromos)
      .catch(() => {})
      .finally(() => setPromosLoading(false));
  }, []);

  const recentOrders = orders.slice(0, 5);

  const renderPromo = ({ item, index }: { item: PromoCode; index: number }) => {
    const bgColor = PROMO_COLORS[index % PROMO_COLORS.length];
    const discountLabel =
      item.discountType === "percentage"
        ? `${item.discountValueKobo}% OFF`
        : `₦${(item.discountValueKobo / 100).toLocaleString()} OFF`;

    return (
      <Pressable
        style={{ backgroundColor: bgColor }}
        className="w-[260px] min-h-[140px] rounded-[24px] p-5 mr-4 overflow-hidden relative active:opacity-90 shadow-sm border border-white/10 flex-col justify-between"
      >
        <View className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/5 rounded-full" />
        <View className="absolute -right-4 -top-6 opacity-10">
          <ReceiptDiscount size={120} color="#FFFFFF" variant="Bulk" />
        </View>
        <View>
          <View className="bg-white/20 self-start px-2.5 py-1 rounded-[6px] mb-3 border border-white/10">
            <Text className="text-[10px] font-sans-bold text-white uppercase tracking-widest">
              {discountLabel}
            </Text>
          </View>
          <Text
            className="text-[13px] font-sans-medium text-white/90 leading-relaxed pr-8"
            numberOfLines={2}
          >
            {item.description}
          </Text>
        </View>
        <View className="mt-3">
          <Text className="text-[9px] font-sans-medium text-white/60 uppercase tracking-widest mb-0.5">
            Use Code
          </Text>
          <Text className="text-[20px] font-sans-black text-white tracking-tight border-b border-white/30 self-start pb-0.5">
            {item.code}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]" edges={["top"]}>
      <View className="px-6 pt-4 pb-4">
        <Text className="text-[34px] font-sans-black text-gray-900 tracking-tight">
          Activity
        </Text>
      </View>

      {/* Promo Slider */}
      {promosLoading ? (
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <Skeleton height={140} borderRadius={24} />
        </View>
      ) : promos.length > 0 ? (
        <View className="mb-6">
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24 }}
            data={promos}
            keyExtractor={(item) => item.code}
            renderItem={renderPromo}
            snapToInterval={276}
            decelerationRate="fast"
          />
        </View>
      ) : null}

      {/* Active order tracker */}
      {activeOrder && (
        <>
          <Text className="text-sm font-sans-bold text-gray-400 tracking-widest mb-3 ml-7">
            Current Tracker
          </Text>
          <View className="mx-5">
            <TrackingTimelineCard
              order={activeOrder}
              onPress={() =>
                router.push({
                  pathname: "/(tracking)/[id]",
                  params: { id: activeOrder.id },
                } as any)
              }
            />
          </View>
        </>
      )}

      {/* Recent orders */}
      <View className="flex-row items-center justify-between px-7 mb-3 mt-2">
        <Text className="text-sm font-sans-bold text-gray-400 tracking-widest">
          Recent Events
        </Text>
        <Pressable
          onPress={() => router.push("/orders" as any)}
          className="active:opacity-90 flex-row items-center gap-1"
        >
          <Text className="text-sm font-sans-bold text-gray-400 tracking-widest">
            View All
          </Text>
          <ArrowRight size={16} color="#9CA3AF" />
        </Pressable>
      </View>

      {isLoading && recentOrders.length === 0 ? (
        <View>
          <OrderCardSkeleton />
          <OrderCardSkeleton />
        </View>
      ) : error && recentOrders.length === 0 ? (
        <View style={{ alignItems: "center", justifyContent: "center", padding: 32 }}>
          <Text style={{ fontFamily: "PolySans-Bulky", fontSize: 15, color: "#111827", marginBottom: 6 }}>
            Couldn&apos;t load orders
          </Text>
          <Text style={{ fontFamily: "PolySans-Neutral", fontSize: 13, color: "#9CA3AF", marginBottom: 16, textAlign: "center" }}>
            {error}
          </Text>
          <Pressable
            onPress={refresh}
            style={{ backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 9999 }}
          >
            <Text style={{ fontFamily: "PolySans-Bulky", color: "#fff", fontSize: 13 }}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={recentOrders}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <OrderCard
              item={{
                id: item.id,
                loadType: item.loadType,
                dropoff: { address: item.dropoff.address },
                date: formatOrderDate(item.createdAt),
                totalAmountKobo: item.totalAmountKobo,
                status: item.status,
              }}
            />
          )}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center mt-32">
              <View className="w-20 h-20 rounded-[24px] bg-white items-center justify-center mb-4 border border-gray-100 shadow-sm">
                <DocumentText size={32} color="#9CA3AF" variant="Bulk" />
              </View>
              <Text className="text-gray-500 font-sans-medium text-[15px] text-center mt-2">
                No recent orders.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
