import { OrderCard, type Order } from "@/components/cards/OrderCard";
import { DocumentText } from "iconsax-react-native";
import { useState } from "react";
import { FlatList, Pressable, SectionList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MOCK_ORDERS: Order[] = [
  {
    id: "1",
    loadType: "food",
    dropoff: { address: "Kilimanjaro Restaurant, Wuse 2 " },
    date: "Today, 10:45 AM",
    totalAmountKobo: 820000,
    status: "delivered",
  },
  {
    id: "2",
    loadType: "parcel",
    dropoff: { address: "14 Maitama Crescent" },
    date: "Today, 2:15 PM",
    totalAmountKobo: 400000,
    status: "in_transit",
  },
  {
    id: "3",
    loadType: "document",
    dropoff: { address: "Federal Secretariat, CBD" },
    date: "Mon, 24 Mar",
    totalAmountKobo: 150000,
    status: "delivered",
  },
  {
    id: "4",
    loadType: "other",
    dropoff: { address: "Next Cash & Carry" },
    date: "Sun, 23 Mar",
    totalAmountKobo: 1200000,
    status: "cancelled",
  },
  {
    id: "5",
    loadType: "food",
    dropoff: { address: "Chicken Republic, Gwarinpa" },
    date: "Fri, 21 Mar",
    totalAmountKobo: 550000,
    status: "delivered",
  },
  {
    id: "6",
    loadType: "parcel",
    dropoff: { address: "Nile University, Jabi" },
    date: "Wed, 5 Mar",
    totalAmountKobo: 280000,
    status: "delivered",
  },
  {
    id: "7",
    loadType: "food",
    dropoff: { address: "Domino's Pizza" },
    date: "Dec 12, 2025",
    totalAmountKobo: 1200000,
    status: "delivered",
  },
];

const FILTERS = ["All", "food", "parcel", "document", "other"];

// Simulated grouping function (how it would handle real Firebase API payload)
const groupOrdersIntoSections = (orders: Order[]) => {
  const today: Order[] = [];
  const thisWeek: Order[] = [];
  const thisMonth: Order[] = [];
  const older: Order[] = [];

  orders.forEach((order) => {
    if (order.date.includes("Today")) {
      today.push(order);
    } else if (order.date.includes("Mar") && !order.date.includes("5 Mar")) {
      thisWeek.push(order);
    } else if (order.date.includes("5 Mar")) {
      thisMonth.push(order);
    } else {
      older.push(order);
    }
  });

  const sections = [];
  if (today.length > 0) sections.push({ title: "Today", data: today });
  if (thisWeek.length > 0)
    sections.push({ title: "This Week", data: thisWeek });
  if (thisMonth.length > 0)
    sections.push({ title: "This Month", data: thisMonth });
  if (older.length > 0) sections.push({ title: "Older", data: older });

  return sections;
};

// The removed formatPrice, getStatusConfig, and getTypeIcon functions were centralized in OrderCard.tsx

export default function OrdersScreen() {
  const [activeFilter, setActiveFilter] = useState("All");

  const filteredOrders = MOCK_ORDERS.filter(
    (order) => activeFilter === "All" || order.loadType === activeFilter,
  );

  const calculatedSections = groupOrdersIntoSections(filteredOrders);

  const renderOrder = ({ item }: { item: Order }) => {
    return <OrderCard item={item} />;
  };

  const renderSectionHeader = ({
    section: { title },
  }: {
    section: { title: string };
  }) => (
    <View className="px-6 pb-2 pt-1">
      <Text className="text-sm font-sans-bold text-gray-400 tracking-wider ">
        {title}
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]" edges={["top"]}>
      {/* Huge Header */}
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

      {/* Section List Component */}
      <SectionList
        sections={calculatedSections}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        renderSectionHeader={renderSectionHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 130 }}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center mt-64">
            <View className="w-20 h-20 rounded-[24px] bg-white items-center justify-center mb-4 border border-gray-100 shadow-sm">
              <DocumentText size={32} color="#9CA3AF" variant="Bulk" />
            </View>
            <Text className="text-gray-500 font-sans-medium text-[15px] text-center mt-2">
              No orders found.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
