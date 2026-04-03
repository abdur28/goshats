import { COLORS, FONTS, FONT_SIZES, SPACING } from "@/constants/theme";
import { useAuthStore } from "@/store/auth-store";
import { signOutUser } from "@goshats/firebase";
import { Avatar, SettingItem } from "@goshats/ui";
import { router } from "expo-router";
import {
  Code1,
  Gift,
  Location,
  Logout,
  MessageQuestion,
  MoneyRecive,
  Notification,
  ShieldSecurity,
  User,
} from "iconsax-react-native";
import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TAB_BAR_HEIGHT = 100;

export default function ProfileScreen() {
  const { userProfile, clearAuth } = useAuthStore();
  const [signingOut, setSigningOut] = useState(false);

  const fullName = userProfile
    ? `${userProfile.otherName || ""} ${userProfile.surname || ""}`.trim()
    : "User Name";

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
              uri={userProfile?.profilePhotoUrl}
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
            }}
          >
            {userProfile?.email || "user@example.com"}
          </Text>
        </View>

        <View style={{ marginTop: SPACING.sm, marginBottom: 40 }}>
          {/* Account Section */}
          {renderSectionHeader("Account")}
          <View style={{ marginHorizontal: SPACING.lg }}>
            <SettingItem
              icon={User}
              title="Personal Information"
              subtitle="Name, email, and account deletion"
              onPress={() => router.push("/settings/personal-info" as any)}
            />
            <SettingItem
              icon={ShieldSecurity}
              title="Security"
              subtitle="Password, 2FA, verification"
              onPress={() => router.push("/settings/security" as any)}
              isLast
            />
          </View>

          {/* Preferences Section */}
          {renderSectionHeader("Preferences")}
          <View style={{ marginHorizontal: SPACING.lg }}>
            <SettingItem
              icon={Gift}
              title="Referrals & Rewards"
              subtitle="Invite friends and earn credit"
              onPress={() => router.push("/settings/referrals" as any)}
            />
            <SettingItem
              icon={Location}
              title="Saved Addresses"
              subtitle="Home, office, and other locations"
              onPress={() => router.push("/settings/saved-addresses" as any)}
            />
            <SettingItem
              icon={MoneyRecive}
              title="Manage Payments"
              subtitle="Cards and wallet balance"
              onPress={() => router.push("/settings/payments" as any)}
            />
            <SettingItem
              icon={Notification}
              title="Notifications"
              subtitle="Email and push alerts"
              onPress={() => router.push("/settings/notifications" as any)}
              isLast
            />
          </View>

          {/* Support Section */}
          {renderSectionHeader("Support & About")}
          <View style={{ marginHorizontal: SPACING.lg }}>
            <SettingItem
              icon={MessageQuestion}
              title="Help Center"
              subtitle="Get support and FAQs"
              onPress={() => router.push("/settings/help" as any)}
            />
            <SettingItem
              icon={Code1}
              title="About"
              subtitle="App version and information"
              onPress={() => router.push("/settings/about" as any)}
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
