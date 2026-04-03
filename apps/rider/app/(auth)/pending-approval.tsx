import { COLORS } from "@/constants/theme";
import { useAuthStore } from "@/store/auth-store";
import { Ionicons } from "@expo/vector-icons";
import { signOutUser } from "@goshats/firebase";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Dimensions, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const STEPS = [
  {
    icon: "document-text-outline" as const,
    title: "Application received",
    desc: "We've got your details and vehicle info.",
    done: true,
  },
  {
    icon: "shield-checkmark-outline" as const,
    title: "Under review",
    desc: "Our team verifies your information.",
    done: false,
  },
  {
    icon: "checkmark-circle-outline" as const,
    title: "Approval & activation",
    desc: "You'll get an email when you're approved.",
    done: false,
  },
];

export default function PendingApprovalScreen() {
  const insets = useSafeAreaInsets();
  const { riderProfile, clearAuth } = useAuthStore();
  const isSuspended = riderProfile?.status === "suspended";

  const handleSignOut = async () => {
    try {
      await signOutUser();
      clearAuth();
      router.replace("/(auth)/welcome" as any);
    } catch {
      // silent
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <StatusBar style="light" />

      {/* Hero — same pattern as sign-in / register */}
      <View style={{ height: SCREEN_HEIGHT * 0.15, overflow: "hidden" }}>
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
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        className="pt-10"
        contentContainerStyle={{
          paddingHorizontal: 28,
          paddingBottom: Math.max(insets.bottom, 32),
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={{ marginBottom: 28 }}>
          <Text
            style={{
              fontFamily: "PolySans-Bulky",
              fontSize: 28,
              lineHeight: 36,
              color: "#111827",
              marginBottom: 6,
            }}
          >
            {isSuspended ? "Account Suspended" : "Application Pending"}
          </Text>
          <Text
            style={{
              fontFamily: "PolySans-Neutral",
              fontSize: 15,
              color: "#9CA3AF",
              lineHeight: 22,
            }}
          >
            {isSuspended
              ? "Your account has been suspended by GoShats."
              : "We're reviewing your application. Hang tight!"}
          </Text>
        </View>

        {isSuspended ? (
          /* Suspended card */
          <View
            style={{
              backgroundColor: "#FEF2F2",
              borderRadius: 24,
              padding: 20,
              borderWidth: 1,
              borderColor: "#FEE2E2",
              marginBottom: 16,
              flexDirection: "row",
              gap: 12,
              alignItems: "flex-start",
            }}
          >
            <Ionicons name="alert-circle-outline" size={22} color="#EF4444" />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: "PolySans-Median",
                  fontSize: 15,
                  color: "#991B1B",
                  marginBottom: 6,
                }}
              >
                Your account has been suspended
              </Text>
              <Text
                style={{
                  fontFamily: "PolySans-Neutral",
                  fontSize: 13,
                  color: "#B91C1C",
                  lineHeight: 20,
                }}
              >
                Please contact GoShats support to understand the reason and
                resolve the issue.
              </Text>
            </View>
          </View>
        ) : (
          /* Pending steps card */
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 24,
              padding: 20,
              borderWidth: 1,
              borderColor: "#F3F4F6",
              marginBottom: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <Text
              style={{
                fontFamily: "PolySans-Median",
                fontSize: 11,
                color: "#9CA3AF",
                marginBottom: 20,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              What happens next
            </Text>

            {STEPS.map((step, idx) => (
              <View
                key={idx}
                style={{
                  flexDirection: "row",
                  gap: 14,
                  marginBottom: idx < STEPS.length - 1 ? 20 : 0,
                }}
              >
                {/* Icon + connector */}
                <View style={{ alignItems: "center" }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: step.done
                        ? `${COLORS.primary}18`
                        : "#F3F4F6",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons
                      name={step.icon}
                      size={18}
                      color={step.done ? COLORS.primary : "#9CA3AF"}
                    />
                  </View>
                  {idx < STEPS.length - 1 && (
                    <View
                      style={{
                        width: 1,
                        flex: 1,
                        marginTop: 4,
                        backgroundColor: step.done
                          ? `${COLORS.primary}30`
                          : "#E5E7EB",
                        minHeight: 16,
                      }}
                    />
                  )}
                </View>

                {/* Text */}
                <View style={{ flex: 1, paddingTop: 6 }}>
                  <Text
                    style={{
                      fontFamily: "PolySans-Median",
                      fontSize: 14,
                      color: step.done ? "#111827" : "#6B7280",
                      marginBottom: 2,
                    }}
                  >
                    {step.title}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "PolySans-Neutral",
                      fontSize: 12,
                      color: "#9CA3AF",
                      lineHeight: 18,
                    }}
                  >
                    {step.desc}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Email info pill */}
        <View
          style={{
            backgroundColor: "#F9FAFB",
            borderRadius: 9999,
            paddingVertical: 14,
            paddingHorizontal: 20,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            borderWidth: 1,
            borderColor: "#F3F4F6",
            marginBottom: 12,
          }}
        >
          <Ionicons name="mail-outline" size={18} color="#9CA3AF" />
          <Text
            style={{
              flex: 1,
              fontFamily: "PolySans-Neutral",
              fontSize: 13,
              color: "#6B7280",
            }}
          >
            {isSuspended ? (
              "Email us at support@goshats.com"
            ) : (
              <>
                {"We'll notify you at "}
                <Text
                  style={{ fontFamily: "PolySans-Median", color: "#374151" }}
                >
                  {riderProfile?.email}
                </Text>
              </>
            )}
          </Text>
        </View>

        {/* Sign out */}
        <Pressable
          onPress={handleSignOut}
          style={{
            paddingVertical: 16,
            borderRadius: 9999,
            alignItems: "center",
            backgroundColor: "#FEF2F2",
            marginTop: 4,
            borderWidth: 1,
            borderColor: "#FEE2E2",
          }}
        >
          <Text
            style={{
              fontFamily: "PolySans-Median",
              fontSize: 15,
              color: "#EF4444",
            }}
          >
            Sign out
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
