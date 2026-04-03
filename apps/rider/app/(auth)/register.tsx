import { Ionicons } from "@expo/vector-icons";
import { registerWithEmail } from "@goshats/firebase";
import { createRider } from "@goshats/firebase/src/firestore/riders";
import { Button, Input } from "@goshats/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// Step 1 schema
const personalSchema = z
  .object({
    surname: z.string().min(1, "Surname is required"),
    otherName: z.string().min(1, "Other name is required"),
    phone: z
      .string()
      .min(10, "Enter a valid phone number")
      .regex(/^\+?[0-9]+$/, "Enter a valid phone number"),
    email: z.string().email("Enter a valid email"),
    password: z
      .string()
      .min(8, "Min. 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[0-9]/, "Must contain a number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Step 2 schema
const vehicleSchema = z.object({
  vehiclePlate: z.string().min(3, "Enter your plate number"),
  vehicleModel: z.string().min(2, "Enter your vehicle model"),
  vehicleColor: z.string().min(2, "Enter the colour"),
  vehicleYear: z
    .string()
    .regex(/^\d{4}$/, "Enter a 4-digit year")
    .refine((v) => {
      const y = parseInt(v);
      return y >= 1990 && y <= new Date().getFullYear() + 1;
    }, "Enter a valid year"),
});

type PersonalInput = z.infer<typeof personalSchema>;
type VehicleType = "motorcycle" | "bicycle" | "car" | "van";

type VehicleFields = {
  vehiclePlate: string;
  vehicleModel: string;
  vehicleColor: string;
  vehicleYear: string;
};

const VEHICLE_TYPES: { value: VehicleType; label: string; icon: string }[] = [
  { value: "motorcycle", label: "Motorcycle", icon: "bicycle-outline" },
  { value: "bicycle", label: "Bicycle", icon: "bicycle-outline" },
  { value: "car", label: "Car", icon: "car-outline" },
  { value: "van", label: "Van", icon: "bus-outline" },
];

function getFirebaseErrorMessage(code: string): string {
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/invalid-email":
      return "Invalid email address.";
    case "auth/weak-password":
      return "Password is too weak.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<"personal" | "vehicle">("personal");
  const [pendingPersonal, setPendingPersonal] = useState<PersonalInput | null>(
    null,
  );
  const [vehicleType, setVehicleType] = useState<VehicleType>("motorcycle");
  const [loading, setLoading] = useState(false);
  const [firebaseError, setFirebaseError] = useState("");

  const [vehicleFields, setVehicleFields] = useState<VehicleFields>({
    vehiclePlate: "",
    vehicleModel: "",
    vehicleColor: "",
    vehicleYear: "",
  });
  const [vehicleErrors, setVehicleErrors] = useState<Partial<VehicleFields>>(
    {},
  );

  const personalForm = useForm<PersonalInput>({
    resolver: zodResolver(personalSchema),
  });

  const onPersonalSubmit = (data: PersonalInput) => {
    setPendingPersonal(data);
    setFirebaseError("");
    setStep("vehicle");
  };

  const setVehicleField = (field: keyof VehicleFields, value: string) => {
    setVehicleFields((prev) => ({ ...prev, [field]: value }));
    if (vehicleErrors[field]) {
      setVehicleErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const onVehicleSubmit = async () => {
    if (!pendingPersonal) return;
    const result = vehicleSchema.safeParse(vehicleFields);
    if (!result.success) {
      const errs: Partial<VehicleFields> = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0] as keyof VehicleFields;
        if (key && !errs[key]) errs[key] = issue.message;
      });
      setVehicleErrors(errs);
      return;
    }
    const data = result.data;
    setLoading(true);
    setFirebaseError("");
    try {
      const firebaseUser = await registerWithEmail(
        pendingPersonal.email,
        pendingPersonal.password,
      );
      await createRider(firebaseUser.uid, {
        surname: pendingPersonal.surname,
        otherName: pendingPersonal.otherName,
        email: pendingPersonal.email,
        phone: pendingPersonal.phone,
        profilePhotoUrl: null,
        vehicleType,
        vehiclePlate: data.vehiclePlate.toUpperCase(),
        vehicleModel: data.vehicleModel,
        vehicleColor: data.vehicleColor,
        vehicleYear: parseInt(data.vehicleYear),
        currentLocation: null,
        geohash: null,
        isOnline: false,
        isAvailable: false,
        status: "pending",
        tier: "standard",
        totalTrips: 0,
        totalEarningsKobo: 0,
        pendingEarningsKobo: 0,
        averageRating: 0,
        totalRatings: 0,
        fcmTokens: [],
        notifyPush: true,
        notifyEmail: true,
        notifySms: true,
      });
      router.replace("/(auth)/pending-approval" as any);
    } catch (err: any) {
      setFirebaseError(getFirebaseErrorMessage(err?.code ?? ""));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === "vehicle") {
      setStep("personal");
      setFirebaseError("");
    } else {
      router.back();
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="light" />

      {/* Hero */}
      <View
        className="overflow-hidden"
        style={{ height: SCREEN_HEIGHT * 0.15 }}
      >
        <Image
          source={require("@/assets/images/background.png")}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
        <LinearGradient
          colors={["transparent", "rgba(255,255,255,0.4)", "#FFFFFF"]}
          locations={[0.1, 0.8, 1]}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "60%",
          }}
        />
        <Pressable
          onPress={handleBack}
          style={{
            position: "absolute",
            top: insets.top + 12,
            left: 24,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "rgba(0,0,0,0.2)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </Pressable>

        {/* Step indicator */}
        <View
          style={{
            position: "absolute",
            bottom: 16,
            right: 24,
            flexDirection: "row",
            gap: 6,
          }}
        >
          <View
            style={{
              width: step === "personal" ? 20 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: step === "personal" ? "#006B3F" : "#D1FAE5",
            }}
          />
          <View
            style={{
              width: step === "vehicle" ? 20 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: step === "vehicle" ? "#006B3F" : "#D1FAE5",
            }}
          />
        </View>
      </View>

      <ScrollView
        className="flex-1 pt-10"
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 32),
          paddingHorizontal: 28,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === "personal" ? (
          <>
            <View className="mb-8">
              <Text className="text-[28px] leading-[36px] font-sans-bold text-gray-900 mb-2">
                Join as a rider
              </Text>
              <Text className="text-[15px] font-sans text-gray-400">
                Step 1 of 2 — Personal details
              </Text>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Controller
                  control={personalForm.control}
                  name="surname"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Surname"
                      placeholder="Doe"
                      autoCapitalize="words"
                      onChangeText={onChange}
                      onBlur={onBlur}
                      value={value}
                      error={personalForm.formState.errors.surname?.message}
                    />
                  )}
                />
              </View>
              <View className="flex-1">
                <Controller
                  control={personalForm.control}
                  name="otherName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Other name"
                      placeholder="John"
                      autoCapitalize="words"
                      onChangeText={onChange}
                      onBlur={onBlur}
                      value={value}
                      error={personalForm.formState.errors.otherName?.message}
                    />
                  )}
                />
              </View>
            </View>

            <Controller
              control={personalForm.control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Phone number"
                  placeholder="+2348012345678"
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  leftIcon="call-outline"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={personalForm.formState.errors.phone?.message}
                />
              )}
            />

            <Controller
              control={personalForm.control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email address"
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  leftIcon="mail-outline"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={personalForm.formState.errors.email?.message}
                />
              )}
            />

            <Controller
              control={personalForm.control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder="Min. 8 chars, 1 uppercase, 1 number"
                  secureTextEntry
                  autoComplete="new-password"
                  leftIcon="lock-closed-outline"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={personalForm.formState.errors.password?.message}
                />
              )}
            />

            <Controller
              control={personalForm.control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Confirm password"
                  placeholder="Re-enter your password"
                  secureTextEntry
                  autoComplete="new-password"
                  leftIcon="lock-closed-outline"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={personalForm.formState.errors.confirmPassword?.message}
                />
              )}
            />

            <Button
              title="Continue"
              variant="primary"
              size="lg"
              onPress={personalForm.handleSubmit(onPersonalSubmit)}
            />

            <Text className="text-xs leading-[18px] font-sans text-gray-400 text-center mt-4">
              By applying you agree to our{" "}
              <Text className="font-sans-medium text-gray-700 underline">
                Terms of Use
              </Text>{" "}
              and{" "}
              <Text className="font-sans-medium text-gray-700 underline">
                Privacy Policy
              </Text>
            </Text>
          </>
        ) : (
          <>
            <View className="mb-8">
              <Text className="text-[28px] leading-[36px] font-sans-bold text-gray-900 mb-2">
                Your vehicle
              </Text>
              <Text className="text-[15px] font-sans text-gray-400">
                Step 2 of 2 — Vehicle details
              </Text>
            </View>

            {/* Vehicle type selector */}
            <Text className="text-sm font-sans-medium text-gray-700 mb-2">
              Vehicle type
            </Text>
            <View className="flex-row gap-2 mb-5">
              {VEHICLE_TYPES.map(({ value, label, icon }) => {
                const active = vehicleType === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setVehicleType(value)}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 9999,
                      alignItems: "center",
                      gap: 4,
                      backgroundColor: active ? "#006B3F" : "#F3F4F6",
                      borderWidth: active ? 0 : 1,
                      borderColor: "#E5E7EB",
                    }}
                  >
                    <Ionicons
                      name={icon as any}
                      size={18}
                      color={active ? "#fff" : "#6B7280"}
                    />
                    <Text
                      style={{
                        fontSize: 10,
                        fontFamily: "PolySans-Median",
                        color: active ? "#fff" : "#6B7280",
                      }}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Input
              label="Plate number"
              placeholder="e.g. ABC123DE"
              autoCapitalize="characters"
              leftIcon="card-outline"
              onChangeText={(t) => setVehicleField("vehiclePlate", t)}
              value={vehicleFields.vehiclePlate}
              error={vehicleErrors.vehiclePlate}
            />

            <Input
              label="Vehicle make & model"
              placeholder="e.g. Honda CB 125"
              autoCapitalize="words"
              leftIcon="bicycle-outline"
              onChangeText={(t) => setVehicleField("vehicleModel", t)}
              value={vehicleFields.vehicleModel}
              error={vehicleErrors.vehicleModel}
            />

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Input
                  label="Colour"
                  placeholder="e.g. Red"
                  autoCapitalize="words"
                  onChangeText={(t) => setVehicleField("vehicleColor", t)}
                  value={vehicleFields.vehicleColor}
                  error={vehicleErrors.vehicleColor}
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Year"
                  placeholder="e.g. 2020"
                  keyboardType="number-pad"
                  onChangeText={(t) => setVehicleField("vehicleYear", t)}
                  value={vehicleFields.vehicleYear}
                  error={vehicleErrors.vehicleYear}
                />
              </View>
            </View>

            {firebaseError ? (
              <View className="bg-red-50 border border-red-100 rounded-full px-5 py-3.5 mb-4 flex-row items-center gap-2">
                <Ionicons
                  name="alert-circle-outline"
                  size={16}
                  color="#EF4444"
                />
                <Text className="text-sm font-sans text-danger flex-1">
                  {firebaseError}
                </Text>
              </View>
            ) : null}

            <Button
              title="Submit Application"
              variant="primary"
              size="lg"
              loading={loading}
              onPress={onVehicleSubmit}
            />
          </>
        )}

        {step === "personal" && (
          <View className="flex-row justify-center items-center mt-8">
            <Text className="text-sm font-sans text-gray-400">
              Already a rider?{" "}
            </Text>
            <Pressable onPress={() => router.push("/(auth)/sign-in" as any)}>
              <Text className="text-sm font-sans-semibold text-primary">
                Sign in
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
