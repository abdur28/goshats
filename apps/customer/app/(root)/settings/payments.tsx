import PaystackPaymentModal, {
  CardDetails,
} from "@/components/payment/PaystackPaymentModal";
import { useAuthStore } from "@/store/auth-store";
import {
  db,
  getPaymentMethods,
  removePaymentMethod,
  setPrimaryPaymentMethod,
} from "@goshats/firebase";
import type { PaymentMethod } from "@goshats/types";
import { Header, Skeleton } from "@goshats/ui";
import { router } from "expo-router";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { Add, CardPos, Trash } from "iconsax-react-native";
import { useEffect, useState } from "react";
import { Alert, FlatList, Pressable, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { SafeAreaView } from "react-native-safe-area-context";

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
  const { user } = useAuthStore();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);

  // Real-time listener for payment methods — auto-updates when webhook saves a card
  useEffect(() => {
    if (!user) return;

    // Initial load
    getPaymentMethods(user.uid)
      .then(setMethods)
      .catch(() =>
        Alert.alert(
          "Error",
          "Could not load payment methods. Please try again.",
        ),
      )
      .finally(() => setLoading(false));

    // Live listener for real-time updates (webhook-saved cards appear automatically)
    const q = query(
      collection(db, "users", user.uid, "paymentMethods"),
      orderBy("createdAt", "desc"),
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const cards = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as PaymentMethod,
      );
      setMethods(cards);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = (id: string) => {
    if (!user) return;
    Alert.alert("Remove card", "Remove this card from your account?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          await removePaymentMethod(user.uid, id);
          setMethods((prev) => prev.filter((m) => m.id !== id));
        },
      },
    ]);
  };

  const handleSetPrimary = async (id: string) => {
    if (!user) return;
    const already = methods.find((m) => m.id === id)?.isPrimary;
    if (already) return;
    await setPrimaryPaymentMethod(user.uid, id);
    setMethods((prev) => prev.map((m) => ({ ...m, isPrimary: m.id === id })));
  };

  // Card save is handled server-side via webhook.
  // The ₦50 charge triggers charge.success → webhook saves card + credits ₦50.
  const handleAddCardSuccess = async (
    _reference: string,
    _cardDetails: CardDetails,
  ) => {
    setShowAddCard(false);
    // Cards will auto-appear via the onSnapshot listener above.
    // Show feedback to user.
    Alert.alert(
      "Card Saved! 💳",
      "Your card has been saved and ₦50 has been credited to your wallet.",
    );
  };

  const renderRightActions = (id: string) => (
    <View className="justify-center mb-6 ml-3">
      <Pressable
        onPress={() => handleDelete(id)}
        className="w-[60px] h-[60px] items-center justify-center active:opacity-50"
      >
        <Trash size={28} color="#EF4444" variant="Bold" />
      </Pressable>
    </View>
  );

  const renderCard = ({ item }: { item: PaymentMethod }) => {
    const style = getCardStyle(item.type);

    return (
      <Swipeable
        renderRightActions={() => renderRightActions(item.id)}
        overshootRight={false}
        containerStyle={{ marginBottom: 24 }}
      >
        <Pressable
          onPress={() => handleSetPrimary(item.id)}
          style={{ opacity: 1 }}
        >
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
              {/* Top Row: Bank + Default Pill */}
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

              {/* Middle: Chip Icon */}
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
          </View>
        </Pressable>
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
              onPress={() => setShowAddCard(true)}
              className="w-10 h-10 items-center justify-center rounded-full bg-white shadow-sm border border-gray-100 active:bg-gray-50 pt-0.5 pl-0.5"
            >
              <Add size={22} color="#111827" variant="Linear" />
            </Pressable>
          }
        />

        {loading ? (
          <View style={{ padding: 24 }}>
            {[0, 1].map((i) => (
              <Skeleton
                key={i}
                height={200}
                borderRadius={24}
                className="mb-6"
              />
            ))}
          </View>
        ) : methods.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <CardPos size={48} color="#D1D5DB" variant="Bulk" />
            <Text
              style={{
                fontFamily: "PolySans-Bulky",
                fontSize: 16,
                color: "#111827",
                marginTop: 16,
                marginBottom: 8,
                textAlign: "center",
              }}
            >
              No saved cards
            </Text>
            <Text
              style={{
                fontFamily: "PolySans-Neutral",
                fontSize: 13,
                color: "#9CA3AF",
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              Tap the + button to add a card for faster checkouts
            </Text>
          </View>
        ) : (
          <FlatList
            data={methods}
            keyExtractor={(item) => item.id}
            renderItem={renderCard}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 24, paddingBottom: 150 }}
          />
        )}
      </SafeAreaView>

      <PaystackPaymentModal
        visible={showAddCard}
        amount={5000}
        email={user?.email ?? ""}
        onClose={() => setShowAddCard(false)}
        onSuccess={handleAddCardSuccess}
      />
    </GestureHandlerRootView>
  );
}
