import {
  collection,
  doc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../config";
import type { AppNotification } from "@goshats/types";

/**
 * Get the notifications subcollection reference for a user or rider.
 *
 * @param collectionName - "users" or "riders"
 * @param uid - The user/rider UID
 */
function notificationsRef(collectionName: "users" | "riders", uid: string) {
  return collection(db, collectionName, uid, "notifications");
}

export function listenToNotifications(
  collectionName: "users" | "riders",
  uid: string,
  callback: (notifications: AppNotification[]) => void
): Unsubscribe {
  const q = query(
    notificationsRef(collectionName, uid),
    orderBy("createdAt", "desc"),
    limit(50)
  );

  return onSnapshot(q, (snap) => {
    const notifications = snap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as AppNotification
    );
    callback(notifications);
  });
}

export async function getNotifications(
  collectionName: "users" | "riders",
  uid: string,
  limitCount: number = 50
): Promise<AppNotification[]> {
  const q = query(
    notificationsRef(collectionName, uid),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as AppNotification
  );
}

export async function markNotificationRead(
  collectionName: "users" | "riders",
  uid: string,
  notificationId: string
): Promise<void> {
  await updateDoc(
    doc(db, collectionName, uid, "notifications", notificationId),
    { isRead: true }
  );
}

export async function markAllNotificationsRead(
  collectionName: "users" | "riders",
  uid: string
): Promise<void> {
  const q = query(
    notificationsRef(collectionName, uid),
    where("isRead", "==", false)
  );

  const snap = await getDocs(q);
  if (snap.empty) return;

  const batch = writeBatch(db);
  for (const d of snap.docs) {
    batch.update(d.ref, { isRead: true });
  }
  await batch.commit();
}

export async function deleteNotification(
  collectionName: "users" | "riders",
  uid: string,
  notificationId: string
): Promise<void> {
  await deleteDoc(
    doc(db, collectionName, uid, "notifications", notificationId)
  );
}
