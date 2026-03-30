import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  arrayUnion,
  serverTimestamp,
  type Unsubscribe,
  type DocumentSnapshot,
} from "firebase/firestore";
import { db } from "../config";
import type { Order, OrderStatus } from "@goshats/types";

const ordersRef = collection(db, "orders");

export async function createOrder(
  data: Omit<Order, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const ref = await addDoc(ordersRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getOrder(orderId: string): Promise<Order | null> {
  const snap = await getDoc(doc(db, "orders", orderId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Order;
}

export function listenToOrder(
  orderId: string,
  callback: (order: Order | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, "orders", orderId), (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    callback({ id: snap.id, ...snap.data() } as Order);
  });
}

export async function getUserOrders(
  customerId: string,
  limitCount: number = 20,
  afterDoc?: DocumentSnapshot
): Promise<{ orders: Order[]; lastDoc: DocumentSnapshot | null }> {
  let q = query(
    ordersRef,
    where("customerId", "==", customerId),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );

  if (afterDoc) {
    q = query(
      ordersRef,
      where("customerId", "==", customerId),
      orderBy("createdAt", "desc"),
      startAfter(afterDoc),
      limit(limitCount)
    );
  }

  const snap = await getDocs(q);
  const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order);
  const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;

  return { orders, lastDoc };
}

export async function getRiderOrders(
  riderId: string,
  limitCount: number = 20,
  afterDoc?: DocumentSnapshot
): Promise<{ orders: Order[]; lastDoc: DocumentSnapshot | null }> {
  let q = query(
    ordersRef,
    where("riderId", "==", riderId),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );

  if (afterDoc) {
    q = query(
      ordersRef,
      where("riderId", "==", riderId),
      orderBy("createdAt", "desc"),
      startAfter(afterDoc),
      limit(limitCount)
    );
  }

  const snap = await getDocs(q);
  const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order);
  const lastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;

  return { orders, lastDoc };
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  note?: string
): Promise<void> {
  await updateDoc(doc(db, "orders", orderId), {
    status,
    timeline: arrayUnion({
      status,
      timestamp: new Date(),
      note: note ?? null,
    }),
    updatedAt: serverTimestamp(),
  });
}

export async function addTip(
  orderId: string,
  tipAmountKobo: number
): Promise<void> {
  await updateDoc(doc(db, "orders", orderId), {
    tipAmountKobo,
    updatedAt: serverTimestamp(),
  });
}

export async function cancelOrder(
  orderId: string,
  reason: string
): Promise<void> {
  await updateOrderStatus(orderId, "cancelled", reason);
}

export async function setOrderCustomerRating(
  orderId: string,
  ratingId: string
): Promise<void> {
  await updateDoc(doc(db, "orders", orderId), {
    customerRatingId: ratingId,
    updatedAt: serverTimestamp(),
  });
}

const ACTIVE_STATUSES: OrderStatus[] = [
  "pending",
  "accepted",
  "arrived_pickup",
  "picked_up",
  "in_transit",
];

export function listenToActiveOrder(
  customerId: string,
  callback: (order: Order | null) => void
): Unsubscribe {
  const q = query(
    ordersRef,
    where("customerId", "==", customerId),
    where("status", "in", ACTIVE_STATUSES),
    orderBy("createdAt", "desc"),
    limit(1)
  );

  return onSnapshot(q, (snap) => {
    if (snap.empty) {
      callback(null);
      return;
    }
    const doc = snap.docs[0];
    callback({ id: doc.id, ...doc.data() } as Order);
  });
}
