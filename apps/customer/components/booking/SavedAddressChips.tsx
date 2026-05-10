import { getAddressIcon } from "@/lib/address-icons";
import type { SavedAddress } from "@goshats/types";
import { ScrollView, Text, View } from "react-native";
import { Pressable } from "react-native-gesture-handler";

interface SavedAddressChipsProps {
  addresses: SavedAddress[];
  onSelect: (address: SavedAddress) => void;
}

export default function SavedAddressChips({
  addresses,
  onSelect,
}: SavedAddressChipsProps) {
  if (addresses.length === 0) return null;

  return (
    <View className="mt-1">
      <Text className="font-sans-medium text-[10px] text-gray-400 uppercase tracking-wider mx-5 mb-2">
        Saved places
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
      >
        {addresses.map((addr) => (
          <Pressable
            key={addr.id}
            onPress={() => onSelect(addr)}
            className="flex-row items-center h-20 bg-white border border-gray-100 rounded-full pl-2.5 pr-3.5 py-2 active:opacity-80"
          >
            <View className="w-14 h-14 rounded-full bg-[#006B3F]/10 items-center justify-center ">
              {getAddressIcon(addr.label, "#006B3F", 25)}
            </View>
            <View className="flex-1 items-center">
              <Text
                className="font-sans-semibold text-[12px] pt-1 text-gray-900 max-w-[140px]"
                numberOfLines={1}
              >
                {addr.label}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
