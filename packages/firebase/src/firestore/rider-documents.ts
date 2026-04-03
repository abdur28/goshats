import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../config";
import type { RiderDocument } from "@goshats/types";

function docsRef(uid: string) {
  return collection(db, "riders", uid, "documents");
}

export async function getRiderDocuments(uid: string): Promise<RiderDocument[]> {
  const q = query(docsRef(uid), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as RiderDocument);
}

export function listenToRiderDocuments(
  uid: string,
  callback: (docs: RiderDocument[]) => void
): Unsubscribe {
  const q = query(docsRef(uid), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as RiderDocument));
  });
}

export async function addRiderDocument(
  uid: string,
  data: Omit<RiderDocument, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = await addDoc(docsRef(uid), {
    ...data,
    status: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateRiderDocument(
  uid: string,
  docId: string,
  data: Partial<Omit<RiderDocument, "id" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, "riders", uid, "documents", docId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function removeRiderDocument(
  uid: string,
  docId: string
): Promise<void> {
  await deleteDoc(doc(db, "riders", uid, "documents", docId));
}
