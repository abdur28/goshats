import { useAuthStore } from "@/store/auth-store";
import {
  addRiderDocument,
  getRiderDocuments,
  removeRiderDocument,
} from "@goshats/firebase/src/firestore/rider-documents";
import { uploadRiderDocument, deletePhoto } from "@goshats/firebase/src/storage";
import { Header } from "@goshats/ui";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import {
  DocumentText,
  GalleryAdd,
  ShieldTick,
  Trash,
  Clock,
  CloseCircle,
  FolderOpen,
} from "iconsax-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView, Swipeable } from "react-native-gesture-handler";
import type { RiderDocument, RiderDocumentType } from "@goshats/types";

// ─── Document types the rider can upload ───────────────────────────────────────
const DOCUMENT_TYPES: { type: RiderDocumentType; label: string; description: string }[] = [
  {
    type: "identity",
    label: "Government ID",
    description: "Driver's Licence, NIN slip, or National ID card",
  },
  {
    type: "vehicle_reg",
    label: "Vehicle Registration",
    description: "Vehicle licence or proof of registration",
  },
  {
    type: "insurance",
    label: "Insurance Certificate",
    description: "Valid vehicle insurance certificate",
  },
  {
    type: "roadworthiness",
    label: "Roadworthiness",
    description: "Roadworthiness certificate from VIO",
  },
];

// ─── Status badge ───────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: RiderDocument["status"] }) => {
  const config = {
    pending:  { icon: Clock,       color: "#D97706", bg: "#FEF3C7", label: "Under Review" },
    approved: { icon: ShieldTick,  color: "#059669", bg: "#D1FAE5", label: "Approved" },
    rejected: { icon: CloseCircle, color: "#DC2626", bg: "#FEE2E2", label: "Rejected" },
  }[status];
  const Icon = config.icon;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: config.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
      <Icon size={13} color={config.color} variant="Bold" />
      <Text style={{ fontFamily: "PolySans-Median", fontSize: 11, color: config.color }}>{config.label}</Text>
    </View>
  );
};

