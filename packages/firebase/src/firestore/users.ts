import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { ref, listAll, deleteObject } from "firebase/storage";
import {
  deleteUser as deleteFirebaseAuthUser,
  reauthenticateWithCredential,
  type AuthCredential,
} from "firebase/auth";
import { db, storage, auth } from "../config";
import type { User } from "@goshats/types";

export async function getUser(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { uid: snap.id, ...snap.data() } as User;
}

export async function createUser(
  uid: string,
  data: Omit<User, "uid" | "createdAt" | "updatedAt">
): Promise<void> {
  await setDoc(doc(db, "users", uid), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateUser(
  uid: string,
  data: Partial<User>
): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteUser(uid: string): Promise<void> {
  // Delete data FIRST (while still authenticated), auth account LAST
  const subcollections = ["addresses", "paymentMethods", "notifications"];
  for (const sub of subcollections) {
    const snap = await getDocs(collection(db, "users", uid, sub));
    if (!snap.empty) {
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }

  try {
    const photosRef = ref(storage, `profile-photos/${uid}`);
    const photosList = await listAll(photosRef);
    await Promise.all(photosList.items.map((item) => deleteObject(item)));
  } catch {
    // No photos folder or already deleted
  }

  await deleteDoc(doc(db, "users", uid));

  // Best-effort delete Firebase Auth account — may fail with requires-recent-login
  try {
    if (auth.currentUser?.uid === uid) {
      await deleteFirebaseAuthUser(auth.currentUser);
    }
  } catch {
    // Auth account deletion failed (e.g. requires-recent-login in Expo Go)
    // Data is already deleted — user can sign out safely
  }
}

export async function reauthenticateAndDelete(
  uid: string,
  credential: AuthCredential,
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("No authenticated user");
  await reauthenticateWithCredential(currentUser, credential);
  await deleteUser(uid);
}

export function listenToUser(
  uid: string,
  callback: (user: User | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, "users", uid), (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    callback({ uid: snap.id, ...snap.data() } as User);
  });
}
