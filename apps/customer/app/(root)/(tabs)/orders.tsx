import { OrderCard } from "@/components/cards/OrderCard";
import { COLORS } from "@/constants/theme";
import { useOrders } from "@/hooks/use-orders";
import type { Order } from "@goshats/types";
import { Skeleton } from "@goshats/ui";
import { Timestamp } from "firebase/firestore";
import { DocumentText } from "iconsax-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SectionList,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const FILTERS = ["All", "food", "parcel", "document", "other"] as const;
type Filter = (typeof FILTERS)[number];

function formatOrderDate(ts: Timestamp | any): string {
  const date = ts instanceof Timestamp ? ts.toDate() : ts?.seconds ? new Date(ts.seconds * 1000) : null;
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

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return `Yesterday, ${time}`;

  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function getSectionTitle(ts: Timestamp | any): string {
  const date = ts instanceof Timestamp ? ts.toDate() : ts?.seconds ? new Date(ts.seconds * 1000) : null;
  if (!date) return "Older";

  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays <= 7) return "This Week";
  if (diffDays <= 30) return "This Month";
  return "Older";
}

function groupIntoSections(orders: Order[]): { title: string; data: Order[] }[] {
  const map = new Map<string, Order[]>();
  const sectionOrder = ["Today", "Yesterday", "This Week", "This Month", "Older"];

  for (const order of orders) {
    const title = getSectionTitle(order.createdAt);
    const arr = map.get(title) ?? [];
    arr.push(order);
    map.set(title, arr);
  }

  return sectionOrder
    .filter((t) => map.has(t))
    .map((title) => ({ title, data: map.get(title)! }));
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

export default function OrdersScreen() {
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const { orders, isLoading, error, loadMore, refresh, hasMore } = useOrders();

  useEffect(() => {
    refresh();
  }, []);

  const filtered =
    activeFilter === "All" ? orders : orders.filter((o) => o.loadType === activeFilter);

  const sections = groupIntoSections(filtered);

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]" edges={["top"]}>
      <View className="px-6 pt-4 pb-2">
        <Text className="text-[34px] font-sans-black text-gray-900 tracking-tight">
          My Orders
        </Text>
      </View>

      {/* Filters */}
      <View className="mb-4">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 10 }}
          data={FILTERS}
          keyExtractor={(item) => item}
          renderItem={({ item }) => {
            const isActive = activeFilter === item;
            return (
              <Pressable
                onPress={() => setActiveFilter(item)}
                className={`px-6 py-3 my-2 rounded-[20px] shadow-sm ${
                  isActive
                    ? "bg-primary border border-primary"
                    : "bg-white border border-gray-100"
                }`}
              >
                <Text
                  className={`text-[13px] font-sans-semibold capitalize ${isActive ? "text-white" : "text-gray-600"}`}
                >
                  {item}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
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
        renderSectionHeader={({ section: { title } }) => (
          <View className="px-6 pb-2 pt-1">
            <Text className="text-sm font-sans-bold text-gray-400 tracking-wider">
              {title}
            </Text>
          </View>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 130 }}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && orders.length === 0}
            onRefresh={refresh}
            tintColor={COLORS.primary}
          />
        }
        onEndReached={() => { if (hasMore && !isLoading) loadMore(); }}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          isLoading && orders.length > 0 ? (
            <ActivityIndicator
              color={COLORS.primary}
              style={{ marginVertical: 16 }}
            />
          ) : null
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={{ marginTop: 8 }}>
              <OrderCardSkeleton />
              <OrderCardSkeleton />
              <OrderCardSkeleton />
              <OrderCardSkeleton />
            </View>
          ) : error ? (
            <View style={{ alignItems: "center", justifyContent: "center", padding: 32, marginTop: 48 }}>
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
            <View className="flex-1 items-center justify-center mt-64">
              <View className="w-20 h-20 rounded-[24px] bg-white items-center justify-center mb-4 border border-gray-100 shadow-sm">
                <DocumentText size={32} color="#9CA3AF" variant="Bulk" />
              </View>
              <Text className="text-gray-500 font-sans-medium text-[15px] text-center mt-2">
                No orders found.
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}
