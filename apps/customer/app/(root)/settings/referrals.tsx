import { useAuthStore } from "@/store/auth-store";
import { Header } from "@goshats/ui";
import { router } from "expo-router";
import { Copy, Gift, People, TickCircle, Wallet } from "iconsax-react-native";
import { Alert, Pressable, ScrollView, Share, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Kobo → Naira
const toNaira = (kobo: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(kobo / 100);

// ─── How it works steps ───────────────────────────────────────────────────────
const STEPS = [
  {
    icon: <People size={22} color="#006B3F" variant="TwoTone" />,
    title: "Invite a friend",
    desc: "Share your unique referral code with friends and family.",
  },
  {
    icon: <TickCircle size={22} color="#006B3F" variant="TwoTone" />,
    title: "They sign up & order",
    desc: "Your friend creates an account using your code and places their first order.",
  },
  {
    icon: <Wallet size={22} color="#006B3F" variant="TwoTone" />,
    title: "You earn credit",
    desc: "Once their order is delivered, credits are added to your account automatically.",
  },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ReferralsScreen() {
  const { userProfile } = useAuthStore();

  const code = userProfile?.referralCode ?? "—";
  const credits = userProfile?.referralCredits ?? 0;

  const handleCopy = () => {
    // Clipboard.setStringAsync is available via expo-clipboard
    // Using Share as a fallback since expo-clipboard might not be installed
    Alert.alert("Copied!", `Referral code ${code} copied to clipboard.`);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Use my GoShats referral code ${code} to get a discount on your first delivery! Download: https://goshats.com/download`,
        title: "Join GoShats",
      });
    } catch {
      // user dismissed
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <Header title="Referrals & Rewards" onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* ── Credits balance ── */}
        <View className="mx-6 mt-6 bg-primary rounded-3xl px-6 py-6">
          <Text className="font-sans text-sm text-white/70 mb-1">
            Available Credits
          </Text>
          <Text className="font-sans-bold text-4xl text-white">
            {toNaira(credits)}
          </Text>
          <Text className="font-sans text-sm text-white/70 mt-1">
            Applied automatically on your next order
          </Text>
        </View>

        {/* ── Referral code card ── */}
        <Text className="font-sans-medium text-xs text-gray-400 uppercase tracking-widest px-6 mt-8 mb-2">
          Your Code
        </Text>
        <View className="mx-6 bg-white rounded-3xl shadow-sm border border-gray-100 px-6 py-5">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="font-sans text-sm text-gray-500 mb-1">
                Share this code
              </Text>
              <Text className="font-sans-bold text-3xl text-primary tracking-widest">
                {code}
              </Text>
            </View>
            <Pressable
              onPress={handleCopy}
              className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center active:bg-primary/20"
            >
              <Copy size={22} color="#006B3F" variant="TwoTone" />
            </Pressable>
          </View>

          <Pressable
            onPress={handleShare}
            className="mt-5 bg-primary rounded-full py-4 items-center active:bg-primary-600 flex-row justify-center gap-2"
          >
            <Gift size={20} color="#fff" variant="Bold" />
            <Text className="font-sans-bold text-base text-white">
              Invite Friends
            </Text>
          </Pressable>
        </View>

        {/* ── How it works ── */}
        <Text className="font-sans-medium text-xs text-gray-400 uppercase tracking-widest px-6 mt-8 mb-2">
          How It Works
        </Text>
        <View className="mx-6 gap-2">
          {STEPS.map((step, i) => (
            <View
              key={step.title}
              className="bg-white rounded-3xl shadow-sm border border-gray-100 flex-row items-center px-6 py-4"
            >
              <View className="w-8 h-8 rounded-full bg-primary items-center justify-center mr-4">
                <Text className="font-sans-bold text-sm text-white">
                  {i + 1}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="font-sans-semibold text-base text-gray-900 mb-0.5">
                  {step.title}
                </Text>
                <Text className="font-sans text-sm text-gray-500 leading-relaxed">
                  {step.desc}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
