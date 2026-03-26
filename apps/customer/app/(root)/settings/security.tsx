import { useAuthStore } from "@/store/auth-store";
import { sendPasswordReset, updateUserPassword } from "@goshats/firebase";
import { Header, Input } from "@goshats/ui";
import { router } from "expo-router";
import { Lock1, Sms } from "iconsax-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SecurityScreen() {
  const { userProfile } = useAuthStore();

  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.current.trim()) e.current = "Current password is required";
    if (form.next.length < 8) e.next = "At least 8 characters";
    if (form.next !== form.confirm) e.confirm = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await updateUserPassword(form.current, form.next);
      setForm({ current: "", next: "", confirm: "" });
      Alert.alert("Password Updated", "Your password has been changed successfully.");
    } catch (err: any) {
      const msg =
        err?.code === "auth/wrong-password" || err?.code === "auth/invalid-credential"
          ? "Current password is incorrect."
          : err?.code === "auth/too-many-requests"
            ? "Too many attempts. Please try again later."
            : "Failed to update password. Please try again.";
      Alert.alert("Error", msg);
    } finally {
      setSaving(false);
    }
  };

  const handleForgotPassword = () => {
    const email = userProfile?.email;
    if (!email) return Alert.alert("No email", "No email address found on your account.");
    Alert.alert("Reset Password", `We'll send a reset link to:\n${email}`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Send Link",
        onPress: async () => {
          setResetLoading(true);
          try {
            await sendPasswordReset(email);
            Alert.alert("Email Sent", "Check your inbox for the password reset link.");
          } catch {
            Alert.alert("Error", "Failed to send reset email. Please try again.");
          } finally {
            setResetLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Header title="Security" onBack={() => router.back()} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 60, paddingHorizontal: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Change Password ── */}
          <Text className="font-sans-medium text-xs text-gray-400 uppercase tracking-widest mt-8 mb-3">
            Change Password
          </Text>

          <Input
            label="Current Password"
            placeholder="Enter current password"
            secureTextEntry
            leftIcon="lock-closed-outline"
            value={form.current}
            onChangeText={(t) => setForm((p) => ({ ...p, current: t }))}
            error={errors.current}
          />
          <Input
            label="New Password"
            placeholder="At least 8 characters"
            secureTextEntry
            leftIcon="lock-open-outline"
            value={form.next}
            onChangeText={(t) => setForm((p) => ({ ...p, next: t }))}
            error={errors.next}
          />
          <Input
            label="Confirm New Password"
            placeholder="Repeat new password"
            secureTextEntry
            leftIcon="checkmark-circle-outline"
            value={form.confirm}
            onChangeText={(t) => setForm((p) => ({ ...p, confirm: t }))}
            error={errors.confirm}
          />

          <Pressable
            onPress={handleChangePassword}
            disabled={saving}
            className="bg-primary rounded-full py-4 items-center justify-center active:bg-primary-600 mt-2 mb-8"
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="font-sans-bold text-base text-white">Update Password</Text>
            )}
          </Pressable>

          {/* ── Forgot / Reset ── */}
          <Text className="font-sans-medium text-xs text-gray-400 uppercase tracking-widest mb-2">
            Forgot Password
          </Text>
          <View className="gap-2">
            <Pressable
              onPress={handleForgotPassword}
              className="bg-white rounded-3xl flex-row items-center py-[18px] px-6 active:bg-gray-50"
            >
              <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mr-4">
                {resetLoading ? (
                  <ActivityIndicator color="#006B3F" />
                ) : (
                  <Sms size={22} color="#006B3F" variant="TwoTone" />
                )}
              </View>
              <View className="flex-1">
                <Text className="font-sans-semibold text-base text-gray-900 mb-0.5">
                  Send Reset Link
                </Text>
                <Text className="font-sans text-sm text-gray-500">
                  {userProfile?.email ?? "No email on account"}
                </Text>
              </View>
            </Pressable>

            <View className="bg-white rounded-3xl flex-row items-center py-[18px] px-6">
              <View className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center mr-4">
                <Lock1 size={22} color="#9CA3AF" variant="TwoTone" />
              </View>
              <View className="flex-1">
                <Text className="font-sans-semibold text-base text-gray-900 mb-0.5">
                  Password tips
                </Text>
                <Text className="font-sans text-sm text-gray-500">
                  Use a mix of letters, numbers & symbols
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
