import {
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  query,
  limit,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../config";
import type { Dispute } from "@goshats/types";

function disputeRef(orderId: string) {
  return collection(db, "orders", orderId, "dispute");
}

export async function createDispute(
  orderId: string,
  data: Omit<Dispute, "id" | "createdAt">
): Promise<string> {
  const ref = await addDoc(disputeRef(orderId), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getDispute(orderId: string): Promise<Dispute | null> {
  const q = query(disputeRef(orderId), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Dispute;
}

export function listenToDispute(
  orderId: string,
  callback: (dispute: Dispute | null) => void
): Unsubscribe {
  const q = query(disputeRef(orderId), limit(1));
  return onSnapshot(q, (snap) => {
    if (snap.empty) {
      callback(null);
      return;
    }
    const d = snap.docs[0];
    callback({ id: d.id, ...d.data() } as Dispute);
  });
}
