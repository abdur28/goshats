import { useAuthStore } from "@/store/auth-store";
import { maskAccountNumber, safeDecrypt, safeEncrypt } from "@/lib/encryption";
import {
  addPayoutDetail,
  getPayoutDetails,
  removePayoutDetail,
  setPrimaryPayoutDetail,
} from "@goshats/firebase/src/firestore/payout-details";
import { Header } from "@goshats/ui";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Bank, Edit2, TickCircle, Trash, Wallet3 } from "iconsax-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { SafeAreaView } from "react-native-safe-area-context";
import type { PayoutDetail } from "@goshats/types";

// ─── Section Label ─────────────────────────────────────────────────────────────
const SectionLabel = ({ title }: { title: string }) => (
  <Text className="font-sans-medium text-xs text-gray-400 uppercase tracking-widest px-6 mt-8 mb-2">
    {title}
  </Text>
);

type BankType = { name: string; code: string; active: boolean };

export default function BankDetailsScreen() {
  const { user } = useAuthStore();

  // ─── Payout details list ──────────────────────────────────────────────────────
  const [details, setDetails] = useState<PayoutDetail[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    getPayoutDetails(user.uid)
      .then(setDetails)
      .finally(() => setLoadingDetails(false));
  }, [user?.uid]);

  // ─── Add sheet state ──────────────────────────────────────────────────────────
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [bankName, setBankName] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);

  // ─── Bank list ────────────────────────────────────────────────────────────────
  const [banks, setBanks] = useState<BankType[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankSearch, setBankSearch] = useState("");

  useEffect(() => {
    if (showAddSheet && banks.length === 0) fetchBanks();
  }, [showAddSheet]);

  const fetchBanks = async () => {
    setLoadingBanks(true);
    try {
      const res = await fetch("/api/banks");
      const json = await res.json();
      if (json.status) setBanks(json.data);
    } catch {
      Alert.alert("Error", "Failed to load bank list. Please try again.");
    } finally {
      setLoadingBanks(false);
    }
  };

  const resetForm = () => {
    setBankName("");
    setBankCode("");
    setAccountNumber("");
    setAccountName("");
    setVerified(false);
  };

  const handleVerify = async () => {
    if (accountNumber.length !== 10 || !bankCode) return;
    setVerifying(true);
    setAccountName("");
    setVerified(false);
    try {
      const res = await fetch("/api/verify-bank-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountNumber, bankCode }),
      });
      const json = await res.json();
      if (json.status && json.data?.accountName) {
        setAccountName(json.data.accountName);
        setVerified(true);
      } else {
        Alert.alert(
          "Verification Failed",
          json.error ?? "Could not verify this account. Check the details."
        );
      }
    } catch {
      Alert.alert("Error", "Network error. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleSave = async () => {
    if (!user || !verified) return;
    setSaving(true);
    try {
      const encryptedAccountNumber = safeEncrypt(accountNumber);
      const isFirst = details.length === 0; // first one is always primary
      const id = await addPayoutDetail(user.uid, {
        bankName,
        bankCode,
        accountNumber: encryptedAccountNumber,
        accountName,
        isPrimary: isFirst,
        paystackRecipientCode: null,
      });
      // Refresh list
      const updated = await getPayoutDetails(user.uid);
      setDetails(updated);
      setShowAddSheet(false);
      resetForm();
      Alert.alert("Saved", "Bank account added successfully.");
    } catch {
      Alert.alert("Error", "Failed to save bank details. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSetPrimary = async (id: string) => {
    if (!user) return;
    try {
      await setPrimaryPayoutDetail(user.uid, id);
      const updated = await getPayoutDetails(user.uid);
      setDetails(updated);
    } catch {
      Alert.alert("Error", "Failed to update primary account.");
    }
  };

  const handleRemove = (item: PayoutDetail) => {
    Alert.alert(
      "Remove Account",
      `Remove ${item.bankName} – ${maskAccountNumber(safeDecrypt(item.accountNumber))}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            if (!user) return;
            try {
              await removePayoutDetail(user.uid, item.id);
              setDetails((prev) => prev.filter((d) => d.id !== item.id));
            } catch {
              Alert.alert("Error", "Failed to remove account.");
            }
          },
        },
      ]
    );
  };

  const filteredBanks = banks.filter((b) =>
    b.name.toLowerCase().includes(bankSearch.toLowerCase())
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <Header
        title="Payout Methods"
        onBack={() => router.back()}
        rightAction={
          <Pressable
            onPress={() => setShowAddSheet(true)}
            hitSlop={10}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1, borderColor: "#F3F4F6", alignItems: "center", justifyContent: "center" }}
          >
            <Edit2 size={20} color="#111827" variant="TwoTone" />
          </Pressable>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* ── Saved Accounts ────────────────────────────────────────────────── */}
        {loadingDetails ? (
          <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 64 }}>
            <ActivityIndicator color="#006B3F" />
          </View>
        ) : details.length === 0 ? (
          <View style={{ marginHorizontal: 24, marginTop: 32, backgroundColor: "#fff", borderRadius: 24, borderWidth: 1, borderColor: "#F3F4F6", alignItems: "center", paddingVertical: 40, paddingHorizontal: 24 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#E6F2EC", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <Bank size={28} color="#006B3F" variant="TwoTone" />
            </View>
            <Text className="font-sans-bold text-lg text-gray-900 mb-1">
              No bank accounts yet
            </Text>
            <Text className="font-sans text-sm text-gray-500 text-center mb-6">
              Add a payout account to receive your delivery earnings every Friday.
            </Text>
            <Pressable
              onPress={() => setShowAddSheet(true)}
              style={{ backgroundColor: "#006B3F", borderRadius: 9999, paddingHorizontal: 32, paddingVertical: 12 }}
            >
              <Text className="font-sans-bold text-base text-white">
                Add Bank Account
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <SectionLabel title="Bank Accounts" />
            <View className="mx-6 gap-3">
              {details.map((item) => {
                const maskedNumber = maskAccountNumber(safeDecrypt(item.accountNumber));
                return (
                  <Swipeable
                    key={item.id}
                    renderRightActions={() => (
                      <View style={{ justifyContent: "center", marginLeft: 12 }}>
                        <Pressable
                          onPress={() => handleRemove(item)}
                          style={{
                            width: 60,
                            height: 60,
                            borderRadius: 20,
                            backgroundColor: "#FEE2E2",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Trash size={28} color="#EF4444" variant="Bold" />
                        </Pressable>
                      </View>
                    )}
                    overshootRight={false}
                    containerStyle={{ marginBottom: 12 }}
                  >
                    <View
                      style={{ backgroundColor: "#fff", borderRadius: 24, borderWidth: 1, borderColor: "#F3F4F6", overflow: "hidden" }}
                    >
                      {/* Primary badge */}
                      {item.isPrimary && (
                        <View style={{ backgroundColor: "#E6F2EC", paddingHorizontal: 24, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 8 }}>
                          <TickCircle size={14} color="#006B3F" variant="Bold" />
                          <Text className="font-sans-medium text-xs text-primary">
                            Primary payout account
                          </Text>
                        </View>
                      )}

                      {/* Details */}
                      <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 }}>
                        <Text className="font-sans-bold text-base text-gray-900 mb-0.5">
                          {item.bankName}
                        </Text>
                        <Text className="font-sans text-sm text-gray-500 mb-0.5">
                          {maskedNumber}
                        </Text>
                        <Text className="font-sans-medium text-sm text-gray-700">
                          {item.accountName}
                        </Text>
                      </View>

                      {/* Set primary footer — only when not primary */}
                      {!item.isPrimary && (
                        <Pressable
                          onPress={() => handleSetPrimary(item.id)}
                          style={{ borderTopWidth: 1, borderTopColor: "#F3F4F6", paddingHorizontal: 24, paddingVertical: 12 }}
                        >
                          <Text className="font-sans-medium text-sm text-primary">
                            Set as primary
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  </Swipeable>
                );
              })}
            </View>

            {/* Add another */}
            <Pressable
              onPress={() => setShowAddSheet(true)}
              style={{ marginHorizontal: 24, marginTop: 12, backgroundColor: "#fff", borderRadius: 24, borderWidth: 1, borderStyle: "dashed", borderColor: "#D1D5DB", paddingVertical: 16, alignItems: "center" }}
            >
              <Text className="font-sans-medium text-sm text-gray-500">
                + Add another account
              </Text>
            </Pressable>
          </>
        )}

        {/* ── Payout Info ───────────────────────────────────────────────────── */}
        <SectionLabel title="Payout Info" />
        <View style={{ marginHorizontal: 24, backgroundColor: "#fff", borderRadius: 24, borderWidth: 1, borderColor: "#F3F4F6", flexDirection: "row", alignItems: "center", paddingVertical: 18, paddingHorizontal: 24 }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#E6F2EC", alignItems: "center", justifyContent: "center", marginRight: 16 }}>
            <Wallet3 size={22} color="#006B3F" variant="TwoTone" />
          </View>
          <View className="flex-1">
            <Text className="font-sans-semibold text-base text-gray-900 mb-0.5">
              Weekly Payouts
            </Text>
            <Text className="font-sans text-sm text-gray-500">
              Earnings are remitted every Friday
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>

      {/* ─── Add Account Bottom Sheet ──────────────────────────────────────────── */}
      <Modal
        visible={showAddSheet}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => { setShowAddSheet(false); resetForm(); }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: "#fff" }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {/* Sheet Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 24,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: "#F3F4F6",
              paddingTop: Platform.OS === "android" ? 24 : 16,
            }}
          >
            <Pressable onPress={() => { setShowAddSheet(false); resetForm(); }}>
              <Text style={{ fontFamily: "PolySans-Neutral", fontSize: 15, color: "#6B7280" }}>
                Cancel
              </Text>
            </Pressable>
            <Text style={{ fontFamily: "PolySans-Bulky", fontSize: 17, color: "#111827" }}>
              Add Bank Account
            </Text>
            <View style={{ width: 56 }} />
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Bank selector */}
            <Text style={{ fontFamily: "PolySans-Median", fontSize: 13, color: "#374151", marginBottom: 6 }}>
              Bank
            </Text>
            <Pressable
              onPress={() => setShowBankModal(true)}
              style={{
                height: 56,
                borderRadius: 9999,
                borderWidth: 1,
                borderColor: bankName ? "#006B3F" : "#E5E7EB",
                backgroundColor: "#fff",
                paddingHorizontal: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <Text style={{ fontFamily: "PolySans-Neutral", fontSize: 16, color: bankName ? "#111827" : "#9CA3AF" }}>
                {bankName || "Select your bank"}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
            </Pressable>

            {/* Account Number */}
            <Text style={{ fontFamily: "PolySans-Median", fontSize: 13, color: "#374151", marginBottom: 6 }}>
              Account Number
            </Text>
            <TextInput
              value={accountNumber}
              onChangeText={(t) => {
                setAccountNumber(t);
                setVerified(false);
                setAccountName("");
              }}
              placeholder="10-digit account number"
              keyboardType="number-pad"
              maxLength={10}
              placeholderTextColor="#9CA3AF"
              style={{
                height: 56,
                borderRadius: 9999,
                borderWidth: 1,
                borderColor: accountNumber.length === 10 ? "#006B3F" : "#E5E7EB",
                backgroundColor: "#fff",
                paddingHorizontal: 16,
                fontFamily: "PolySans-Neutral",
                fontSize: 16,
                color: "#111827",
                marginBottom: 16,
              }}
            />

            {/* Verify button */}
            {accountNumber.length === 10 && bankCode && !verified && (
              <Pressable
                onPress={handleVerify}
                disabled={verifying}
                style={{
                  height: 52,
                  borderRadius: 9999,
                  backgroundColor: "#006B3F",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                {verifying ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ fontFamily: "PolySans-Bold", fontSize: 15, color: "#fff" }}>
                    Verify Account
                  </Text>
                )}
              </Pressable>
            )}

            {/* Verified badge */}
            {verified && accountName && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  backgroundColor: "#F0FDF4",
                  borderWidth: 1,
                  borderColor: "#BBF7D0",
                  borderRadius: 9999,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  marginBottom: 20,
                }}
              >
                <TickCircle size={20} color="#16A34A" variant="Bold" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: "PolySans-Median", fontSize: 14, color: "#15803D" }}>
                    {accountName}
                  </Text>
                  <Text style={{ fontFamily: "PolySans-Neutral", fontSize: 12, color: "#4ADE80" }}>
                    Account verified successfully
                  </Text>
                </View>
              </View>
            )}

            {/* Encryption notice */}
            <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#F9FAFB", borderRadius: 16, padding: 14, marginBottom: 24 }}>
              <Ionicons name="lock-closed-outline" size={16} color="#9CA3AF" style={{ marginTop: 1 }} />
              <Text style={{ fontFamily: "PolySans-Neutral", fontSize: 12, color: "#9CA3AF", flex: 1, lineHeight: 18 }}>
                Your account number is encrypted before being stored — we never store it in plain text.
              </Text>
            </View>
          </ScrollView>

          {/* Save footer */}
          <View style={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: Platform.OS === "ios" ? 36 : 24, borderTopWidth: 1, borderTopColor: "#F3F4F6", backgroundColor: "#fff" }}>
            <Pressable
              onPress={handleSave}
              disabled={!verified || saving}
              style={{ height: 56, borderRadius: 9999, backgroundColor: verified && !saving ? "#006B3F" : "#E5E7EB", alignItems: "center", justifyContent: "center" }}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ fontFamily: "PolySans-Bold", fontSize: 16, color: verified ? "#fff" : "#9CA3AF" }}>
                  Save Bank Account
                </Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>

        {/* Bank picker modal */}
        <Modal
          visible={showBankModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowBankModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: "#fff", paddingTop: Platform.OS === "android" ? 24 : 0 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" }}>
              <Text style={{ fontFamily: "PolySans-Bulky", fontSize: 17, color: "#111827" }}>Select Bank</Text>
              <Pressable onPress={() => setShowBankModal(false)} style={{ padding: 8 }}>
                <Ionicons name="close" size={22} color="#111827" />
              </Pressable>
            </View>
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" }}>
              <TextInput
                placeholder="Search banks..."
                value={bankSearch}
                onChangeText={setBankSearch}
                placeholderTextColor="#9CA3AF"
                style={{ backgroundColor: "#F9FAFB", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontFamily: "PolySans-Neutral", fontSize: 15, color: "#111827" }}
              />
            </View>
            {loadingBanks ? (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <ActivityIndicator color="#006B3F" />
              </View>
            ) : (
              <FlatList
                data={filteredBanks}
                keyExtractor={(item) => item.code}
                renderItem={({ item }) => (
                  <Pressable
                    style={{ paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: "#F9FAFB", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
                    onPress={() => {
                      setBankName(item.name);
                      setBankCode(item.code);
                      setVerified(false);
                      setAccountName("");
                      setShowBankModal(false);
                    }}
                  >
                    <Text style={{ fontFamily: "PolySans-Neutral", fontSize: 15, color: "#111827" }}>{item.name}</Text>
                    {bankCode === item.code && <Ionicons name="checkmark" size={20} color="#006B3F" />}
                  </Pressable>
                )}
              />
            )}
          </View>
        </Modal>
      </Modal>
    </GestureHandlerRootView>
  );
}
