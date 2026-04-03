import ChatInput from "@/components/chat/ChatInput";
import { COLORS } from "@/constants/theme";
import { useAuthStore } from "@/store/auth-store";
import { listenToChat, sendMessage } from "@goshats/firebase/src/firestore/chat";
import type { ChatMessage } from "@goshats/types";
import { Header } from "@goshats/ui";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RiderChatScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const user = useAuthStore((s) => s.user);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!orderId) return;
    const unsubscribe = listenToChat(orderId, setMessages);
    return () => unsubscribe();
  }, [orderId]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = useCallback(
    async (text: string) => {
      if (!orderId || !user?.uid) return;
      await sendMessage(orderId, {
        senderId: user.uid,
        senderRole: "rider",
        text,
      });
    },
    [orderId, user?.uid],
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#F9FAFB" }}
      edges={["top"]}
    >
      <Header title="Chat" onBack={() => router.back()} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center justify-center pt-16">
              <Text className="font-sans text-[14px] text-gray-400 text-center">
                No messages yet.{"\n"}Say hello to the customer!
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isMe = item.senderRole === "rider";
            return (
              <View
                style={{
                  alignSelf: isMe ? "flex-end" : "flex-start",
                  maxWidth: "78%",
                  backgroundColor: isMe ? COLORS.primary : "#fff",
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 20,
                  borderBottomRightRadius: isMe ? 4 : 20,
                  borderBottomLeftRadius: isMe ? 20 : 4,
                  borderWidth: isMe ? 0 : 1,
                  borderColor: "#F3F4F6",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04,
                  shadowRadius: 3,
                  elevation: 1,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontFamily: "PolySans-Neutral",
                    color: isMe ? "#fff" : "#111827",
                    lineHeight: 20,
                  }}
                >
                  {item.text}
                </Text>
              </View>
            );
          }}
        />

        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            paddingBottom: Platform.OS === "ios" ? 24 : 60,
            backgroundColor: "#fff",
            borderTopWidth: 1,
            borderTopColor: "#F3F4F6",
          }}
        >
          <ChatInput onSend={handleSend} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
