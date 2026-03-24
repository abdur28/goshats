import {
  collection,
  doc,
  getDocs,
  updateDoc,
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

const notificationsRef = collection(db, "notifications");

export function listenToNotifications(
  userId: string,
  callback: (notifications: AppNotification[]) => void
): Unsubscribe {
  const q = query(
    notificationsRef,
    where("userId", "==", userId),
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
  userId: string,
  limitCount: number = 50
): Promise<AppNotification[]> {
  const q = query(
    notificationsRef,
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as AppNotification
  );
}

export async function markNotificationRead(
  notificationId: string
): Promise<void> {
  await updateDoc(doc(db, "notifications", notificationId), { isRead: true });
}

export async function markAllNotificationsRead(
  userId: string
): Promise<void> {
  const q = query(
    notificationsRef,
    where("userId", "==", userId),
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
