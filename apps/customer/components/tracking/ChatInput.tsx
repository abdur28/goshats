import { COLORS } from "@/constants/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
} from "react-native";

interface ChatInputProps {
  onSend: (text: string) => Promise<void>;
}

export default function ChatInput({ onSend }: ChatInputProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText("");
    try {
      await onSend(trimmed);
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#F3F4F6",
          borderRadius: 24,
          paddingHorizontal: 16,
          paddingVertical: 4,
          gap: 8,
        }}
      >
        <TextInput
          style={{
            flex: 1,
            fontFamily: "PolySans-Neutral",
            fontSize: 14,
            color: "#111827",
            paddingVertical: 10,
          }}
          placeholder="Message rider..."
          placeholderTextColor="#9CA3AF"
          value={text}
          onChangeText={setText}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          editable={!sending}
          multiline
          maxLength={500}
        />
        <Pressable
          onPress={handleSend}
          disabled={!text.trim() || sending}
          style={{
            width: 32,
            height: 32,
            borderRadius: 18,
            backgroundColor: text.trim() ? COLORS.primary : "#D1D5DB",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <MaterialCommunityIcons name="send" size={18} color="#fff" />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
