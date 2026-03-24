import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config";
import type { Referral } from "@goshats/types";

const referralsRef = collection(db, "referrals");

export async function getUserReferrals(userId: string): Promise<Referral[]> {
  const q = query(
    referralsRef,
    where("referrerId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Referral);
}

export async function createReferral(
  data: Omit<Referral, "id" | "createdAt">
): Promise<string> {
  const ref = await addDoc(referralsRef, {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}
