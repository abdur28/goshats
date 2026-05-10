import { Ionicons } from "@expo/vector-icons";
import { signInWithEmail } from "@goshats/firebase";
import { loginSchema, type LoginInput } from "@goshats/types";
import { useAuthStore } from "@/store/auth-store";
import { Button, Input } from "@goshats/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
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

function getFirebaseErrorMessage(code: string): string {
  switch (code) {
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export default function SignInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [firebaseError, setFirebaseError] = useState("");
  const storeError = useAuthStore((s) => s.error);
  const setStoreError = useAuthStore((s) => s.setError);

  useEffect(() => () => setStoreError(null), []);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    setFirebaseError("");
    try {
      await signInWithEmail(data.email, data.password);
      // Auth state listener in _layout.tsx handles redirect
    } catch (err: any) {
      setFirebaseError(getFirebaseErrorMessage(err?.code ?? ""));
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

      {/* Hero */}
      <View className="overflow-hidden" style={{ height: SCREEN_HEIGHT * 0.15 }}>
        <Image
          source={require("@/assets/images/background.png")}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
        <LinearGradient
          colors={["transparent", "rgba(255,255,255,0.4)", "#FFFFFF"]}
          locations={[0.1, 0.8, 1]}
          style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "60%" }}
        />
        <Pressable
          onPress={() => router.back()}
          style={{
            position: "absolute",
            top: insets.top + 12,
            left: 24,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "rgba(0,0,0,0.2)",
            alignItems: "center",
            justifyContent: "center",
          }}
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
        <View className="mb-8">
          <Text className="text-[28px] leading-[36px] font-sans-bold text-gray-900 mb-2">
            Welcome back
          </Text>
          <Text className="text-[15px] font-sans text-gray-400">
            Sign in to your GoShats rider account
          </Text>
        </View>

        <View className="flex-1">
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

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Password"
                placeholder="••••••••"
                secureTextEntry
                autoComplete="password"
                leftIcon="lock-closed-outline"
                onChangeText={onChange}
                onBlur={onBlur}
                value={value}
                error={errors.password?.message}
              />
            )}
          />

          <Pressable
            onPress={() => router.push("/(auth)/forgot-password" as any)}
            style={{ alignSelf: "flex-end", marginBottom: 24 }}
          >
            <Text className="text-sm font-sans-medium text-primary">
              Forgot password?
            </Text>
          </Pressable>

          {storeError === "wrong_role" ? (
            <View className="bg-amber-50 border border-amber-100 rounded-2xl px-5 py-3.5 mb-4 flex-row items-center gap-2">
              <Ionicons name="information-circle-outline" size={16} color="#D97706" />
              <Text className="text-sm font-sans text-amber-700 flex-1">
                This account is registered as a customer. Please use the GoShats customer app.
              </Text>
            </View>
          ) : null}

          {storeError === "account_suspended" ? (
            <View className="bg-red-50 border border-red-100 rounded-2xl px-5 py-3.5 mb-4 flex-row items-center gap-2">
              <Ionicons name="ban-outline" size={16} color="#EF4444" />
              <Text className="text-sm font-sans text-danger flex-1">
                Your account has been suspended. Please contact support at support@goshats.com for assistance.
              </Text>
            </View>
          ) : null}

          {firebaseError ? (
            <View className="bg-red-50 border border-red-100 rounded-full px-5 py-3.5 mb-4 flex-row items-center gap-2">
              <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
              <Text className="text-sm font-sans text-danger flex-1">
                {firebaseError}
              </Text>
            </View>
          ) : null}

          <Button
            title="Sign In"
            variant="primary"
            size="lg"
            loading={loading}
            onPress={handleSubmit(onSubmit)}
          />
        </View>

        <View className="flex-row justify-center items-center mt-8">
          <Text className="text-sm font-sans text-gray-400">
            New rider?{" "}
          </Text>
          <Pressable onPress={() => router.push("/(auth)/register" as any)}>
            <Text className="text-sm font-sans-semibold text-primary">
              Apply to join
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
