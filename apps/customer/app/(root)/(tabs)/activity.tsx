import { OrderCard, type Order } from "@/components/cards/OrderCard";
import { TrackingTimelineCard } from "@/components/cards/TrackingTimelineCard";
import { router } from "expo-router";
import {
  ArrowRight,
  DocumentText,
  ReceiptDiscount,
} from "iconsax-react-native";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Simulated Promo Schema
const MOCK_PROMOS = [
  {
    id: "promo1",
    code: "RAMADAN20",
    description: "Enjoy 20% off all your food deliveries during Iftar hours.",
    discountValueKobo: 20,
    type: "percentage",
    bgColor: "#006B3F", // Primary Green
  },
  {
    id: "promo2",
    code: "GOSHATSFIRST",
    description: "₦1,000 off your first parcel drop.",
    discountValueKobo: 100000,
    type: "fixed",
    bgColor: "#f59e0b", // Vibrant Amber
  },
  {
    id: "promo3",
    code: "WEEKEND50",
    description: "Half price on all express document logistics.",
    discountValueKobo: 50,
    type: "percentage",
    bgColor: "#4F46E5", // Indigo
  },
];

export default function ActivityScreen() {
  const recentOrders: Order[] = [
    {
      id: "2",
      loadType: "parcel",
      dropoff: { address: "14 Maitama Crescent" },
      date: "Today, 2:15 PM",
      totalAmountKobo: 400000,
      status: "in_transit",
    },
    {
      id: "1",
      loadType: "food",
      dropoff: { address: "Kilimanjaro, Wuse 2 " },
      date: "Today, 10:45 AM",
      totalAmountKobo: 820000,
      status: "delivered",
    },
  ];

  const renderPromo = ({ item }: { item: (typeof MOCK_PROMOS)[0] }) => (
    <Pressable
      style={{ backgroundColor: item.bgColor }}
      className="w-[260px] min-h-[140px] rounded-[24px] p-5 mr-4 overflow-hidden relative active:opacity-90 shadow-sm border border-white/10 flex-col justify-between"
    >
      {/* Decorative abstract circle for depth */}
      <View className="absolute -left-10 -bottom-10 w-32 h-32 bg-white/5 rounded-full" />

      {/* Giant subtle icon */}
      <View className="absolute -right-4 -top-6 opacity-10">
        <ReceiptDiscount size={120} color="#FFFFFF" variant="Bulk" />
      </View>

      <View>
        <View className="bg-white/20 self-start px-2.5 py-1 rounded-[6px] mb-3 border border-white/10">
          <Text className="text-[10px] font-sans-bold text-white uppercase tracking-widest">
            {item.type === "percentage"
              ? `${item.discountValueKobo}% OFF`
              : `₦${item.discountValueKobo / 100} OFF`}
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

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]" edges={["top"]}>
      {/* Huge Header */}
      <View className="px-6 pt-4 pb-4">
        <Text className="text-[34px] font-sans-black text-gray-900 tracking-tight">
          Activity
        </Text>
      </View>

      {/* Promo Slider */}
      <View className="mb-6">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24 }}
          data={MOCK_PROMOS}
          keyExtractor={(item) => item.id}
          renderItem={renderPromo}
          snapToInterval={276} // 260 width + 16 mr
          decelerationRate="fast"
        />
      </View>

      <Text className="text-sm font-sans-bold text-gray-400 tracking-widest mb-3 ml-7">
        Current Tracker
      </Text>

      <View className="mx-5">
        <TrackingTimelineCard />
      </View>

      <View className="flex-row items-center justify-between px-7 mb-3">
        <Text className="text-sm font-sans-bold text-gray-400 tracking-widest">
          Recent Events
        </Text>
        <Pressable
          onPress={() => {
            router.push("/orders");
          }}
          className="active:opacity-90 flex-row items-center gap-1"
        >
          <Text className="text-sm font-sans-bold text-gray-400 tracking-widest">
            View All
          </Text>
          <ArrowRight size={16} color="#9CA3AF" />
        </Pressable>
      </View>

      {/* Only Recent Events is scrollable */}
      <FlatList
        data={recentOrders}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => <OrderCard item={item} />}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center mt-64">
            <View className="w-20 h-20 rounded-[24px] bg-white items-center justify-center mb-4 border border-gray-100 shadow-sm">
              <DocumentText size={32} color="#9CA3AF" variant="Bulk" />
            </View>
            <Text className="text-gray-500 font-sans-medium text-[15px] text-center mt-2">
              No recent orders found.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
