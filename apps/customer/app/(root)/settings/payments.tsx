import { Header } from "@goshats/ui";
import { router } from "expo-router";
import { Add, CardPos, Trash } from "iconsax-react-native";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";

interface PaymentMethod {
  id: string;
  type: "mastercard" | "visa" | "verve";
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  cardholderName: string;
  bank: string;
  isPrimary: boolean;
}

const MOCK_METHODS: PaymentMethod[] = [
  {
    id: "card1",
    type: "mastercard",
    last4: "4242",
    expiryMonth: 12,
    expiryYear: 27,
    cardholderName: "ABDULRAZAK SULAIMAN",
    bank: "GTBank",
    isPrimary: true,
  },
  {
    id: "card2",
    type: "visa",
    last4: "1821",
    expiryMonth: 8,
    expiryYear: 26,
    cardholderName: "ABDULRAZAK SULAIMAN",
    bank: "Access Bank",
    isPrimary: false,
  },
  {
    id: "card3",
    type: "verve",
    last4: "9001",
    expiryMonth: 2,
    expiryYear: 25,
    cardholderName: "ABDULRAZAK SULAIMAN",
    bank: "FirstBank",
    isPrimary: false,
  },
];

const getCardBrandName = (type: PaymentMethod["type"]) => {
  switch (type) {
    case "mastercard":
      return "Mastercard";
    case "visa":
      return "VISA";
    case "verve":
      return "Verve";
  }
};

const getCardStyle = (type: PaymentMethod["type"]) => {
  switch (type) {
    case "mastercard":
      return {
        bgStyle: { backgroundColor: "#111827" },
        circle1Style: { backgroundColor: "rgba(255, 95, 0, 0.2)" },
        circle2Style: { backgroundColor: "rgba(235, 0, 27, 0.2)" },
        textPrimary: "text-white",
        textSecondary: "text-gray-400",
      };
    case "visa":
      return {
        bgStyle: { backgroundColor: "#1A1F71" },
        circle1Style: { backgroundColor: "rgba(247, 182, 0, 0.1)" },
        circle2Style: { backgroundColor: "rgba(255, 255, 255, 0.1)" },
        textPrimary: "text-white",
        textSecondary: "text-blue-200",
      };
    case "verve":
      return {
        bgStyle: { backgroundColor: "#E31837" },
        circle1Style: { backgroundColor: "rgba(255, 255, 255, 0.1)" },
        circle2Style: { backgroundColor: "rgba(0, 0, 0, 0.1)" },
        textPrimary: "text-white",
        textSecondary: "text-red-200",
      };
  }
};

export default function PaymentsScreen() {
  const renderRightActions = () => {
    return (
      <View className="justify-center mb-6 ml-3">
        <Pressable className="w-[60px] h-[60px] items-center justify-center active:opacity-50">
          <Trash size={28} color="#EF4444" variant="Bold" />
        </Pressable>
      </View>
    );
  };

  const renderCard = ({ item }: { item: PaymentMethod }) => {
    const style = getCardStyle(item.type);

    return (
      <Swipeable renderRightActions={renderRightActions} overshootRight={false} containerStyle={{ marginBottom: 24 }}>
      <View
        className="w-full min-h-[200px] rounded-[24px] p-6 relative overflow-hidden"
        style={style.bgStyle}
      >
        {/* Decorative Geometric Circles */}
        <View
          className="absolute -right-12 -top-12 w-48 h-48 rounded-full"
          style={style.circle1Style}
        />
        <View
          className="absolute -left-16 -bottom-16 w-56 h-56 rounded-full"
          style={style.circle2Style}
        />

        <View className="flex-1 justify-between">
          {/* Top Row: Bank + Default Piller */}
          <View className="flex-row items-start justify-between">
            <View>
              <Text
                className={`text-[12px] font-sans-bold uppercase tracking-widest mb-1 ${style.textSecondary}`}
              >
                {item.bank}
              </Text>
              <Text
                className={`text-[18px] font-sans-black tracking-tight ${style.textPrimary}`}
              >
                {getCardBrandName(item.type)}
              </Text>
            </View>

            {item.isPrimary && (
              <View className="bg-white/20 px-3 py-1.5 rounded-[8px] border border-white/10">
                <Text className="text-[10px] font-sans-bold text-white uppercase tracking-widest mt-0.5">
                  Default
                </Text>
              </View>
            )}
          </View>

          {/* Middle: Chip / Contactless Icon area */}
          <View className="my-6">
            <CardPos
              size={32}
              color="#FFFFFF"
              variant="Bulk"
              style={{ opacity: 0.6 }}
            />
          </View>

          {/* Bottom Row: Card Details */}
          <View className="flex-row items-end justify-between">
            <View>
              <Text
                className={`text-[10px] font-sans-medium uppercase tracking-widest mb-1 ${style.textSecondary}`}
              >
                Cardholder
              </Text>
              <Text
                className={`text-[15px] font-sans-bold tracking-tight uppercase ${style.textPrimary}`}
              >
                {item.cardholderName}
              </Text>
            </View>
            <View className="items-end">
              <Text
                className={`text-[10px] font-sans-medium uppercase tracking-widest mb-1 ${style.textSecondary}`}
              >
                Expires {item.expiryMonth.toString().padStart(2, "0")}/
                {item.expiryYear}
              </Text>
              <Text
                className={`text-[16px] font-sans-black tracking-widest ${style.textPrimary}`}
              >
                •••• {item.last4}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Overlay Row (Delete / Edit) sitting below the actual card visual */}
      </View>
      </Swipeable>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView className="flex-1 bg-[#F9FAFB]" edges={["top"]}>
        <Header
        title="Payment Methods"
        onBack={() => router.back()}
        rightAction={
          <Pressable
            onPress={() => router.push("/settings/add-payment" as any)}
            className="w-10 h-10 items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 active:bg-gray-50 pt-0.5 pl-0.5"
          >
            <Add size={22} color="#111827" variant="Linear" />
          </Pressable>
        }
      />

      <FlatList
        data={MOCK_METHODS}
        keyExtractor={(item) => item.id}
        renderItem={renderCard}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 24, paddingBottom: 150 }}
      />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