// ─── Main screen ───────────────────────────────────────────────────────────────
export default function DocumentsScreen() {
  const { user } = useAuthStore();

  const [docs, setDocs] = useState<RiderDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<RiderDocumentType | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Preview modal
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    getRiderDocuments(user.uid)
      .then(setDocs)
      .finally(() => setLoading(false));
  }, [user?.uid]);

  // ─── Document picker ─────────────────────────────────────────────────────────
  const handlePickDocument = async (type: RiderDocumentType, label: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (result.canceled || !user) return;

      setUploading(type);
      setUploadProgress(0);

      const file = result.assets[0];
      const { downloadUrl, storagePath } = await uploadRiderDocument(
        user.uid,
        type,
        file.uri,
        (p) => setUploadProgress(Math.round(p))
      );

      await addRiderDocument(user.uid, {
        type,
        label,
        storageUrl: downloadUrl,
        storagePath,
        status: "pending",
        rejectionReason: null,
      });

      // Refresh list
      const updated = await getRiderDocuments(user.uid);
      setDocs(updated);
      Alert.alert("Uploaded", `${label} submitted for review.`);
    } catch (err) {
      if (__DEV__) console.error("Document Picker/Upload Error:", err);
      Alert.alert("Upload Failed", "Could not upload document. Please try again.");
    } finally {
      setUploading(null);
      setUploadProgress(0);
    }
  };

  // ─── Delete document ─────────────────────────────────────────────────────────
  const handleDelete = (doc: RiderDocument) => {
    Alert.alert(
      "Remove Document",
      `Remove "${doc.label}"? You'll need to re-upload it for verification.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            if (!user) return;
            try {
              await removeRiderDocument(user.uid, doc.id);
              try { await deletePhoto(doc.storagePath); } catch { /* ignore */ }
              setDocs((prev) => prev.filter((d) => d.id !== doc.id));
            } catch {
              Alert.alert("Error", "Failed to remove document.");
            }
          },
        },
      ]
    );
  };

  // ─── Group uploaded docs by type ─────────────────────────────────────────────
  const uploadedByType = (type: RiderDocumentType) =>
    docs.filter((d) => d.type === type);

  // ─── Swipe content ─────────────────────────────────────────────────────────────
  const renderRightActions = (doc: RiderDocument) => (
    <View style={{ justifyContent: "center", marginLeft: 12 }}>
      <Pressable
        onPress={() => handleDelete(doc)}
        style={{
          width: 60,
          height: 60,
          borderRadius: 20,
          backgroundColor: "#FEE2E2",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Trash size={24} color="#EF4444" variant="Bold" />
      </Pressable>
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
        <Header title="Documents" onBack={() => router.back()} />

        {loading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator color="#006B3F" />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }}
          >
            <Text className="font-sans text-sm text-gray-500 text-center mt-6 mb-8 leading-5 px-4">
              Upload clear PDF or Image copies of your documents. Verification takes up to 24 hours.
            </Text>

            {DOCUMENT_TYPES.map(({ type, label, description }) => {
              const uploadedDocs = uploadedByType(type);
              const isUploading = uploading === type;

              return (
                <View key={type} className="mb-8">
                  {/* Section Label & Upload Action */}
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-1 pr-4">
                      <Text className="font-sans-bold text-base text-gray-900">{label}</Text>
                      <Text className="font-sans text-xs text-gray-400 mt-0.5">{description}</Text>
                    </View>
                    {uploadedDocs.length === 0 && (
                      <Pressable
                        onPress={() => handlePickDocument(type, label)}
                        disabled={!!uploading}
                        className="bg-primary px-4 py-2.5 rounded-full flex-row items-center gap-2"
                        style={{ opacity: uploading ? 0.6 : 1 }}
                      >
                        {isUploading ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <GalleryAdd size={18} color="#fff" variant="Bold" />
                        )}
                        <Text className="font-sans-bold text-sm text-white">
                          {isUploading ? `${uploadProgress}%` : "Add"}
                        </Text>
                      </Pressable>
                    )}
                  </View>

                  {/* Vertical List of Documents */}
                  {uploadedDocs.length === 0 ? (
                    <Pressable
                      onPress={() => handlePickDocument(type, label)}
                      disabled={!!uploading}
                      className="h-[100px] bg-white rounded-3xl border-2 border-dashed border-gray-200 items-center justify-center gap-2"
                    >
                      <FolderOpen size={32} color="#D1D5DB" variant="TwoTone" />
                      <Text className="font-sans-medium text-gray-400 text-xs">No documents uploaded</Text>
                    </Pressable>
                  ) : (
                    <View className="gap-3">
                      {uploadedDocs.map((item) => (
                        <Swipeable
                          key={item.id}
                          renderRightActions={() => renderRightActions(item)}
                          overshootRight={false}
                          enabled={item.status !== "pending"}
                        >
                          <Pressable
                            onPress={() => setPreviewUrl(item.storageUrl)}
                            className="bg-white rounded-3xl border border-gray-100 p-3 flex-row items-center gap-4"
                          >
                            {/* Document Preview / Icon */}
                            <View className="w-14 h-14 bg-gray-50 rounded-2xl overflow-hidden items-center justify-center">
                              {item.storageUrl.toLowerCase().includes(".pdf") ? (
                                <DocumentText size={28} color="#9CA3AF" variant="TwoTone" />
                              ) : (
                                <Image
                                  source={{ uri: item.storageUrl }}
                                  style={{ width: "100%", height: "100%" }}
                                  resizeMode="cover"
                                />
                              )}
                            </View>

                            {/* Info */}
                            <View className="flex-1">
                              <Text className="font-sans-medium text-sm text-gray-900" numberOfLines={1}>
                                {item.label}
                              </Text>
                              <View className="mt-1 flex-row">
                                <StatusBadge status={item.status} />
                              </View>
                            </View>

                            {/* Chevron / Swipe Tip */}
                            <View className="pr-1">
                              <Text className="text-[10px] text-gray-300 font-sans">Swipe to delete</Text>
                            </View>
                          </Pressable>
                        </Swipeable>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* ─── Full-screen preview modal ────────────────────────────────────────── */}
        <Modal
          visible={!!previewUrl}
          animationType="fade"
          transparent
          onRequestClose={() => setPreviewUrl(null)}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.92)", alignItems: "center", justifyContent: "center" }}
            onPress={() => setPreviewUrl(null)}
          >
            {previewUrl && (
              <Image
                source={{ uri: previewUrl }}
                style={{ width: "92%", height: "70%", borderRadius: 16 }}
                resizeMode="contain"
              />
            )}
            <Text style={{ fontFamily: "PolySans-Neutral", fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 16 }}>
              Tap to close
            </Text>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
