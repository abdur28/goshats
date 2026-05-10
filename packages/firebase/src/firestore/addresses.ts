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
  serverTimestamp,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../config";
import type { SavedAddress } from "@goshats/types";

function addressesRef(uid: string) {
  return collection(db, "users", uid, "addresses");
}

export async function getAddresses(uid: string): Promise<SavedAddress[]> {
  const q = query(addressesRef(uid), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SavedAddress);
}

export async function addAddress(
  uid: string,
  data: Omit<SavedAddress, "id" | "createdAt">
): Promise<string> {
  const ref = await addDoc(addressesRef(uid), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateAddress(
  uid: string,
  addressId: string,
  data: Partial<SavedAddress>
): Promise<void> {
  await updateDoc(doc(db, "users", uid, "addresses", addressId), data);
}

export async function deleteAddress(
  uid: string,
  addressId: string
): Promise<void> {
  await deleteDoc(doc(db, "users", uid, "addresses", addressId));
}

export async function setDefaultAddress(
  uid: string,
  addressId: string
): Promise<void> {
  const addresses = await getAddresses(uid);
  const batch = writeBatch(db);

  for (const addr of addresses) {
    const ref = doc(db, "users", uid, "addresses", addr.id);
    batch.update(ref, { isDefault: addr.id === addressId });
  }

  await batch.commit();
}

export function listenToAddresses(
  uid: string,
  callback: (addresses: SavedAddress[]) => void
): Unsubscribe {
  const q = query(addressesRef(uid), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const addresses = snap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as SavedAddress
    );
    callback(addresses);
  });
}
