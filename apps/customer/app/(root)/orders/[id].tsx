import { Header } from "@goshats/ui";
import { router, useLocalSearchParams } from "expo-router";
import {
  Box,
  Category2,
  DocumentText,
  Location,
  Reserve,
  Routing,
  Star,
} from "iconsax-react-native";
import { Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type OrderType = "food" | "parcel" | "document" | "other";

const getTypeIcon = (type: OrderType) => {
  switch (type) {
    case "food":
      return <Reserve size={32} color="#006B3F" variant="Bulk" />;
    case "parcel":
      return <Box size={32} color="#006B3F" variant="Bulk" />;
    case "document":
      return <DocumentText size={32} color="#006B3F" variant="Bulk" />;
    case "other":
      return <Category2 size={32} color="#006B3F" variant="Bulk" />;
  }
};

const formatPrice = (kobo: number) => `₦${(kobo / 100).toLocaleString()}`;

// Realistic mock mimicking the Firestore nested structure
const mockOrder = {
  id: "2",
  status: "in_transit",
  loadType: "parcel" as OrderType,
  loadDescription: "1 Macbook Pro Box, 2 Chargers, fragile packing required.",
  date: "Today, 2:15 PM",
  pickup: {
    address: "Banex Plaza, Wuse 2",
    contactName: "John Doe",
  },
  dropoff: {
    address: "14 Maitama Crescent",
    contactName: "Jane Smith",
  },
  fareAmountKobo: 350000,
  bookingFeeKobo: 50000,
  totalAmountKobo: 400000,
  rider: {
    name: "Ahmed Musa",
    vehicle: "Silver Toyota Corolla (ABJ-123-XY)",
    rating: 4.9,
    trips: 1204,
    photoUrl: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
  },
};

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams();

  if (!id) return null; // Satisfy lint utilization rule
  const order = mockOrder; // In a real app, you would fetch by `id` here.

  const isDelivered = order.status === "delivered";
  const isCancelled = order.status === "cancelled";

  let statusText = "text-[#f59e0b]";
  if (isDelivered) {
    statusText = "text-[#006B3F]";
  } else if (isCancelled) {
    statusText = "text-[#ef4444]";
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]" edges={["top"]}>
      <Header title="Order Summary" onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 24 }}
      >
        {/* Dynamic Header Section */}
        <View className="items-center mt-6 mb-10">
          <View className="w-[88px] h-[88px] rounded-[28px] bg-primary/5 items-center justify-center border border-primary/10 mb-5">
            {getTypeIcon(order.loadType)}
          </View>
          <Text className="text-[24px] font-sans-black text-gray-900 mb-3 tracking-tight">
            {order.loadType === "food" ? "Food Delivery" : "Parcel Logistics"}
          </Text>
          <View>
            <Text
              className={`text-[11px] font-sans-bold uppercase tracking-widest ${statusText}`}
            >
              {order.status.replace("_", " ")}
            </Text>
          </View>
        </View>

        {/* Route Card */}
        <Text className="text-[13px] font-sans-bold text-gray-400 uppercase tracking-widest mb-3 ml-2">
          Delivery Route
        </Text>
        <View className="bg-white rounded-[24px] p-5 mb-8 border border-gray-100/60 shadow-sm">
          <View className="flex-row gap-4 mb-4 pb-4 border-b border-gray-50">
            <View className="w-11 h-11 rounded-[14px] bg-gray-50 items-center justify-center border border-gray-100">
              <Location size={22} color="#111827" variant="Bulk" />
            </View>
            <View className="flex-1 justify-center">
              <Text className="text-[11px] font-sans-bold text-gray-400 uppercase tracking-widest mb-1">
                Pickup
              </Text>
              <Text className="text-[15px] font-sans-semibold text-gray-900">
                {order.pickup.address}
              </Text>
            </View>
          </View>

          <View className="flex-row gap-4">
            <View className="w-11 h-11 rounded-[14px] bg-primary/10 items-center justify-center border border-primary/20">
              <Routing size={22} color="#006B3F" variant="Bulk" />
            </View>
            <View className="flex-1 justify-center">
              <Text className="text-[11px] font-sans-bold text-primary uppercase tracking-widest mb-1">
                Dropoff
              </Text>
              <Text className="text-[15px] font-sans-semibold text-gray-900">
                {order.dropoff.address}
              </Text>
            </View>
          </View>
        </View>

        {/* Rider Details Card */}
        {order.rider && (
          <>
            <Text className="text-[13px] font-sans-bold text-gray-400 uppercase tracking-widest mb-3 ml-2">
              Assigned Rider
            </Text>
            <View className="bg-white rounded-[24px] p-5 mb-8 border border-gray-100/60 shadow-sm flex-row items-center">
              <Image
                source={{ uri: order.rider.photoUrl }}
                className="w-14 h-14 rounded-full bg-gray-100 mr-4"
              />
              <View className="flex-1">
                <Text className="text-[16px] font-sans-bold text-gray-900 mb-0.5">
                  {order.rider.name}
                </Text>
                <Text className="text-[13px] font-sans-medium text-gray-500 mb-1.5">
                  {order.rider.vehicle}
                </Text>

                <View className="flex-row items-center gap-3">
                  <View className="flex-row items-center">
                    <Star size={12} color="#f59e0b" variant="Bold" />
                    <Text className="text-[11px] font-sans-bold text-[#f59e0b] ml-1">
                      {order.rider.rating}
                    </Text>
                  </View>
                  <Text className="text-[12px] font-sans-medium text-gray-400">
                    {order.rider.trips.toLocaleString()} trips
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Package Details Card */}
        <Text className="text-[13px] font-sans-bold text-gray-400 uppercase tracking-widest mb-3 ml-2">
          Package Details
        </Text>
        <View className="bg-white rounded-[24px] p-5 mb-8 border border-gray-100/60 shadow-sm">
          <Text className="text-[15px] font-sans-medium text-gray-700 leading-relaxed">
            {order.loadDescription}
          </Text>
        </View>

        {/* Pricing Card */}
        <Text className="text-[13px] font-sans-bold text-gray-400 uppercase tracking-widest mb-3 ml-2">
          Payment Breakdown
        </Text>
        <View className="bg-white rounded-[24px] p-6 mb-8 border border-gray-100/60 shadow-sm">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-[15px] font-sans-medium text-gray-500">
              Base Fare
            </Text>
            <Text className="text-[15px] font-sans-semibold text-gray-900">
              {formatPrice(order.fareAmountKobo)}
            </Text>
          </View>
          <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-gray-50">
            <Text className="text-[15px] font-sans-medium text-gray-500">
              Booking Fee
            </Text>
            <Text className="text-[15px] font-sans-semibold text-gray-900">
              {formatPrice(order.bookingFeeKobo)}
            </Text>
          </View>

          <View className="flex-row justify-between items-center pt-2">
            <Text className="text-[16px] font-sans-bold text-gray-900">
              Total Charged
            </Text>
            <Text className="text-[22px] font-sans-black text-gray-900">
              {formatPrice(order.totalAmountKobo)}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
