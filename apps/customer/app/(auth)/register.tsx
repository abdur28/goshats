import { generateOTP, storeOTP, verifyOTP } from "@/lib/otp";
import { Ionicons } from "@expo/vector-icons";
import { createUser, registerWithEmail } from "@goshats/firebase";
import { registerSchema } from "@goshats/types";
import { Button, Input } from "@goshats/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const registerFormSchema = registerSchema
  .extend({
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormInput = z.infer<typeof registerFormSchema>;

function generateReferralCode(surname: string): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const prefix = surname
    .replace(/[^a-zA-Z]/g, "")
    .substring(0, 4)
    .toUpperCase()
    .padEnd(4, "X");
  const suffix = Array.from(
    { length: 4 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
  return prefix + suffix;
}

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
  const [loading, setLoading] = useState(false);
  const [firebaseError, setFirebaseError] = useState("");

  // OTP step state
  const [step, setStep] = useState<"form" | "otp">("form");
  const [pendingData, setPendingData] = useState<RegisterFormInput | null>(
    null,
  );
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormInput>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { countryCode: "NG" },
  });

  const onSubmit = async (data: RegisterFormInput) => {
    setLoading(true);
    setFirebaseError("");
    try {
      const otp = generateOTP();
      await storeOTP(data.email, otp);
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, otp }),
      });
      if (!res.ok) throw new Error("send_failed");
      setPendingData(data);
      setOtpDigits(["", "", "", "", "", ""]);
      setResendCooldown(60);
      setStep("otp");
    } catch {
      setFirebaseError("Failed to send verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const digit = value.replace(/[^0-9]/g, "").slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    if (digit && index < 5) {
      otpRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleResend = async () => {
    if (!pendingData || resendCooldown > 0) return;
    setFirebaseError("");
    try {
      const otp = generateOTP();
      await storeOTP(pendingData.email, otp);
      await fetch(`/api/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingData.email, otp }),
      });
      setOtpDigits(["", "", "", "", "", ""]);
      setResendCooldown(60);
      otpRefs[0].current?.focus();
    } catch {
      setFirebaseError("Failed to resend code. Please try again.");
    }
  };

  const onVerify = async () => {
    if (!pendingData) return;
    const code = otpDigits.join("");
    if (code.length !== 6) {
      setFirebaseError("Please enter all 6 digits.");
      return;
    }
    setOtpLoading(true);
    setFirebaseError("");
    try {
      const { valid, reason } = await verifyOTP(pendingData.email, code);
      if (!valid) {
        setFirebaseError(
          reason === "expired"
            ? "Code expired. Tap resend to get a new one."
            : "Invalid verification code.",
        );
        return;
      }
      const firebaseUser = await registerWithEmail(
        pendingData.email,
        pendingData.password,
      );
      await createUser(firebaseUser.uid, {
        surname: pendingData.surname,
        otherName: pendingData.otherName,
        email: pendingData.email,
        phone: pendingData.phone,
        countryCode: pendingData.countryCode,
        profilePhotoUrl: null,
        referralCode: generateReferralCode(pendingData.surname),
        referralCredits: 0,
        isPhoneVerified: false,
        isEmailVerified: true,
        status: "active",
        fcmTokens: [],
        notifyPush: true,
        notifyEmail: true,
        notifySms: true,
        notifyNewsletter: true,
      });
      router.replace("/(tabs)/" as any);
    } catch (err: any) {
      setFirebaseError(getFirebaseErrorMessage(err?.code ?? ""));
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="light" />

      {/* Hero with back button */}
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
          onPress={() => {
            if (step === "otp") {
              setStep("form");
              setFirebaseError("");
            } else {
              router.back();
            }
          }}
          className="absolute w-10 h-10 rounded-full bg-black/20 items-center justify-center active:opacity-70"
          style={{ top: insets.top + 12, left: 24 }}
        >
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1 pt-10"
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 32),
          paddingHorizontal: 28,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === "form" ? (
          <>
            {/* Heading */}
            <View className="mb-8">
              <Text className="text-[28px] leading-[36px] font-sans-bold text-gray-900 mb-2">
                Create account
              </Text>
              <Text className="text-[15px] font-sans text-gray-400">
                Join GoShats and start sending packages
              </Text>
            </View>

            {/* Form */}
            <View>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Controller
                    control={control}
                    name="surname"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        label="Surname"
                        placeholder="Doe"
                        autoCapitalize="words"
                        onChangeText={onChange}
                        onBlur={onBlur}
                        value={value}
                        error={errors.surname?.message}
                      />
                    )}
                  />
                </View>
                <View className="flex-1">
                  <Controller
                    control={control}
                    name="otherName"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        label="Other name"
                        placeholder="John"
                        autoCapitalize="words"
                        onChangeText={onChange}
                        onBlur={onBlur}
                        value={value}
                        error={errors.otherName?.message}
                      />
                    )}
                  />
                </View>
              </View>

              <Controller
                control={control}
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
                    error={errors.phone?.message}
                  />
                )}
              />

              <Controller
                control={control}
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
                    error={errors.email?.message}
                  />
                )}
              />

              <Controller
                control={control}
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
                    error={errors.password?.message}
                  />
                )}
              />

              <Controller
                control={control}
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
                    error={errors.confirmPassword?.message}
                  />
                )}
              />

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
                title="Continue"
                variant="primary"
                size="lg"
                loading={loading}
                onPress={handleSubmit(onSubmit)}
              />

              <Text className="text-xs leading-[18px] font-sans text-gray-400 text-center mt-4">
                By creating an account you agree to our{" "}
                <Text className="font-sans-medium text-gray-700 underline">
                  Terms of Use
                </Text>{" "}
                and{" "}
                <Text className="font-sans-medium text-gray-700 underline">
                  Privacy Policy
                </Text>
              </Text>
            </View>
          </>
        ) : (
          <>
            {/* OTP Step */}
            <View className="mb-8">
              <Text className="text-[28px] leading-[36px] font-sans-bold text-gray-900 mb-2">
                Check your email
              </Text>
              <Text className="text-[15px] font-sans text-gray-400 leading-6">
                We sent a 6-digit code to{"\n"}
                <Text className="font-sans-medium text-gray-700">
                  {pendingData?.email}
                </Text>
              </Text>
            </View>

            {/* OTP Digit Boxes */}
            <View className="flex-row justify-between mb-8">
              {otpDigits.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={otpRefs[i]}
                  value={digit}
                  onChangeText={(v) => handleOtpChange(v, i)}
                  onKeyPress={({ nativeEvent }) =>
                    handleOtpKeyPress(nativeEvent.key, i)
                  }
                  keyboardType="number-pad"
                  maxLength={2}
                  selectTextOnFocus
                  style={{
                    width: 44,
                    height: 56,
                    borderWidth: 1.5,
                    borderColor: digit ? "#006B3F" : "#E5E7EB",
                    borderRadius: 12,
                    backgroundColor: digit ? "#F0FBF5" : "#FFFFFF",
                    textAlign: "center",
                    fontSize: 22,
                    fontFamily: "PolySans-Bulky",
                    color: "#111827",
                  }}
                />
              ))}
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
              title="Verify & Create Account"
              variant="primary"
              size="lg"
              loading={otpLoading}
              onPress={onVerify}
            />

            <View className="flex-row justify-center items-center mt-6">
              <Text className="text-sm font-sans text-gray-400">
                Didn&apos;t receive a code?{" "}
              </Text>
              <Pressable onPress={handleResend} disabled={resendCooldown > 0}>
                <Text
                  className={`text-sm font-sans-semibold ${
                    resendCooldown > 0 ? "text-gray-400" : "text-primary"
                  }`}
                >
                  {resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : "Resend"}
                </Text>
              </Pressable>
            </View>
          </>
        )}

        {/* Footer */}
        {step === "form" && (
          <View className="flex-row justify-center items-center mt-8">
            <Text className="text-sm font-sans text-gray-400">
              Already have an account?{" "}
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
