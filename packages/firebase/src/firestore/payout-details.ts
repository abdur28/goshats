import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../config";
import type { PayoutDetail } from "@goshats/types";

function payoutRef(uid: string) {
  return collection(db, "riders", uid, "payoutDetails");
}

export async function getPayoutDetails(uid: string): Promise<PayoutDetail[]> {
  const q = query(payoutRef(uid), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PayoutDetail);
}

export function listenToPayoutDetails(
  uid: string,
  callback: (details: PayoutDetail[]) => void
): Unsubscribe {
  const q = query(payoutRef(uid), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PayoutDetail));
  });
}

export async function addPayoutDetail(
  uid: string,
  data: Omit<PayoutDetail, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  // If isPrimary, clear all other primary flags first
  if (data.isPrimary) {
    await clearPrimaryFlags(uid);
  }
  const ref = await addDoc(payoutRef(uid), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updatePayoutDetail(
  uid: string,
  detailId: string,
  data: Partial<Omit<PayoutDetail, "id" | "createdAt">>
): Promise<void> {
  if (data.isPrimary) {
    await clearPrimaryFlags(uid, detailId);
  }
  await updateDoc(doc(db, "riders", uid, "payoutDetails", detailId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function removePayoutDetail(
  uid: string,
  detailId: string
): Promise<void> {
  await deleteDoc(doc(db, "riders", uid, "payoutDetails", detailId));
}

export async function setPrimaryPayoutDetail(
  uid: string,
  detailId: string
): Promise<void> {
  const details = await getPayoutDetails(uid);
  const batch = writeBatch(db);
  for (const d of details) {
    batch.update(doc(db, "riders", uid, "payoutDetails", d.id), {
      isPrimary: d.id === detailId,
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
}

/** Internal — set all payoutDetails isPrimary=false, optionally skip one doc */
async function clearPrimaryFlags(uid: string, skipId?: string): Promise<void> {
  const details = await getPayoutDetails(uid);
  const batch = writeBatch(db);
  for (const d of details) {
    if (d.id === skipId) continue;
    if (d.isPrimary) {
      batch.update(doc(db, "riders", uid, "payoutDetails", d.id), {
        isPrimary: false,
        updatedAt: serverTimestamp(),
      });
    }
  }
  await batch.commit();
}
