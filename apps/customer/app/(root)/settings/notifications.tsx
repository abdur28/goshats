import { useAuthStore } from "@/store/auth-store";
import { updateUser } from "@goshats/firebase";
import { Header } from "@goshats/ui";
import { router } from "expo-router";
import {
  Message,
  Notification,
  Sms,
  Tag,
} from "iconsax-react-native";
import { useState } from "react";
import {
  Alert,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Toggle Row ────────────────────────────────────────────────────────────────

interface ToggleRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (v: boolean) => void;
  isLast?: boolean;
}

const ToggleRow = ({
  icon,
  title,
  subtitle,
  value,
  onChange,
  isLast = false,
}: ToggleRowProps) => (
  <View
    className={`flex-row items-center py-[18px] px-6 ${
      isLast ? "" : "border-b border-gray-200"
    }`}
  >
    <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mr-4">
      {icon}
    </View>
    <View className="flex-1 mr-3">
      <Text className="font-sans-semibold text-base text-gray-900 mb-0.5">{title}</Text>
      <Text className="font-sans text-sm text-gray-500">{subtitle}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ false: "#E5E7EB", true: "#006B3F" }}
      thumbColor="#FFFFFF"
    />
  </View>
);

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const { userProfile, user, setUserProfile } = useAuthStore();

  const [prefs, setPrefs] = useState({
    notifyPush: userProfile?.notifyPush ?? true,
    notifyEmail: userProfile?.notifyEmail ?? true,
    notifySms: userProfile?.notifySms ?? false,
    notifyNewsletter: userProfile?.notifyNewsletter ?? false,
  });
  const [saving, setSaving] = useState(false);

  const handleToggle = async (
    key: keyof typeof prefs,
    value: boolean,
  ) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated); // optimistic update

    if (!user) return;
    setSaving(true);
    try {
      await updateUser(user.uid, { [key]: value });
      if (userProfile) {
        setUserProfile({ ...userProfile, [key]: value });
      }
    } catch {
      // revert on failure
      setPrefs(prefs);
      Alert.alert("Error", "Could not save preference. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <Header title="Notifications" onBack={() => router.back()} />

      <View className="mx-6 mt-8">
        {/* Delivery & Orders */}
        <Text className="font-sans-medium text-xs text-gray-400 uppercase tracking-widest mt-8 mb-2">
          Delivery & Orders
        </Text>
        <View className="gap-2 mb-8">
          <View className="bg-white rounded-3xl overflow-hidden">
            <ToggleRow
              icon={<Notification size={22} color="#006B3F" variant="TwoTone" />}
              title="Push Notifications"
              subtitle="Live delivery updates on this device"
              value={prefs.notifyPush}
              onChange={(v) => handleToggle("notifyPush", v)}
              isLast
            />
          </View>
          <View className="bg-white rounded-3xl overflow-hidden">
            <ToggleRow
              icon={<Sms size={22} color="#006B3F" variant="TwoTone" />}
              title="SMS Alerts"
              subtitle="Text messages for key order events"
              value={prefs.notifySms}
              onChange={(v) => handleToggle("notifySms", v)}
              isLast
            />
          </View>
        </View>

        {/* Account & Promotions */}
        <Text className="font-sans-medium text-xs text-gray-400 uppercase tracking-widest mb-2">
          Account & Promotions
        </Text>
        <View className="gap-2">
          <View className="bg-white rounded-3xl overflow-hidden">
            <ToggleRow
              icon={<Message size={22} color="#006B3F" variant="TwoTone" />}
              title="Email Notifications"
              subtitle="Receipts, account activity & alerts"
              value={prefs.notifyEmail}
              onChange={(v) => handleToggle("notifyEmail", v)}
              isLast
            />
          </View>
          <View className="bg-white rounded-3xl overflow-hidden">
            <ToggleRow
              icon={<Tag size={22} color="#006B3F" variant="TwoTone" />}
              title="Newsletter & Promos"
              subtitle="Deals, offers and platform news"
              value={prefs.notifyNewsletter}
              onChange={(v) => handleToggle("notifyNewsletter", v)}
              isLast
            />
          </View>
        </View>

        {saving && (
          <Text className="font-sans text-xs text-gray-400 text-center mt-4">
            Saving…
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}
