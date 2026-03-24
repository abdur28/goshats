import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config";
import type { OrderStop } from "@goshats/types";

function stopsRef(orderId: string) {
  return collection(db, "orders", orderId, "stops");
}

export async function getStops(orderId: string): Promise<OrderStop[]> {
  const q = query(stopsRef(orderId), orderBy("sequence", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as OrderStop);
}

export async function addStop(
  orderId: string,
  data: Omit<OrderStop, "id">
): Promise<string> {
  const ref = await addDoc(stopsRef(orderId), data);
  return ref.id;
}

export async function updateStopStatus(
  orderId: string,
  stopId: string,
  status: OrderStop["status"],
  deliveredAt?: Date
): Promise<void> {
  await updateDoc(doc(db, "orders", orderId, "stops", stopId), {
    status,
    deliveredAt: deliveredAt ?? null,
  });
}
