import { Header } from "@goshats/ui";
import { router } from "expo-router";
import {
  DirectboxDefault,
  DiscountShape,
  MessageProgramming,
  MessageText,
  Trash,
  WalletAdd,
} from "iconsax-react-native";
import { FlatList, Pressable, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { SafeAreaView } from "react-native-safe-area-context";

type NotificationType =
  | "order_update"
  | "chat_message"
  | "promo"
  | "referral_reward"
  | "system";

interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  time: string;
  isRead: boolean;
}

const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: "1",
    type: "order_update",
    title: "Order Delivered!",
    body: "Your parcel has been successfully delivered to 14 Maitama Crescent. Tap to see receipt.",
    time: "2m ago",
    isRead: false,
  },
  {
    id: "2",
    type: "promo",
    title: "Weekend 20% Off 🚀",
    body: "Use code WEEKEND20 to get 20% off your next two logistics requests. Expires Sunday midnight.",
    time: "4h ago",
    isRead: false,
  },
  {
    id: "3",
    type: "chat_message",
    title: "New message from Ahmed",
    body: "I am downstairs right now, please come out.",
    time: "Yesterday",
    isRead: true,
  },
  {
    id: "4",
    type: "referral_reward",
    title: "₦1,000 Referral Bonus!",
    body: "David just completed their first delivery. ₦1,000 has been credited to your wallet.",
    time: "Yesterday",
    isRead: true,
  },
  {
    id: "5",
    type: "system",
    title: "Welcome to Go Shats",
    body: "Thanks for joining. You can now book riders to move anything across the city instantly.",
    time: "24 Mar",
    isRead: true,
  },
];

const getNotificationConfig = (type: NotificationType) => {
  switch (type) {
    case "order_update":
      return {
        bg: "bg-[#006B3F]/10",
        border: "border-[#006B3F]/20",
        icon: <DirectboxDefault size={22} color="#006B3F" variant="Bulk" />,
      };
    case "promo":
      return {
        bg: "bg-purple-500/10",
        border: "border-purple-500/20",
        icon: <DiscountShape size={22} color="#a855f7" variant="Bulk" />,
      };
    case "referral_reward":
      return {
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
        icon: <WalletAdd size={22} color="#3b82f6" variant="Bulk" />,
      };
    case "chat_message":
      return {
        bg: "bg-[#f59e0b]/10",
        border: "border-[#f59e0b]/20",
        icon: <MessageProgramming size={22} color="#f59e0b" variant="Bulk" />,
      };
    case "system":
    default:
      return {
        bg: "bg-gray-100",
        border: "border-gray-200",
        icon: <MessageText size={22} color="#6b7280" variant="Bulk" />,
      };
  }
};

export default function NotificationsScreen() {
  const renderRightActions = () => {
    return (
      <View className="justify-center mb-4 ml-3">
        <Pressable className="w-[60px] h-[60px] items-center justify-center active:opacity-50">
          <Trash size={28} color="#EF4444" variant="Bold" />
        </Pressable>
      </View>
    );
  };

  const renderItem = ({ item }: { item: AppNotification }) => {
    const config = getNotificationConfig(item.type);

    return (
      <Swipeable
        renderRightActions={renderRightActions}
        overshootRight={false}
        containerStyle={{ marginBottom: 16 }}
      >
        <Pressable
          className={`bg-white rounded-[24px] p-5 border active:opacity-80 ${item.isRead ? "border-gray-100/60" : "border-[#006B3F]/30 bg-[#006B3F]/[0.01]"}`}
        >
          <View className="flex-row">
            {/* Icon Box */}
            <View
              className={`w-[48px] h-[48px] rounded-[16px] items-center justify-center mr-4 border ${config.bg} ${config.border}`}
            >
              {config.icon}
            </View>

            {/* Content */}
            <View className="flex-1 pr-1">
              <View className="flex-row items-center justify-between mb-1 ">
                <Text
                  className={`text-[16px] flex-1 ${
                    item.isRead
                      ? "font-sans-medium text-gray-700"
                      : "font-sans-black text-gray-900"
                  }`}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                {!item.isRead && (
                  <View className="w-2 h-2 rounded-full bg-[#006B3F] mr-2" />
                )}
              </View>
              <Text
                className={`text-[13px] leading-relaxed mb-3 ${
                  item.isRead
                    ? "font-sans text-gray-500"
                    : "font-sans-medium text-gray-600"
                }`}
              >
                {item.body}
              </Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-[12px] font-sans-medium text-gray-400">
                  {item.time}
                </Text>
              </View>
            </View>
          </View>
        </Pressable>
      </Swipeable>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView className="flex-1 bg-[#F9FAFB]" edges={["top"]}>
        <Header title="Notifications" onBack={() => router.back()} />

        <FlatList
          data={MOCK_NOTIFICATIONS}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 100,
            paddingTop: 10,
            paddingHorizontal: 20,
          }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center mt-48">
              <View className="w-20 h-20 rounded-[24px] bg-white items-center justify-center mb-4 border border-gray-100 shadow-sm">
                <MessageText size={32} color="#9CA3AF" variant="Bulk" />
              </View>
              <Text className="text-gray-500 font-sans-medium text-[15px] text-center mt-2">
                You&apos;re all caught up.
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
