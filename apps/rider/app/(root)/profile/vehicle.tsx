import { useAuthStore } from "@/store/auth-store";
import { updateRider } from "@goshats/firebase/src/firestore/riders";
import { getRiderDocuments } from "@goshats/firebase/src/firestore/rider-documents";
import { Header } from "@goshats/ui";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { 
  Edit2, 
} from "iconsax-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { RiderDocument, VehicleType } from "@goshats/types";

// ─── Section Label ─────────────────────────────────────────────────────────────
const SectionLabel = ({ title }: { title: string }) => (
  <Text className="font-sans-medium text-xs text-gray-400 uppercase tracking-widest px-6 mt-8 mb-2">
    {title}
  </Text>
);

// ─── Field Row ─────────────────────────────────────────────────────────────────
interface RowProps {
  label: string;
  value: string;
  onChange?: (t: string) => void;
  editing: boolean;
  locked?: boolean;
  keyboardType?: "default" | "email-address" | "phone-pad" | "number-pad";
  autoCapitalize?: "none" | "words" | "sentences" | "characters";
  isLast?: boolean;
  errorMsg?: string;
  maxLength?: number;
}

const FieldRow = ({
  label,
  value,
  onChange,
  editing,
  locked = false,
  keyboardType = "default",
  autoCapitalize = "sentences",
  isLast = false,
  errorMsg,
  maxLength,
}: RowProps) => (
  <View className={`px-6 py-4 ${isLast ? "" : "border-b border-gray-200"}`}>
    <View className="flex-row items-center justify-between gap-1.5 mb-1">
      <Text className="font-sans-medium text-[10px] text-gray-400 uppercase tracking-wider">
        {label}
      </Text>
    </View>

    {editing && onChange && !locked ? (
      <View style={{ height: 28, justifyContent: "center" }}>
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          placeholderTextColor="#D1D5DB"
          maxLength={maxLength}
          style={
            {
              padding: 0,
              margin: 0,
              fontFamily: "PolySans-Median",
              fontSize: 15,
              color: "#111827",
              includeFontPadding: false,
            } as any
          }
        />
      </View>
    ) : (
      <Text
        className={`font-sans-semibold text-base ${value ? "text-gray-900" : "text-gray-400"}`}
      >
        {value || "—"}
      </Text>
    )}

    {errorMsg && (
      <Text className="font-sans text-sm text-danger mt-1">{errorMsg}</Text>
    )}
  </View>
);

