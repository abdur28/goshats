import {
  collection,
  doc,
  getDocs,
  addDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config";
import type { PaymentMethod } from "@goshats/types";

function methodsRef(uid: string) {
  return collection(db, "users", uid, "paymentMethods");
}

export async function getPaymentMethods(
  uid: string
): Promise<PaymentMethod[]> {
  const q = query(methodsRef(uid), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PaymentMethod);
}

export async function addPaymentMethod(
  uid: string,
  data: Omit<PaymentMethod, "id" | "createdAt">
): Promise<string> {
  const ref = await addDoc(methodsRef(uid), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function removePaymentMethod(
  uid: string,
  methodId: string
): Promise<void> {
  await deleteDoc(doc(db, "users", uid, "paymentMethods", methodId));
}

export async function setPrimaryPaymentMethod(
  uid: string,
  methodId: string
): Promise<void> {
  const methods = await getPaymentMethods(uid);
  const batch = writeBatch(db);

  for (const m of methods) {
    const ref = doc(db, "users", uid, "paymentMethods", m.id);
    batch.update(ref, { isPrimary: m.id === methodId });
  }

  await batch.commit();
}
