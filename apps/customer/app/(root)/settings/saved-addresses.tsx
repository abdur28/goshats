import { getAddressIcon } from "@/lib/address-icons";
import { useAuthStore } from "@/store/auth-store";
import { deleteAddress } from "@goshats/firebase";
import type { SavedAddress } from "@goshats/types";
import { Header } from "@goshats/ui";
import { router } from "expo-router";
import { Add, Edit2, Location, Trash } from "iconsax-react-native";
import { useCallback } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSavedAddresses } from "@/hooks/use-saved-addresses";

export default function SavedAddressesScreen() {
  const uid = useAuthStore((s) => s.user?.uid);
  const { addresses, isLoading } = useSavedAddresses();

  const handleDelete = useCallback(
    (item: SavedAddress) => {
      if (!uid) return;
      Alert.alert(
        "Delete address",
        `Remove "${item.label}" from your saved addresses?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await deleteAddress(uid, item.id);
              } catch {
                Alert.alert("Error", "Failed to delete address. Please try again.");
              }
            },
          },
        ],
      );
    },
    [uid],
  );

  const renderRightActions = (item: SavedAddress) => () => (
    <View className="justify-center mb-4 ml-3">
      <Pressable
        onPress={() => handleDelete(item)}
        className="w-[60px] h-[60px] items-center justify-center active:opacity-50"
      >
        <Trash size={28} color="#EF4444" variant="Bold" />
      </Pressable>
    </View>
  );

  const renderItem = ({ item }: { item: SavedAddress }) => (
    <Swipeable
      renderRightActions={renderRightActions(item)}
      overshootRight={false}
      containerStyle={{ marginBottom: 16 }}
    >
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

  const renderEmpty = () => (
    <View className="items-center justify-center px-10 py-16">
      <View className="w-16 h-16 rounded-full bg-[#006B3F]/10 items-center justify-center mb-4">
        <Location size={28} color="#006B3F" variant="Bulk" />
      </View>
      <Text className="font-sans-bold text-base text-gray-900 text-center">
        No saved addresses yet
      </Text>
      <Text className="font-sans text-sm text-gray-500 text-center mt-2 leading-snug">
        Save your home, work or other places you visit often for quick pickup
        and dropoff selection.
      </Text>
      <Pressable
        onPress={() => router.push("/settings/address" as any)}
        className="mt-6 bg-primary px-6 py-3 rounded-full active:opacity-80"
      >
        <Text className="font-sans-bold text-sm text-white">
          Add an address
        </Text>
      </Pressable>
    </View>
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

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#006B3F" />
          </View>
        ) : (
          <FlatList
            data={addresses}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListEmptyComponent={renderEmpty}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: 150,
              paddingTop: 20,
              paddingHorizontal: 20,
              flexGrow: 1,
            }}
          />
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
