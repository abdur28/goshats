import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { ArrowRight2, Car } from "iconsax-react-native";
import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { COLORS } from "../../constants/theme";

export default function BottomSheetContent() {
  return (
    <BottomSheetScrollView
      className="flex-1 px-5 pt-2 mb-10"
      showsVerticalScrollIndicator={false}
    >
      {/* only show if there is an active order */}
      {/* <TrackingTimelineCard /> */}

      {/* Rides near you card - hide if there is an active order*/}
      <Pressable
        className="bg-white border border-gray-100 rounded-[24px] p-4 flex-row items-center mt-2 shadow-sm"
        onPress={() => console.log("Navigate to booking")}
      >
        <View className="bg-primary/10 w-12 h-12 rounded-full items-center justify-center">
          <Car size={24} color={COLORS.primary} variant="Bulk" />
        </View>
        <View className="flex-1 ml-4">
          <Text className="text-base font-sans-bold text-gray-900">
            Rides near you
          </Text>
          <Text className="text-xs font-sans text-gray-500 mt-0.5">
            Order a rider based on your current location
          </Text>
        </View>
        <View className="bg-gray-50 w-8 h-8 rounded-full items-center justify-center ml-2">
          <ArrowRight2 size={16} color="#6B7280" />
        </View>
      </Pressable>

      <Text className="text-[22px] font-sans-bold text-gray-900 mt-8 mb-4 tracking-tight">
        Deliverables
      </Text>

      {/* Food Card */}
      <View className="bg-orange-500  rounded-[28px] p-5 mb-4 shadow-sm overflow-hidden relative">
        <Text className="text-lg font-sans-bold text-white z-10 relative">
          Food
        </Text>
        <Text className="text-sm font-sans text-gray-100  mt-1 mb-5 leading-5 w-[60%] z-10 relative">
          Get meals delivered to you anywhere, anytime
        </Text>

        <Pressable className="bg-white px-5 py-3 rounded-full self-start z-10 relative">
          <Text className="text-orange-500 font-sans-bold text-[13px]">
            Order a rider
          </Text>
        </Pressable>

        <Image
          source={require("@/assets/images/jollof-food.png")}
          className="absolute -right-6 -bottom-6 w-[140px] h-[140px]"
          resizeMode="contain"
        />
      </View>

      {/* Parcels Card */}
      <View className="bg-indigo-500 rounded-[28px] p-5 mb-10 shadow-sm overflow-hidden relative">
        <Text className="text-lg font-sans-bold text-white z-10 relative">
          Parcels
        </Text>
        <Text className="text-sm font-sans text-gray-100 mt-1 mb-5 leading-5 w-[60%] z-10 relative">
          Send and receive packages with ease
        </Text>

        <Pressable className="bg-white px-5 py-3 rounded-full self-start z-10 relative">
          <Text className="text-indigo-500 font-sans-bold text-[13px]">
            Send a parcel
          </Text>
        </Pressable>

        <Image
          source={require("@/assets/images/parcels.png")}
          className="absolute -right-6 -bottom-3 w-[140px] h-[140px]"
          resizeMode="contain"
        />
      </View>

      {/* Bottom padding spacing for the tab bar below */}
      <View className="h-20" />
    </BottomSheetScrollView>
  );
}
