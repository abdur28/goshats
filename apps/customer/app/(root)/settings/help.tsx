import { Header } from "@goshats/ui";
import { router } from "expo-router";
import { ArrowDown2, ArrowUp2, Call, MessageQuestion, Sms } from "iconsax-react-native";
import { useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── FAQ Data ─────────────────────────────────────────────────────────────────

const FAQ_SECTIONS = [
  {
    title: "Orders & Delivery",
    items: [
      {
        q: "How do I track my order?",
        a: "Once your order is confirmed, head to the Activity tab. You'll see a live map with your rider's location and estimated arrival time.",
      },
      {
        q: "What do I do if my order is late?",
        a: "Check the Activity tab for the latest status. If the rider is significantly delayed, tap the rider's card to call them directly, or contact our support team.",
      },
      {
        q: "Can I cancel my order?",
        a: "You can cancel within 2 minutes of placing an order from the Orders tab. After that, please contact support as the rider may already be en route.",
      },
      {
        q: "What if my item arrives damaged?",
        a: "Take a photo immediately and contact support via chat or email. We'll review and process a refund or replacement within 24 hours.",
      },
    ],
  },
  {
    title: "Payments & Refunds",
    items: [
      {
        q: "What payment methods are accepted?",
        a: "We accept all major debit and credit cards, as well as bank transfers. You can manage your saved cards from Profile → Manage Payments.",
      },
      {
        q: "How long do refunds take?",
        a: "Refunds are processed within 3–5 business days back to your original payment method. You'll receive an email confirmation once initiated.",
      },
      {
        q: "Is my payment information secure?",
        a: "Yes. We use industry-standard encryption and never store raw card details. Payments are processed through Paystack, a PCI-DSS compliant gateway.",
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        q: "How do I change my password?",
        a: "Go to Profile → Security. You can enter your current password and set a new one, or use the 'Send Reset Link' option if you've forgotten it.",
      },
      {
        q: "How do I delete my account?",
        a: "Go to Profile → Personal Information and scroll to the Account section. Tap 'Delete Account'. This action is permanent and cannot be undone.",
      },
    ],
  },
];

// ─── FAQ Item ─────────────────────────────────────────────────────────────────

const FaqItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);

  return (
    <Pressable
      onPress={() => setOpen((v) => !v)}
      className="bg-white rounded-3xl shadow-sm border border-gray-100 px-6 py-4 active:bg-gray-50"
    >
      <View className="flex-row items-center justify-between gap-3">
        <Text className="font-sans-semibold text-[15px] text-gray-900 flex-1 leading-snug">
          {q}
        </Text>
        {open ? (
          <ArrowUp2 size={18} color="#006B3F" />
        ) : (
          <ArrowDown2 size={18} color="#9CA3AF" />
        )}
      </View>
      {open && (
        <Text className="font-sans text-sm text-gray-500 mt-2 leading-relaxed">
          {a}
        </Text>
      )}
    </Pressable>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HelpScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <Header title="Help Center" onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* ── FAQ Sections ── */}
        {FAQ_SECTIONS.map((section) => (
          <View key={section.title}>
            <Text className="font-sans-medium text-xs text-gray-400 uppercase tracking-widest px-6 mt-8 mb-2">
              {section.title}
            </Text>
            <View className="mx-6 gap-2">
              {section.items.map((item) => (
                <FaqItem key={item.q} q={item.q} a={item.a} />
              ))}
            </View>
          </View>
        ))}

        {/* ── Contact Support ── */}
        <Text className="font-sans-medium text-xs text-gray-400 uppercase tracking-widest px-6 mt-8 mb-2">
          Contact Support
        </Text>
        <View className="mx-6 gap-2">
          <Pressable
            onPress={() => Linking.openURL("mailto:support@goshats.com")}
            className="bg-white rounded-3xl shadow-sm border border-gray-100 flex-row items-center py-[18px] px-6 active:bg-gray-50"
          >
            <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mr-4">
              <Sms size={22} color="#006B3F" variant="TwoTone" />
            </View>
            <View className="flex-1">
              <Text className="font-sans-semibold text-base text-gray-900 mb-0.5">
                Email Support
              </Text>
              <Text className="font-sans text-sm text-gray-500">
                support@goshats.com
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => Linking.openURL("tel:+2340000000000")}
            className="bg-white rounded-3xl shadow-sm border border-gray-100 flex-row items-center py-[18px] px-6 active:bg-gray-50"
          >
            <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mr-4">
              <Call size={22} color="#006B3F" variant="TwoTone" />
            </View>
            <View className="flex-1">
              <Text className="font-sans-semibold text-base text-gray-900 mb-0.5">
                Call Us
              </Text>
              <Text className="font-sans text-sm text-gray-500">
                Mon – Sat, 8am – 8pm WAT
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => Linking.openURL("https://goshats.com/help")}
            className="bg-white rounded-3xl shadow-sm border border-gray-100 flex-row items-center py-[18px] px-6 active:bg-gray-50"
          >
            <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mr-4">
              <MessageQuestion size={22} color="#006B3F" variant="TwoTone" />
            </View>
            <View className="flex-1">
              <Text className="font-sans-semibold text-base text-gray-900 mb-0.5">
                Full FAQ
              </Text>
              <Text className="font-sans text-sm text-gray-500">
                goshats.com/help
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
