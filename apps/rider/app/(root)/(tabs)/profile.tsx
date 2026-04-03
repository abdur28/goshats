import { COLORS, FONTS, FONT_SIZES, SPACING } from "@/constants/theme";
import { useAuthStore } from "@/store/auth-store";
import { signOutUser } from "@goshats/firebase";
import { Avatar, SettingItem } from "@goshats/ui";
import { router } from "expo-router";
import {
  Bank,
  Car,
  Code1,
  DocumentUpload,
  Logout,
  MessageQuestion,
  Notification,
  ShieldSecurity,
  User,
} from "iconsax-react-native";
import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TAB_BAR_HEIGHT = 100;

export default function ProfileScreen() {
  const { riderProfile, clearAuth } = useAuthStore();
  const [signingOut, setSigningOut] = useState(false);

  const fullName = riderProfile
    ? `${riderProfile.otherName || ""} ${riderProfile.surname || ""}`.trim()
    : "Rider Name";

  const handleSignOut = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          setSigningOut(true);
          try {
            await signOutUser();
            clearAuth();
            router.replace("/(auth)/welcome");
          } finally {
            setSigningOut(false);
          }
        },
      },
    ]);
  };

  const renderSectionHeader = (title: string) => (
    <Text
      style={{
        fontFamily: FONTS.medium,
        fontSize: FONT_SIZES.sm,
        color: COLORS.textMuted,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        paddingHorizontal: SPACING.lg,
        marginBottom: SPACING.sm,
        marginTop: SPACING.xl,
      }}
    >
      {title}
    </Text>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 40 }}
      >
        {/* Header - Minimal and clean */}
        <View
          style={{
            alignItems: "center",
            paddingHorizontal: SPACING.lg,
            paddingTop: 36,
            paddingBottom: SPACING.md,
          }}
        >
          {/* Subtle ring around Avatar */}
          <View
            style={{
              marginBottom: SPACING.md,
              borderRadius: 100,
              backgroundColor: `${COLORS.primary}08`,
              padding: 6,
            }}
          >
            <Avatar
              uri={riderProfile?.profilePhotoUrl}
              name={fullName}
              size="xl"
            />
          </View>

          <Text
            style={{
              fontFamily: FONTS.bold,
              fontSize: 24,
              color: COLORS.textPrimary,
              marginBottom: 4,
            }}
          >
            {fullName}
          </Text>
          <Text
            style={{
              fontFamily: FONTS.regular,
              fontSize: FONT_SIZES.md,
              color: COLORS.textSecondary,
              marginBottom: 12,
            }}
          >
            {riderProfile?.email || "rider@example.com"}
          </Text>

          {/* Rider Quick Stats */}
          <View className="flex-row items-center gap-6 mt-2">
            <View className="items-center">
              <Text className="font-sans-bold text-lg text-gray-900">
                ⭐ {riderProfile?.averageRating?.toFixed(1) || "5.0"}
              </Text>
              <Text className="font-sans text-xs text-gray-500">Rating</Text>
            </View>
            <View className="h-8 w-[1px] bg-gray-200" />
            <View className="items-center">
              <Text className="font-sans-bold text-lg text-gray-900">
                {riderProfile?.totalTrips || 0}
              </Text>
              <Text className="font-sans text-xs text-gray-500">Trips</Text>
            </View>
            <View className="h-8 w-[1px] bg-gray-200" />
            <View className="items-center">
              <Text className="font-sans-bold text-lg text-primary capitalize">
                {riderProfile?.tier || "Standard"}
              </Text>
              <Text className="font-sans text-xs text-gray-500">Tier</Text>
            </View>
          </View>
        </View>

        <View style={{ marginTop: SPACING.sm, marginBottom: 40 }}>
          {/* Account Section */}
          {renderSectionHeader("Account")}
          <View style={{ marginHorizontal: SPACING.lg }}>
            <SettingItem
              icon={User}
              title="Personal Information"
              subtitle="Name, email, and photo"
              onPress={() => router.push("/profile/edit" as any)}
            />
            <SettingItem
              icon={Bank}
              title="Payout Methods"
              subtitle="Bank details for your earnings"
              onPress={() => router.push("/profile/bank" as any)}
            />
            <SettingItem
              icon={DocumentUpload}
              title="Documents & Verification"
              subtitle="Upload ID and registration"
              onPress={() => router.push("/profile/documents" as any)}
            />
            <SettingItem
              icon={Car}
              title="Vehicle Details"
              subtitle="Update your vehicle information"
              onPress={() => router.push("/profile/vehicle" as any)}
            />
            <SettingItem
              icon={ShieldSecurity}
              title="Security"
              subtitle="Password, 2FA, verification"
              onPress={() => router.push("/profile/security" as any)}
              isLast
            />
          </View>

          {/* Preferences Section */}
          {renderSectionHeader("Preferences")}
          <View style={{ marginHorizontal: SPACING.lg }}>
            <SettingItem
              icon={Notification}
              title="Notifications"
              subtitle="Push alerts for new requests"
              onPress={() => router.push("/profile/notifications" as any)}
              isLast
            />
          </View>

          {/* Support Section */}
          {renderSectionHeader("Support & About")}
          <View style={{ marginHorizontal: SPACING.lg }}>
            <SettingItem
              icon={MessageQuestion}
              title="Help Center"
              subtitle="Get support for deliveries"
              onPress={() => router.push("/profile/help" as any)}
            />
            <SettingItem
              icon={Code1}
              title="About"
              subtitle="App version and information"
              onPress={() => router.push("/profile/about" as any)}
              isLast
            />
          </View>

          {/* Logout */}
          <View style={{ marginTop: 32, marginHorizontal: SPACING.lg }}>
            <SettingItem
              icon={Logout}
              title={signingOut ? "Logging out..." : "Log Out"}
              onPress={handleSignOut}
              showArrow={false}
              variant="danger"
              isLast
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
