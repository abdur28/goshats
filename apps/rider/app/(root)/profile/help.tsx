import { SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_PHONE_DISPLAY } from "@/constants/app";
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
    title: "Earnings & Payments",
    items: [
      {
        q: "How are my earnings calculated?",
        a: "Earnings are calculated based on a base fare plus distance and wait time. You keep 85% of each delivery fare.",
      },
      {
        q: "When do I get paid?",
        a: "Your earnings are sent to your attached bank account every Tuesday for the previous week (Monday-Sunday).",
      },
      {
        q: "What if a customer cancels?",
        a: "If a customer cancels after you've arrived at the pick-up location, you'll receive a cancellation fee compensation.",
      },
    ],
  },
  {
    title: "Deliveries",
    items: [
      {
        q: "How do I accept multiple orders?",
        a: "Currently, GoShats only dispatches one order at a time to ensure maximum reliability and speed for the customer.",
      },
      {
        q: "What if the customer is unreachable?",
        a: "Wait at the drop-off location for 10 minutes and attempt to call them at least 3 times. If they are still unreachable, contact support.",
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        q: "How do I update my vehicle?",
        a: "Go to Profile → Vehicle Details. Any updates will require admin verification before you can go online again.",
      },
      {
        q: "Why was my account suspended?",
        a: "Accounts may be suspended for falling below a 4.0 rating, severe customer complaints, or document expiration. Contact support to appeal.",
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
            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
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
                {SUPPORT_EMAIL}
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE}`)}
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
                {SUPPORT_PHONE_DISPLAY} · Mon – Sat, 8am – 8pm WAT
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => Linking.openURL("https://goshats.com/help/riders")}
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
                goshats.com/help/riders
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
