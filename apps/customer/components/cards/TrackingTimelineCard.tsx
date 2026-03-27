import { TruckFast } from "iconsax-react-native";
import { Text, View } from "react-native";

export const TrackingTimelineCard = () => {
  return (
    <View className="bg-white rounded-[24px] p-4  mb-6 border border-[#DAA520]/20 shadow-sm">
      <View className="flex-row justify-between items-end mb-4">
        <View>
          <Text className="text-[10px] font-sans-bold text-[#DAA520] uppercase tracking-widest mb-1 mt-1">
            Now Arriving
          </Text>
          <Text className="text-[15px] font-sans-black text-gray-900 leading-tight">
            14 Maitama Crescent
          </Text>
        </View>
        <View className="bg-[#DAA520]/10 px-2.5 py-1.5 rounded-[8px]">
          <Text className="text-[10px] font-sans-bold tracking-widest text-[#DAA520] uppercase">
            ETA 14 min
          </Text>
        </View>
      </View>

      {/* Timeline graphic container */}
      <View className="px-1 mt-2">
        <View className="relative">
          {/* Line Background */}
          <View className="absolute left-[5%] right-[5%] h-[3px] bg-gray-100 top-[14px] rounded-full" />
          <View className="absolute left-[5%] w-[60%] h-[3px] bg-[#DAA520] top-[14px] rounded-full" />

          <View className="flex-row justify-between">
            <View className="items-center w-14">
              <View className="w-3.5 h-3.5 rounded-full bg-[#DAA520] mb-2 mt-[8px] border-2 border-white" />
              <Text className="text-[8px] font-sans-bold text-gray-500 uppercase tracking-widest">
                Booked
              </Text>
            </View>

            <View className="items-center w-14">
              <View className="w-3.5 h-3.5 rounded-full bg-[#DAA520] mb-2 mt-[8px] border-2 border-white" />
              <Text className="text-[8px] font-sans-bold text-gray-500 uppercase tracking-widest">
                Pickup
              </Text>
            </View>

            <View className="items-center w-14 z-10">
              <View className="w-10 h-10 bg-[#DAA520] border-2 border-white rounded-full items-center justify-center mb-0.5 shadow-sm shadow-[#DAA520]/30">
                <TruckFast size={18} color="#FFF" variant="Bold" />
              </View>
              <Text className="text-[8px] font-sans-bold text-[#DAA520] uppercase tracking-widest">
                Transit
              </Text>
            </View>

            <View className="items-center w-14">
              <View className="w-3.5 h-3.5 rounded-full bg-gray-200 border-2 border-white mb-2 mt-[8px]" />
              <Text className="text-[8px] font-sans-bold text-gray-400 uppercase tracking-widest">
                Dropoff
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};