// ─── Vehicle Type Selector ─────────────────────────────────────────────────────
const VEHICLE_TYPES: { id: VehicleType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: "motorcycle", label: "Motorcycle", icon: "bicycle" }, 
  { id: "bicycle", label: "Bicycle", icon: "bicycle-outline" },
  { id: "car", label: "Car", icon: "car-outline" },
  { id: "van", label: "Van", icon: "bus-outline" },
];

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function VehicleSettingsScreen() {
  const { riderProfile, user, setRiderProfile } = useAuthStore();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Verification documents
  const [docs, setDocs] = useState<RiderDocument[]>([]);
  
  const [form, setForm] = useState({
    vehicleType: riderProfile?.vehicleType || "motorcycle",
    vehiclePlate: riderProfile?.vehiclePlate || "",
    vehicleModel: riderProfile?.vehicleModel || "",
    vehicleColor: riderProfile?.vehicleColor || "",
    vehicleYear: riderProfile?.vehicleYear?.toString() || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);
    getRiderDocuments(user.uid)
      .then(setDocs)
      .finally(() => setLoading(false));
  }, [user?.uid]);

  // ─── Verification Logic ──────────────────────────────────────────────────────
  const getVerificationStatus = () => {
    const essential = ["vehicle_reg", "insurance", "roadworthiness"];
    const uploaded = docs.filter(d => essential.includes(d.type));
    
    if (uploaded.length === 0) return { status: "missing", label: "Documents Missing", color: "#EF4444", bg: "#FEE2E2", icon: "warning" as any };
    
    if (uploaded.some(d => d.status === "rejected")) return { status: "rejected", label: "Verification Failed", color: "#EF4444", bg: "#FEE2E2", icon: "close-circle" as any };
    
    if (uploaded.some(d => d.status === "pending")) return { status: "pending", label: "Under Review", color: "#D97706", bg: "#FEF3C7", icon: "time" as any };
    
    if (uploaded.length >= essential.length) return { status: "approved", label: "Fully Verified", color: "#10B981", bg: "#DCFCE7", icon: "shield-checkmark" as any };
    
    return { status: "partial", label: "Incomplete", color: "#6B7280", bg: "#F3F4F6", icon: "document-text" as any };
  };

  const vStatus = getVerificationStatus();

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const validate = useCallback(() => {
    const e: Record<string, string> = {};
    if (!form.vehiclePlate.trim()) e.vehiclePlate = "Plate number is required";
    if (!form.vehicleModel.trim()) e.vehicleModel = "Model is required";
    if (!form.vehicleColor.trim()) e.vehicleColor = "Color is required";
    
    const year = parseInt(form.vehicleYear, 10);
    const currentYear = new Date().getFullYear();
    if (!form.vehicleYear.trim() || isNaN(year) || year < 1980 || year > currentYear + 1) {
      e.vehicleYear = "Valid fabrication year required";
    }
    
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form]);

  const handleSave = async () => {
    if (!validate() || !user) return;
    setSaving(true);
    try {
      const updates = {
        vehicleType: form.vehicleType as VehicleType,
        vehiclePlate: form.vehiclePlate.trim(),
        vehicleModel: form.vehicleModel.trim(),
        vehicleColor: form.vehicleColor.trim(),
        vehicleYear: parseInt(form.vehicleYear, 10),
      };
      
      await updateRider(user.uid, updates);
      
      if (riderProfile) {
        setRiderProfile({ ...riderProfile, ...updates });
      }
      
      setEditing(false);
      Alert.alert("Saved", "Vehicle details updated successfully.");
    } catch {
      Alert.alert("Error", "Failed to update vehicle details. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setForm({
      vehicleType: riderProfile?.vehicleType || "motorcycle",
      vehiclePlate: riderProfile?.vehiclePlate || "",
      vehicleModel: riderProfile?.vehicleModel || "",
      vehicleColor: riderProfile?.vehicleColor || "",
      vehicleYear: riderProfile?.vehicleYear?.toString() || "",
    });
    setErrors({});
    setEditing(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Header
          title="Vehicle Details"
          onBack={() => (editing ? handleCancelEdit() : router.back())}
          rightAction={
            editing ? null : (
              <Pressable
                onPress={() => setEditing(true)}
                hitSlop={10}
                className="w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 items-center justify-center active:bg-gray-50"
              >
                <Edit2 size={20} color="#111827" variant="TwoTone" />
              </Pressable>
            )
          }
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          {loading && !editing && (
             <View className="items-center mt-6">
                <ActivityIndicator color="#006B3F" />
             </View>
          )}

          {editing && (
            <View className="items-center mt-4">
              <View className="bg-primary/10 px-4 py-1 rounded-full">
                <Text className="font-sans-medium text-xs text-primary">
                  EDITING MODE
                </Text>
              </View>
            </View>
          )}

          {/* ── Classification ── */}
          <SectionLabel title="Classification" />
          <View className="mx-6 bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
            {editing ? (
              <View className="p-5">
                <Text className="font-sans-medium text-[10px] text-gray-400 uppercase tracking-wider mb-4">
                  Select Vehicle Type
                </Text>
                <View className="flex-row justify-between">
                  {VEHICLE_TYPES.map((t) => {
                    const active = form.vehicleType === t.id;
                    return (
                      <Pressable
                        key={t.id}
                        onPress={() => setForm(p => ({ ...p, vehicleType: t.id }))}
                        className={`items-center justify-center rounded-full w-[22%] py-4 border ${active ? "bg-primary border-primary" : "bg-gray-50 border-gray-100"}`}
                      >
                        <Ionicons name={t.icon} size={24} color={active ? "#fff" : "#9CA3AF"} />
                        <Text className={`font-sans text-[9px] mt-1 ${active ? "text-white" : "text-gray-500"}`}>
                          {t.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : (
              <FieldRow
                label="Vehicle Type"
                value={form.vehicleType.charAt(0).toUpperCase() + form.vehicleType.slice(1)}
                editing={false}
                isLast
              />
            )}
          </View>

          {/* ── Registration ── */}
          <SectionLabel title="Identification" />
          <View className="mx-6 bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
            <FieldRow
              label="Plate Number"
              value={form.vehiclePlate}
              onChange={(t) => setForm((p) => ({ ...p, vehiclePlate: t }))}
              editing={editing}
              autoCapitalize="characters"
              errorMsg={errors.vehiclePlate}
            />
            <FieldRow
              label="Vehicle Model"
              value={form.vehicleModel}
              onChange={(t) => setForm((p) => ({ ...p, vehicleModel: t }))}
              editing={editing}
              autoCapitalize="words"
              errorMsg={errors.vehicleModel}
            />
            <FieldRow
              label="Color"
              value={form.vehicleColor}
              onChange={(t) => setForm((p) => ({ ...p, vehicleColor: t }))}
              editing={editing}
              autoCapitalize="words"
              errorMsg={errors.vehicleColor}
            />
            <FieldRow
              label="Manufacture Year"
              value={form.vehicleYear}
              onChange={(t) => setForm((p) => ({ ...p, vehicleYear: t }))}
              editing={editing}
              keyboardType="number-pad"
              maxLength={4}
              errorMsg={errors.vehicleYear}
              isLast
            />
          </View>

          {/* ── Dynamic Verification Status ── */}
          <SectionLabel title="Verification" />
          <View className="mx-6 mb-6">
            <Pressable
              onPress={() => router.push("/profile/documents")}
              style={{ backgroundColor: vStatus.bg, borderColor: "rgba(0,0,0,0.05)", borderWidth: 1 }}
              className="flex-row items-center p-5 rounded-[32px] active:opacity-90"
            >
              <View 
                style={{ backgroundColor: "#fff" }} 
                className="w-12 h-12 rounded-full items-center justify-center mr-4 shadow-sm"
              >
                <Ionicons name={vStatus.icon} size={26} color={vStatus.color} />
              </View>
              <View className="flex-1">
                <Text style={{ color: vStatus.color }} className="font-sans-bold text-base mb-0.5">
                  {vStatus.label}
                </Text>
                <Text className="font-sans text-xs text-gray-500 opacity-70">
                  {vStatus.status === "approved" 
                    ? "Rider documents verified by admin" 
                    : vStatus.status === "missing" 
                    ? "Upload vehicle registration & insurance"
                    : "Admin is currently reviewing documents"}
                </Text>
              </View>
              <View className="bg-white/40 rounded-full px-3 py-1">
                 <Text className="font-sans-bold text-[10px] text-gray-400">VIEW</Text>
              </View>
            </Pressable>
          </View>

        </ScrollView>

        {/* ── Save / Cancel footer ── */}
        {editing && (
          <View
            className="absolute bottom-0 left-0 right-0 bg-gray-50 px-6 pt-4 border-t border-gray-200 flex-row gap-3"
            style={{ paddingBottom: Platform.OS === "ios" ? 36 : 52 }}
          >
            <Pressable
              onPress={handleCancelEdit}
              className="flex-1 bg-white border border-gray-200 rounded-full py-4 items-center active:bg-gray-100 shadow-sm"
            >
              <Text className="font-sans-bold text-base text-gray-900">
                Cancel
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSave}
              disabled={saving}
              className="flex-[2] bg-primary rounded-full py-4 items-center justify-center active:bg-primary-600 shadow-sm"
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="font-sans-bold text-base text-white">
                  Save Changes
                </Text>
              )}
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
