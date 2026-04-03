import { Header } from "@goshats/ui";
import { useNotificationContext } from "@/context/NotificationContext";
import { router } from "expo-router";
import type { AppNotification } from "@goshats/types";
import type { Timestamp } from "firebase/firestore";
import {
  DirectboxDefault,
  DiscountShape,
  MessageProgramming,
  MessageText,
  TickCircle,
  Trash,
  WalletAdd,
} from "iconsax-react-native";
import {
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { SafeAreaView } from "react-native-safe-area-context";

type NotificationType =
  | "order_update"
  | "chat_message"
  | "promo"
  | "referral_reward"
  | "system";

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

/**
 * Format a Firestore Timestamp or Date into a relative time string.
 */
function formatRelativeTime(timestamp: Timestamp | Date | undefined): string {
  if (!timestamp) return "";

  let date: Date;
  if (timestamp && typeof (timestamp as Timestamp).toDate === "function") {
    date = (timestamp as Timestamp).toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    return "";
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 2) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

export default function NotificationsScreen() {
  const { notifications, unreadCount, markRead, markAllRead, removeNotification } =
    useNotificationContext();

  const handleNotificationPress = async (item: AppNotification) => {
    // Mark as read
    if (!item.isRead) {
      await markRead(item.id);
    }

    // Deep link based on notification data
    if (item.data?.orderId) {
      router.push({
        pathname: "/(root)/orders/[id]",
        params: { id: item.data.orderId },
      });
    } else if (item.data?.screen === "earnings") {
      router.push("/(root)/(tabs)/earnings" as any);
    }
  };

  const renderRightActions = (id: string) => {
    return (
      <View className="justify-center mb-4 ml-3">
        <Pressable
          className="w-[60px] h-[60px] items-center justify-center active:opacity-50"
          onPress={() => removeNotification(id)}
        >
          <Trash size={28} color="#EF4444" variant="Bold" />
        </Pressable>
      </View>
    );
  };

  const renderItem = ({ item }: { item: AppNotification }) => {
    const config = getNotificationConfig(item.type);

    return (
      <Swipeable
        renderRightActions={() => renderRightActions(item.id)}
        overshootRight={false}
        containerStyle={{ marginBottom: 16 }}
      >
        <Pressable
          className={`bg-white rounded-[24px] p-5 border active:opacity-80 ${item.isRead ? "border-gray-100/60" : "border-[#006B3F]/30 bg-[#006B3F]/[0.01]"}`}
          onPress={() => handleNotificationPress(item)}
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
                  {formatRelativeTime(item.createdAt)}
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
        <Header
          title="Notifications"
          onBack={() => router.back()}
          rightAction={
            unreadCount > 0 ? (
              <Pressable
                onPress={markAllRead}
                className="flex-row items-center active:opacity-50"
              >
                <TickCircle size={18} color="#006B3F" variant="Bold" />
                <Text className="text-[13px] font-sans-medium text-[#006B3F] ml-1">
                  Read all
                </Text>
              </Pressable>
            ) : undefined
          }
        />

        <FlatList
          data={notifications}
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
