import { db } from "@goshats/firebase";
import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore";
import * as Crypto from "expo-crypto";

const OTP_EXPIRY_MINUTES = 15;

export function generateOTP(): string {
  const bytes = Crypto.getRandomBytes(4);
  const value = new DataView(bytes.buffer).getUint32(0, false);
  return String(100000 + (value % 900000));
}

export async function storeOTP(email: string, otp: string): Promise<void> {
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  await setDoc(doc(db, "otps", email.toLowerCase()), {
    email: email.toLowerCase(),
    otp,
    expiresAt: Timestamp.fromDate(expiresAt),
    createdAt: Timestamp.now(),
    verified: false,
  });
}

export async function verifyOTP(
  email: string,
  code: string
): Promise<{ valid: boolean; reason?: "not_found" | "invalid" | "expired" | "already_used" }> {
  const snap = await getDoc(doc(db, "otps", email.toLowerCase()));
  if (!snap.exists()) return { valid: false, reason: "not_found" };

  const data = snap.data();
  if (data.verified) return { valid: false, reason: "already_used" };
  if (data.otp !== code) return { valid: false, reason: "invalid" };
  if (new Date() > (data.expiresAt.toDate() as Date)) return { valid: false, reason: "expired" };

  return { valid: true };
}
