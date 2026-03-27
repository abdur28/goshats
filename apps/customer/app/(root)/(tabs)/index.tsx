import BottomSheet from "@gorhom/bottom-sheet";
import { Avatar } from "@goshats/ui";
import { router } from "expo-router";
import { Add, Notification, SearchNormal1 } from "iconsax-react-native";
import { useMemo, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BottomSheetContent from "../../../components/home/BottomSheetContent";
import { COLORS } from "../../../constants/theme";
import { useAuthStore } from "../../../store/auth-store";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { userProfile } = useAuthStore();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["25%", "50%", "90%"], []);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Map Background */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: 9.0765,
          longitude: 7.3986,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        <Marker coordinate={{ latitude: 9.0765, longitude: 7.3986 }}>
          <View className="flex-row items-center bg-primary rounded-full px-3 py-1.5 shadow-sm border-2 border-white">
            <View className="w-1.5 h-1.5 rounded-full bg-white mr-1.5" />
            <Text className="text-white font-sans-bold text-[10px]">
              GO SHATS
            </Text>
          </View>
        </Marker>
      </MapView>

      {/* Top Header container */}
      <View
        className="bg-white rounded-b-[32px] shadow-sm z-10 w-full absolute top-0"
        style={{
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: 24,
          paddingHorizontal: 20,
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <Avatar
              uri={userProfile?.profilePhotoUrl as string | undefined}
              name={userProfile?.otherName || ""}
              size="md"
            />
            <View>
              <Text className="text-xs font-sans text-gray-500 tracking-widest mb-0.5">
                Good morning
              </Text>
              <Text className="text-lg font-sans-bold text-gray-900 leading-tight">
                {userProfile?.otherName || ""} {userProfile?.surname || ""}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => router.push("/notifications" as any)}
            className="bg-gray-50 p-3 rounded-full border border-gray-100 shadow-sm active:bg-gray-100"
          >
            <View className="absolute top-3 right-3.5 w-2 h-2 rounded-full bg-red-500 z-10 border border-white" />
            <Notification size={20} color={COLORS.primary} variant="Bold" />
          </Pressable>
        </View>

        {/* Floating Search Bar */}
        <Animated.View className="mt-6 flex-row items-center bg-gray-50 rounded-full px-4 py-3 border border-gray-100 shadow-sm">
          <SearchNormal1 size={18} color="#9CA3AF" />
          <Text className="flex-1 ml-3 font-sans text-gray-400 text-[13px]">
            Search for your location
          </Text>
          <Pressable className="bg-primary p-1.5 rounded-full ml-2">
            <Add size={18} color="#FFFFFF" variant="Linear" />
          </Pressable>
        </Animated.View>
      </View>

      {/* Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose={false}
        handleIndicatorStyle={{
          backgroundColor: "#D1D5DB",
          width: 40,
          height: 4,
        }}
        containerStyle={{ zIndex: 99, elevation: 99 }}
        backgroundStyle={{ borderRadius: 32, backgroundColor: "#F9FAFB" }}
      >
        <BottomSheetContent />
      </BottomSheet>
    </View>
  );
}
