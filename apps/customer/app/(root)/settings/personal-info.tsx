import { useAuthStore } from "@/store/auth-store";
import {
  updateUser,
  uploadProfilePhoto,
  deleteUser,
  signOutUser,
} from "@goshats/firebase";
import { Avatar, Header } from "@goshats/ui";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { Camera, Edit2, Trash } from "iconsax-react-native";
import { useCallback, useState } from "react";
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
  keyboardType?: "default" | "email-address" | "phone-pad";
  autoCapitalize?: "none" | "words" | "sentences";
  isLast?: boolean;
  errorMsg?: string;
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
}: RowProps) => (
  <View className={`px-6 py-4 ${isLast ? "" : "border-b border-gray-200"}`}>
    <View className="flex-row items-center justify-between gap-1.5 mb-1">
      <Text className="font-sans-medium text-[10px] text-gray-400 uppercase tracking-wider">
        {label}
      </Text>
      {locked && editing && (
        <View className="bg-gray-100 rounded-full px-2 py-0.5 flex-row items-center gap-1">
          <Text className="font-sans text-[9px] text-gray-400">
            🔒 not changeable
          </Text>
        </View>
      )}
    </View>

    {editing && onChange ? (
      <View style={{ height: 28, justifyContent: "center" }}>
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          placeholderTextColor="#D1D5DB"
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

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PersonalInfoScreen() {
  const { userProfile, user, setUserProfile } = useAuthStore();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [form, setForm] = useState({
    surname: userProfile?.surname ?? "",
    otherName: userProfile?.otherName ?? "",
    email: userProfile?.email ?? "",
    phone: userProfile?.phone ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fullName = `${form.otherName} ${form.surname}`.trim() || "Your Name";

  const handlePickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted)
      return Alert.alert(
        "Permission denied",
        "Allow photo access in Settings.",
      );

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !user) return;

    setUploadingPhoto(true);
    setUploadProgress(0);
    try {
      const downloadUrl = await uploadProfilePhoto(
        user.uid,
        result.assets[0].uri,
        (progress) => setUploadProgress(Math.round(progress)),
      );

      // Update Firestore
      await updateUser(user.uid, { profilePhotoUrl: downloadUrl });

      // Update local store so avatar refreshes immediately
      if (userProfile) {
        setUserProfile({ ...userProfile, profilePhotoUrl: downloadUrl });
      }
    } catch {
      Alert.alert(
        "Upload Failed",
        "Could not upload your photo. Please try again.",
      );
    } finally {
      setUploadingPhoto(false);
      setUploadProgress(0);
    }
  };

  const validate = useCallback(() => {
    const e: Record<string, string> = {};
    if (!form.surname.trim()) e.surname = "Surname is required";
    if (!form.otherName.trim()) e.otherName = "First name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form]);

  const handleSave = async () => {
    if (!validate() || !user) return;
    setSaving(true);
    try {
      await updateUser(user.uid, {
        surname: form.surname.trim(),
        otherName: form.otherName.trim(),
        email: form.email.trim(),
      });
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          surname: form.surname.trim(),
          otherName: form.otherName.trim(),
          email: form.email.trim(),
        });
      }
      setEditing(false);
      Alert.alert("Saved", "Your profile has been updated.");
    } catch {
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setForm({
      surname: userProfile?.surname ?? "",
      otherName: userProfile?.otherName ?? "",
      email: userProfile?.email ?? "",
      phone: userProfile?.phone ?? "",
    });
    setErrors({});
    setEditing(false);
  };

  const handleDeleteAccount = () =>
    Alert.alert(
      "Delete Account",
      "This action is permanent and cannot be undone. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!user) return;
            try {
              await deleteUser(user.uid);
            } catch (err: any) {
              console.error("Delete account error:", err);
              Alert.alert("Error", "Failed to delete account. Please try again.");
              return;
            }
            try {
              await signOutUser();
            } catch {}
            useAuthStore.getState().clearAuth();
            router.replace("/(auth)/welcome");
          },
        },
      ],
    );

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* ── Header ── */}
        <Header
          title="Personal Information"
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
          {/* ── Avatar ── */}
          <View className="items-center pt-6 pb-2">
            <View className="relative">
              <View className="rounded-full bg-primary/5 p-1">
                <Avatar
                  uri={userProfile?.profilePhotoUrl}
                  name={fullName}
                  size="xl"
                />
              </View>
              <Pressable
                onPress={handlePickPhoto}
                className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-primary items-center justify-center border-[3px] border-gray-50"
              >
                {uploadingPhoto ? (
                  <Text
                    style={{
                      fontSize: 8,
                      color: "#fff",
                      fontFamily: "PolySans-Bulky",
                    }}
                  >
                    {uploadProgress}%
                  </Text>
                ) : (
                  <Camera size={16} color="#fff" variant="Bold" />
                )}
              </Pressable>
            </View>

            <Text className="font-sans-bold text-[22px] text-gray-900 mt-4">
              {fullName}
            </Text>
            <Text className="font-sans text-base text-gray-500 mt-0.5">
              {form.email || "No email set"}
            </Text>

            {editing && (
              <View className="mt-3 bg-primary/10 px-4 py-1 rounded-full">
                <Text className="font-sans-medium text-sm text-primary">
                  Editing mode
                </Text>
              </View>
            )}
          </View>

          {/* ── Name ── */}
          <SectionLabel title="Name" />
          <View className="mx-6 bg-white rounded-4xl shadow-sm border border-gray-100">
            <FieldRow
              label="First / Other Name"
              value={form.otherName}
              onChange={(t) => setForm((p) => ({ ...p, otherName: t }))}
              editing={editing}
              autoCapitalize="words"
              errorMsg={errors.otherName}
            />
            <FieldRow
              label="Surname"
              value={form.surname}
              onChange={(t) => setForm((p) => ({ ...p, surname: t }))}
              editing={editing}
              autoCapitalize="words"
              errorMsg={errors.surname}
              isLast
            />
          </View>

          {/* ── Contact ── */}
          <SectionLabel title="Contact" />
          <View className="mx-6 bg-white rounded-4xl shadow-sm border border-gray-100">
            <FieldRow
              label="Email Address"
              value={form.email}
              editing={editing}
              locked
              keyboardType="email-address"
              autoCapitalize="none"
              errorMsg={errors.email}
            />
            <FieldRow
              label="Phone Number"
              value={form.phone}
              onChange={(t) => setForm((p) => ({ ...p, phone: t }))}
              editing={editing}
              keyboardType="phone-pad"
              isLast
            />
          </View>

          {/* ── Account ── */}
          <SectionLabel title="Account" />
          <View className="mx-6 bg-white rounded-4xl shadow-sm border border-gray-100">
            <Pressable
              onPress={handleDeleteAccount}
              className="flex-row items-center py-[18px] px-6 active:bg-red-50 rounded-4xl"
            >
              <View className="w-12 h-12 rounded-full bg-danger/10 items-center justify-center mr-4">
                <Trash size={22} color="#EF4444" variant="TwoTone" />
              </View>
              <View className="flex-1">
                <Text className="font-sans-semibold text-base text-danger mb-0.5">
                  Delete Account
                </Text>
                <Text className="font-sans text-sm text-gray-500">
                  Permanently remove your account
                </Text>
              </View>
            </Pressable>
          </View>
        </ScrollView>

        {/* ── Save / Cancel footer — only in edit mode ── */}
        {editing && (
          <View
            className="absolute bottom-0 left-0 right-0 bg-gray-50 px-6 pt-4 border-t border-gray-200 flex-row gap-3"
            style={{ paddingBottom: Platform.OS === "ios" ? 36 : 52 }}
          >
            <Pressable
              onPress={handleCancelEdit}
              className="flex-1 bg-white border border-gray-200 rounded-full py-4 items-center active:bg-gray-100"
            >
              <Text className="font-sans-bold text-base text-gray-900">
                Cancel
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSave}
              disabled={saving}
              className="flex-[2] bg-primary rounded-full py-4 items-center justify-center active:bg-primary-600"
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
