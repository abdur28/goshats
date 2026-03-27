import { Header } from "@goshats/ui";
import { router } from "expo-router";
import { Add, Briefcase, Edit2, Home2, Location, Trash } from "iconsax-react-native";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";

interface SavedAddress {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  isDefault: boolean;
}

const MOCK_ADDRESSES: SavedAddress[] = [
  {
    id: "addr1",
    label: "Home",
    street: "14 Maitama Crescent",
    city: "Abuja",
    state: "FCT",
    isDefault: true,
  },
  {
    id: "addr2",
    label: "Work",
    street: "Zone 4, Wuse",
    city: "Abuja",
    state: "FCT",
    isDefault: false,
  },
  {
    id: "addr3",
    label: "Gym",
    street: "Bodyline Fitness, Central Area",
    city: "Abuja",
    state: "FCT",
    isDefault: false,
  },
];

const getAddressIcon = (label: string) => {
  const norm = label.toLowerCase();
  if (norm.includes("home"))
    return <Home2 size={24} color="#006B3F" variant="Bulk" />;
  if (norm.includes("work") || norm.includes("office"))
    return <Briefcase size={24} color="#006B3F" variant="Bulk" />;
  return <Location size={24} color="#006B3F" variant="Bulk" />;
};

export default function SavedAddressesScreen() {
  const renderRightActions = () => {
    return (
      <View className="justify-center mb-4 ml-3">
        <Pressable className="w-[60px] h-[60px] items-center justify-center active:opacity-50">
          <Trash size={28} color="#EF4444" variant="Bold" />
        </Pressable>
      </View>
    );
  };

  const renderItem = ({ item }: { item: SavedAddress }) => (
    <Swipeable renderRightActions={renderRightActions} overshootRight={false} containerStyle={{ marginBottom: 16 }}>
      <Pressable className="bg-white rounded-[24px] p-5 border border-gray-100 active:opacity-80 flex-row items-center">
      <View className="w-[48px] h-[48px] rounded-[16px] items-center justify-center bg-[#006B3F]/10 border border-[#006B3F]/20 mr-4">
        {getAddressIcon(item.label)}
      </View>
      <View className="flex-1 pr-2">
        <View className="flex-row items-center mb-1">
          <Text className="text-[16px] font-sans-bold text-gray-900 mr-2">
            {item.label}
          </Text>
          {item.isDefault && (
            <View className="bg-amber-100 px-2 py-0.5 rounded-[6px]">
              <Text className="text-[9px] font-sans-bold text-amber-600 uppercase tracking-widest mt-0.5">
                Default
              </Text>
            </View>
          )}
        </View>
        <Text className="text-[13px] font-sans text-gray-500 leading-snug">
          {item.street}, {item.city}
        </Text>
      </View>
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/settings/address",
            params: { id: item.id },
          } as any)
        }
        className="p-2 active:opacity-50"
      >
        <Edit2 size={20} color="#9CA3AF" variant="Linear" />
      </Pressable>
    </Pressable>
    </Swipeable>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView className="flex-1 bg-[#F9FAFB]" edges={["top"]}>
      <Header
        title="Saved Addresses"
        onBack={() => router.back()}
        rightAction={
          <Pressable
            onPress={() => router.push("/settings/address" as any)}
            className="w-10 h-10 items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 active:bg-gray-50 pt-0.5 pl-0.5"
          >
            <Add size={22} color="#111827" variant="Linear" />
          </Pressable>
        }
      />

      <FlatList
        data={MOCK_ADDRESSES}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 150, paddingTop: 20, paddingHorizontal: 20 }}
      />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
