import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../config";
import type { Rating } from "@goshats/types";

const ratingsRef = collection(db, "ratings");

export async function createRating(
  data: Omit<Rating, "id" | "createdAt">
): Promise<string> {
  const ref = await addDoc(ratingsRef, {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getOrderRatings(orderId: string): Promise<Rating[]> {
  const q = query(ratingsRef, where("orderId", "==", orderId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Rating);
}

export async function getUserRatings(
  userId: string,
  limitCount: number = 20
): Promise<Rating[]> {
  const q = query(
    ratingsRef,
    where("ratedId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Rating);
}
