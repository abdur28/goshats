import { TrackingTimelineCard } from "@/components/cards/TrackingTimelineCard";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import type { LoadType, Order } from "@goshats/types";
import { router } from "expo-router";
import { ArrowRight2, Car } from "iconsax-react-native";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { COLORS } from "../../constants/theme";
import { useBookingStore } from "../../store/booking-store";

interface BottomSheetContentProps {
  riderCount?: number;
  activeOrder?: Order | null;
}

const shadowStyle = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 2,
  elevation: 2,
};

export default function BottomSheetContent({
  riderCount = 0,
  activeOrder,
}: BottomSheetContentProps) {
  const handleStartBooking = (type?: LoadType) => {
    useBookingStore.getState().resetBooking();
    if (type) {
      useBookingStore.getState().setLoadDetails(type, "", false, null);
    }
    router.push("/(booking)/location" as any);
  };

  return (
    <BottomSheetScrollView
      className="flex-1 px-5 pt-2 mb-10"
      showsVerticalScrollIndicator={false}
    >
      {activeOrder ? (
        <>
          <TrackingTimelineCard
            order={activeOrder}
            onPress={() =>
              router.push({
                pathname: "/(tracking)/[id]",
                params: { id: activeOrder.id },
              } as any)
            }
          />
        </>
      ) : (
        <Pressable
          className="bg-white border border-gray-100 rounded-[24px] p-4 flex-row items-center mt-2"
          style={shadowStyle}
          onPress={() => handleStartBooking()}
        >
          <View className="bg-primary/10 w-12 h-12 rounded-full items-center justify-center">
            <Car size={24} color={COLORS.primary} variant="Bulk" />
          </View>
          <View className="flex-1 ml-4">
            <Text className="text-base font-sans-bold text-gray-900">
              Rides near you
            </Text>
            <Text className="text-xs font-sans text-gray-500 mt-0.5">
              {riderCount > 0
                ? `${riderCount} rider${riderCount === 1 ? "" : "s"} available nearby`
                : "Order a rider based on your current location"}
            </Text>
          </View>
          <View className="bg-gray-50 w-8 h-8 rounded-full items-center justify-center ml-2">
            <ArrowRight2 size={16} color="#6B7280" />
          </View>
        </Pressable>
      )}

      <Text className="text-[22px] font-sans-bold text-gray-900 mt-8 mb-4 tracking-tight">
        Deliverables
      </Text>

      {/* Food Card */}
      <Pressable
        onPress={() => handleStartBooking("food")}
        className="bg-orange-500 rounded-[28px] p-5 mb-4 overflow-hidden relative active:opacity-90"
        style={shadowStyle}
      >
        <Text className="text-lg font-sans-bold text-white z-10 relative">
          Food
        </Text>
        <Text className="text-sm font-sans text-gray-100 mt-1 mb-5 leading-5 w-[60%] z-10 relative">
          Get meals delivered to you anywhere, anytime
        </Text>
        <View className="bg-white px-5 py-3 rounded-full self-start z-10 relative">
          <Text className="text-orange-500 font-sans-bold text-[13px]">
            Order a rider
          </Text>
        </View>
        <Image
          source={require("@/assets/images/jollof-food.png")}
          className="absolute -right-6 -bottom-6 w-[140px] h-[140px]"
          resizeMode="contain"
        />
      </Pressable>

      {/* Parcels Card */}
      <Pressable
        onPress={() => handleStartBooking("parcel")}
        className="bg-indigo-500 rounded-[28px] p-5 mb-4 overflow-hidden relative active:opacity-90"
        style={shadowStyle}
      >
        <Text className="text-lg font-sans-bold text-white z-10 relative">
          Parcels
        </Text>
        <Text className="text-sm font-sans text-gray-100 mt-1 mb-5 leading-5 w-[60%] z-10 relative">
          Send and receive packages with ease
        </Text>
        <View className="bg-white px-5 py-3 rounded-full self-start z-10 relative">
          <Text className="text-indigo-500 font-sans-bold text-[13px]">
            Send a parcel
          </Text>
        </View>
        <Image
          source={require("@/assets/images/parcels.png")}
          className="absolute -right-6 -bottom-6 w-[140px] h-[140px]"
          resizeMode="contain"
        />
      </Pressable>

      {/* Document Card */}
      <Pressable
        onPress={() => handleStartBooking("document")}
        className="bg-primary rounded-[28px] p-5 mb-10 overflow-hidden relative active:opacity-90"
        style={shadowStyle}
      >
        <Text className="text-lg font-sans-bold text-white z-10 relative">
          Documents
        </Text>
        <Text className="text-sm font-sans text-gray-100 mt-1 mb-5 leading-5 w-[60%] z-10 relative">
          Send and receive documents with ease
        </Text>
        <View className="bg-white px-5 py-3 rounded-full self-start z-10 relative">
          <Text className="text-primary font-sans-bold text-[13px]">
            Send a document
          </Text>
        </View>
        <Image
          source={require("@/assets/images/documents.png")}
          className="absolute -right-6 -bottom-3 w-[140px] h-[140px]"
          resizeMode="contain"
        />
      </Pressable>
      <View className="h-20" />
    </BottomSheetScrollView>
  );
}
