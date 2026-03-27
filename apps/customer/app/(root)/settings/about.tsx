import { Header } from "@goshats/ui";
import Constants from "expo-constants";
import { router } from "expo-router";
import { DocumentText, Global, InfoCircle } from "iconsax-react-native";
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const VERSION = Constants.expoConfig?.version ?? "1.0.0";
const LINKS = [
  {
    icon: <DocumentText size={22} color="#006B3F" variant="TwoTone" />,
    title: "Terms of Service",
    subtitle: "Read our terms and conditions",
    url: "https://goshats.com/terms",
  },
  {
    icon: <InfoCircle size={22} color="#006B3F" variant="TwoTone" />,
    title: "Privacy Policy",
    subtitle: "How we handle your data",
    url: "https://goshats.com/privacy",
  },
  {
    icon: <Global size={22} color="#006B3F" variant="TwoTone" />,
    title: "Website",
    subtitle: "goshats.com",
    url: "https://goshats.com",
  },
];

export default function AboutScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <Header title="About" onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* ── App identity ── */}
        <View className="items-center pt-10 pb-6">
          <View className="w-24 h-24 rounded-3xl bg-primary items-center justify-center mb-4 shadow-sm">
            <Image
              source={require("@/assets/images/icon.png")}
              style={{ width: 100, height: 100, borderRadius: 20 }}
              resizeMode="contain"
            />
          </View>
          <Text className="font-sans-bold text-2xl text-gray-900">
            GO SHATS
          </Text>
          <Text className="font-sans text-sm text-gray-400 mt-1">
            Version {VERSION}
          </Text>
          <View className="mt-3 bg-primary/10 px-4 py-1 rounded-full">
            <Text className="font-sans-medium text-sm text-primary">
              Customer App
            </Text>
          </View>
        </View>

        {/* ── Legal & Links ── */}
        <Text className="font-sans-medium text-xs text-gray-400 uppercase tracking-widest px-6 mb-2">
          Legal & Info
        </Text>
        <View className="mx-6 gap-2">
          {LINKS.map((link) => (
            <Pressable
              key={link.title}
              onPress={() => Linking.openURL(link.url)}
              className="bg-white rounded-3xl shadow-sm border border-gray-100 flex-row items-center py-[18px] px-6 active:bg-gray-50"
            >
              <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mr-4">
                {link.icon}
              </View>
              <View className="flex-1">
                <Text className="font-sans-semibold text-base text-gray-900 mb-0.5">
                  {link.title}
                </Text>
                <Text className="font-sans text-sm text-gray-500">
                  {link.subtitle}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
        {/* ── Made with love ── */}
        <View className="flex-row items-center justify-center gap-1.5 mt-4">
          <Text className="font-sans text-sm text-gray-400">Made by</Text>
          <Text className="font-sans text-sm text-gray-400">Bytesphere</Text>
        </View>
        <Text className="font-sans text-xs text-gray-300 text-center mt-1">
          © {new Date().getFullYear()} GoShats. All rights reserved.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
