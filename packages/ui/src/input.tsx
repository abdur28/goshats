import React, { useState } from "react";
import { View, Text, TextInput, Pressable, type TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerClassName = "",
  secureTextEntry,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isSecure = secureTextEntry && !showPassword;

  return (
    <View className={`mb-4 ${containerClassName}`}>
      {label && (
        <Text className="font-sans-medium text-sm text-gray-700 mb-1.5">
          {label}
        </Text>
      )}
      <View
        className={`flex-row items-center rounded-full border px-4 bg-white ${
          error
            ? "border-danger"
            : focused
              ? "border-primary"
              : "border-gray-200"
        }`}
        style={{ height: 56 }}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={error ? "#EF4444" : focused ? "#006B3F" : "#9CA3AF"}
            style={{ marginRight: 10 }}
          />
        )}
        <TextInput
          placeholderTextColor="#9CA3AF"
          style={{
            flex: 1,
            height: 56,
            padding: 0,
            fontFamily: "PolySans-Neutral",
            fontSize: 16,
            color: "#111827",
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={isSecure}
          {...props}
        />
        {secureTextEntry && (
          <Pressable onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#9CA3AF"
            />
          </Pressable>
        )}
        {rightIcon && !secureTextEntry && (
          <Pressable onPress={onRightIconPress} disabled={!onRightIconPress}>
            <Ionicons
              name={rightIcon}
              size={20}
              color={focused ? "#006B3F" : "#9CA3AF"}
            />
          </Pressable>
        )}
      </View>
      {error && (
        <Text className="font-sans text-xs text-danger mt-1">{error}</Text>
      )}
    </View>
  );
}
