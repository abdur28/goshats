import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { db } from "../config";
import type { PromoCode, PromoCodeUsage } from "@goshats/types";

export async function getPromoCode(code: string): Promise<PromoCode | null> {
  const snap = await getDoc(doc(db, "promoCodes", code));
  if (!snap.exists()) return null;
  return snap.data() as PromoCode;
}

export async function getActivePromos(count: number = 5): Promise<PromoCode[]> {
  const now = new Date();
  const q = query(
    collection(db, "promoCodes"),
    where("isActive", "==", true),
    orderBy("createdAt", "desc"),
    limit(count)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ ...(d.data() as PromoCode), code: d.id }))
    .filter((p) => p.expiresAt.toDate() > now);
}

export async function getPromoUsage(
  code: string,
  uid: string
): Promise<PromoCodeUsage | null> {
  const snap = await getDoc(doc(db, "promoCodes", code, "usages", uid));
  if (!snap.exists()) return null;
  return snap.data() as PromoCodeUsage;
}
