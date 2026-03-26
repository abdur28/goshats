import { Ionicons } from "@expo/vector-icons";
import { sendPasswordReset } from "@goshats/firebase";
import { resetPasswordSchema, type ResetPasswordInput } from "@goshats/types";
import { Button, Input } from "@goshats/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [firebaseError, setFirebaseError] = useState("");

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setLoading(true);
    setFirebaseError("");
    try {
      await sendPasswordReset(data.email);
      setSent(true);
    } catch (err: any) {
      const code = err?.code ?? "";
      if (code === "auth/user-not-found") {
        setSent(true);
      } else {
        setFirebaseError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="light" />

      {/* Hero with back button */}
      <View
        className="overflow-hidden"
        style={{ height: SCREEN_HEIGHT * 0.15 }}
      >
        <Image
          source={require("@/assets/images/background.png")}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
        <LinearGradient
          colors={["transparent", "rgba(255,255,255,0.4)", "#FFFFFF"]}
          locations={[0.1, 0.8, 1]}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "60%",
          }}
        />
        <Pressable
          onPress={() => router.back()}
          className="absolute w-10 h-10 rounded-full bg-black/20 items-center justify-center active:opacity-70"
          style={{ top: insets.top + 12, left: 24 }}
        >
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1 pt-10"
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 32),
          paddingHorizontal: 28,
          flexGrow: 1,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {sent ? (
          /* Success state */
          <View className="flex-1 items-center justify-center pb-16">
            <View className="w-20 h-20 rounded-full bg-primary-50 items-center justify-center mb-6">
              <Ionicons name="mail-open-outline" size={36} color="#006B3F" />
            </View>
            <Text className="text-[24px] leading-[32px] font-sans-bold text-gray-900 text-center mb-3">
              Check your email
            </Text>
            <Text className="text-[15px] font-sans text-gray-400 text-center leading-6 px-4">
              We sent a password reset link to{"\n"}
              <Text className="font-sans-medium text-gray-700">
                {getValues("email")}
              </Text>
            </Text>
            <Pressable
              onPress={() => router.push("/(auth)/sign-in" as any)}
              className="mt-10"
            >
              <Text className="text-sm font-sans-semibold text-primary">
                Back to sign in
              </Text>
            </Pressable>
          </View>
        ) : (
          /* Form state */
          <View className="flex-1">
            <View className="mb-8">
              <Text className="text-[28px] leading-[36px] font-sans-bold text-gray-900 mb-2">
                Reset password
              </Text>
              <Text className="text-[15px] font-sans text-gray-400 leading-6">
                Enter your email and we&apos;ll send you a link to reset your
                password.
              </Text>
            </View>

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email address"
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  leftIcon="mail-outline"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.email?.message}
                />
              )}
            />

            {firebaseError ? (
              <View className="bg-red-50 border border-red-100 rounded-full px-5 py-3.5 mb-4 flex-row items-center gap-2">
                <Ionicons
                  name="alert-circle-outline"
                  size={16}
                  color="#EF4444"
                />
                <Text className="text-sm font-sans text-danger flex-1">
                  {firebaseError}
                </Text>
              </View>
            ) : null}

            <Button
              title="Send Reset Link"
              variant="primary"
              size="lg"
              loading={loading}
              onPress={handleSubmit(onSubmit)}
            />

            <View className="flex-row justify-center mt-6">
              <Pressable onPress={() => router.back()}>
                <Text className="text-sm font-sans-medium text-gray-500">
                  Back to sign in
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
