import {
  collection,
  addDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../config";
import type { TrackingPoint } from "@goshats/types";

function trackingRef(orderId: string) {
  return collection(db, "orders", orderId, "tracking");
}

export function listenToTracking(
  orderId: string,
  callback: (point: TrackingPoint | null) => void
): Unsubscribe {
  const q = query(
    trackingRef(orderId),
    orderBy("timestamp", "desc"),
    limit(1)
  );

  return onSnapshot(q, (snap) => {
    if (snap.empty) {
      callback(null);
      return;
    }
    const d = snap.docs[0];
    callback({ id: d.id, ...d.data() } as TrackingPoint);
  });
}

export async function addTrackingPoint(
  orderId: string,
  data: Omit<TrackingPoint, "id" | "timestamp">
): Promise<string> {
  const ref = await addDoc(trackingRef(orderId), {
    ...data,
    timestamp: serverTimestamp(),
  });
  return ref.id;
}

export async function getTrackingHistory(
  orderId: string
): Promise<TrackingPoint[]> {
  const q = query(trackingRef(orderId), orderBy("timestamp", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TrackingPoint);
}
