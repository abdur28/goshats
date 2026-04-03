import { updateRider } from "@goshats/firebase/src/firestore/riders";
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
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/auth-store";

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
  const { user, riderProfile } = useAuthStore();

  const [prefs, setPrefs] = useState({
    notifyPush: riderProfile?.notifyPush ?? true,
    notifyEmail: riderProfile?.notifyEmail ?? true,
    notifySms: riderProfile?.notifySms ?? false,
    notifyNewsletter: riderProfile?.notifyNewsletter ?? false,
  });

  const handleToggle = async (key: keyof typeof prefs, value: boolean) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    if (user?.uid) {
      try {
        await updateRider(user.uid, { [key]: value });
      } catch {
        // Revert on failure
        setPrefs(prefs);
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <Header title="Notifications" onBack={() => router.back()} />

      <View className="mx-6 mt-8">
        {/* Delivery Alerts */}
        <Text className="font-sans-medium text-xs text-gray-400 uppercase tracking-widest mt-8 mb-2">
          Delivery Alerts
        </Text>
        <View className="gap-2 mb-8">
          <View className="bg-white rounded-3xl shadow-sm border border-gray-100">
            <ToggleRow
              icon={<Notification size={22} color="#006B3F" variant="TwoTone" />}
              title="Push Notifications"
              subtitle="Alerts for incoming delivery requests"
              value={prefs.notifyPush}
              onChange={(v) => handleToggle("notifyPush", v)}
              isLast
            />
          </View>
          <View className="bg-white rounded-3xl shadow-sm border border-gray-100">
            <ToggleRow
              icon={<Sms size={22} color="#006B3F" variant="TwoTone" />}
              title="SMS Alerts"
              subtitle="Important messages from customers"
              value={prefs.notifySms}
              onChange={(v) => handleToggle("notifySms", v)}
              isLast
            />
          </View>
        </View>

        {/* Marketing */}
        <Text className="font-sans-medium text-xs text-gray-400 uppercase tracking-widest mb-2">
          Marketing
        </Text>
        <View className="gap-2">
          <View className="bg-white rounded-3xl shadow-sm border border-gray-100">
            <ToggleRow
              icon={<Message size={22} color="#006B3F" variant="TwoTone" />}
              title="Email Notifications"
              subtitle="Earnings summaries & account activity"
              value={prefs.notifyEmail}
              onChange={(v) => handleToggle("notifyEmail", v)}
              isLast
            />
          </View>
          <View className="bg-white rounded-3xl shadow-sm border border-gray-100">
            <ToggleRow
              icon={<Tag size={22} color="#006B3F" variant="TwoTone" />}
              title="Promotions & Tips"
              subtitle="Receive updates on rider bonuses"
              value={prefs.notifyNewsletter}
              onChange={(v) => handleToggle("notifyNewsletter", v)}
              isLast
            />
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
}
