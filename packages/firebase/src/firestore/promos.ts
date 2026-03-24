import { doc, getDoc } from "firebase/firestore";
import { db } from "../config";
import type { PromoCode, PromoCodeUsage } from "@goshats/types";

export async function getPromoCode(code: string): Promise<PromoCode | null> {
  const snap = await getDoc(doc(db, "promoCodes", code));
  if (!snap.exists()) return null;
  return snap.data() as PromoCode;
}

export async function getPromoUsage(
  code: string,
  uid: string
): Promise<PromoCodeUsage | null> {
  const snap = await getDoc(doc(db, "promoCodes", code, "usages", uid));
  if (!snap.exists()) return null;
  return snap.data() as PromoCodeUsage;
}
