import ChatInput from "@/components/tracking/ChatInput";
import { COLORS } from "@/constants/theme";
import { useOrder } from "@/hooks/use-order";
import { useRider } from "@/hooks/use-rider";
import { useTracking } from "@/hooks/use-tracking";
import { Header } from "@goshats/ui";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChatScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { order } = useOrder(orderId ?? null);
  const rider = useRider(order?.riderId);
  const { messages, sendMessage } = useTracking(orderId ?? null);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#F9FAFB" }}
      edges={["top"]}
    >
      <Header
        title={rider ? `${rider.otherName} ${rider.surname}` : "Chat"}
        onBack={() => router.back()}
      />

      {/* Messages */}
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
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingTop: 60,
              }}
            >
              <Text
                style={{
                  fontFamily: "PolySans-Neutral",
                  fontSize: 14,
                  color: "#9CA3AF",
                  textAlign: "center",
                }}
              >
                No messages yet.{"\n"}Say hello to your rider!
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isMe = item.senderRole === "customer";
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

        {/* Input */}
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
          <ChatInput onSend={sendMessage} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
