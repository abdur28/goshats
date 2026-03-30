import { COLORS } from "@/constants/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

type InputType = "otp" | "pin" | "phone" | "birthday";

interface OTPInputProps {
  type: InputType;
  displayText?: string;
  onSubmit: (value: string) => void;
  loading: boolean;
  error: string | null;
}

const CONFIG: Record<
  InputType,
  {
    title: string;
    subtitle: string;
    placeholder: string;
    maxLength: number;
    keyboardType: "number-pad" | "phone-pad";
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    secureTextEntry: boolean;
  }
> = {
  otp: {
    title: "Enter OTP",
    subtitle: "Enter the one-time password sent to your phone",
    placeholder: "000000",
    maxLength: 6,
    keyboardType: "number-pad",
    icon: "key-variant",
    secureTextEntry: false,
  },
  pin: {
    title: "Enter Card PIN",
    subtitle: "Enter your 4-digit card PIN to authorize",
    placeholder: "••••",
    maxLength: 4,
    keyboardType: "number-pad",
    icon: "lock-outline",
    secureTextEntry: true,
  },
  phone: {
    title: "Enter Phone Number",
    subtitle: "Enter the phone number linked to your card",
    placeholder: "+234 800 000 0000",
    maxLength: 15,
    keyboardType: "phone-pad",
    icon: "phone-outline",
    secureTextEntry: false,
  },
  birthday: {
    title: "Enter Date of Birth",
    subtitle: "Enter your date of birth to verify your identity",
    placeholder: "YYYY-MM-DD",
    maxLength: 10,
    keyboardType: "number-pad",
    icon: "calendar-outline",
    secureTextEntry: false,
  },
};

function formatBirthday(text: string): string {
  const cleaned = text.replace(/\D/g, "");
  let formatted = cleaned.substring(0, 4);
  if (cleaned.length > 4) formatted += "-" + cleaned.substring(4, 6);
  if (cleaned.length > 6) formatted += "-" + cleaned.substring(6, 8);
  return formatted;
}

function isValueValid(type: InputType, value: string): boolean {
  switch (type) {
    case "otp": return value.length >= 4;
    case "pin": return value.length === 4;
    case "phone": return value.length >= 10;
    case "birthday": return value.length === 10;
  }
}

export default function OTPInput({
  type,
  displayText,
  onSubmit,
  loading,
  error,
}: OTPInputProps) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const config = CONFIG[type];

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(t);
  }, []);

  const handleChange = (text: string) => {
    if (type === "birthday") setValue(formatBirthday(text));
    else if (type === "phone") setValue(text.replace(/[^\d+]/g, ""));
    else setValue(text.replace(/\D/g, ""));
  };

  const valid = isValueValid(type, value);

  return (
    <View style={{ alignItems: "center", padding: 4 }}>
      {/* Icon */}
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: COLORS.primary + "20",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <MaterialCommunityIcons
          name={config.icon}
          size={28}
          color={COLORS.primary}
        />
      </View>

      <Text
        style={{
          fontSize: 18,
          fontFamily: "PolySans-Bulky",
          color: "#111827",
          marginBottom: 8,
          textAlign: "center",
        }}
      >
        {config.title}
      </Text>
      <Text
        style={{
          fontSize: 13,
          fontFamily: "PolySans-Neutral",
          color: "#6B7280",
          textAlign: "center",
          marginBottom: 28,
          paddingHorizontal: 16,
        }}
      >
        {displayText || config.subtitle}
      </Text>

      {/* Input */}
      <View
        style={{
          width: "100%",
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: focused ? COLORS.primary : "#E5E7EB",
          backgroundColor: "#F9FAFB",
          marginBottom: 16,
        }}
      >
        <TextInput
          ref={inputRef}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 16,
            fontSize: 22,
            fontFamily: "PolySans-Median",
            color: "#111827",
            textAlign: "center",
            letterSpacing: 8,
          }}
          placeholder={config.placeholder}
          placeholderTextColor="#D1D5DB"
          value={value}
          onChangeText={handleChange}
          keyboardType={config.keyboardType}
          maxLength={config.maxLength}
          secureTextEntry={config.secureTextEntry}
          editable={!loading}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>

      {/* Error */}
      {error && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#FEE2E2",
            padding: 12,
            borderRadius: 12,
            marginBottom: 16,
            gap: 8,
            width: "100%",
          }}
        >
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={18}
            color={COLORS.danger}
          />
          <Text
            style={{
              flex: 1,
              fontSize: 13,
              fontFamily: "PolySans-Neutral",
              color: COLORS.danger,
            }}
          >
            {error}
          </Text>
        </View>
      )}

      {/* Submit */}
      <Pressable
        onPress={() => valid && onSubmit(value)}
        disabled={!valid || loading}
        style={{
          width: "100%",
          backgroundColor: valid && !loading ? COLORS.primary : "#D1D5DB",
          borderRadius: 16,
          paddingVertical: 16,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text
            style={{
              fontSize: 15,
              fontFamily: "PolySans-Bulky",
              color: "#fff",
            }}
          >
            Submit
          </Text>
        )}
      </Pressable>

      {type === "otp" && (
        <Pressable style={{ marginTop: 20 }} disabled={loading}>
          <Text
            style={{
              fontSize: 13,
              fontFamily: "PolySans-Median",
              color: COLORS.primary,
            }}
          >
            Didn't receive OTP? Resend
          </Text>
        </Pressable>
      )}
    </View>
  );
}
