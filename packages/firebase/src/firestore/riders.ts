import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  collection,
  where,
  getDocs,
  orderBy,
  serverTimestamp,
  GeoPoint,
  type Unsubscribe,
} from "firebase/firestore";
import {
  geohashForLocation,
  geohashQueryBounds,
  distanceBetween,
} from "geofire-common";
import { db } from "../config";
import type { Rider } from "@goshats/types";

export async function getRider(uid: string): Promise<Rider | null> {
  const snap = await getDoc(doc(db, "riders", uid));
  if (!snap.exists()) return null;
  return { uid: snap.id, ...snap.data() } as Rider;
}

export async function createRider(
  uid: string,
  data: Omit<Rider, "uid" | "createdAt" | "updatedAt">
): Promise<void> {
  await setDoc(doc(db, "riders", uid), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateRider(
  uid: string,
  data: Partial<Rider>
): Promise<void> {
  await updateDoc(doc(db, "riders", uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function getNearbyRiders(
  latitude: number,
  longitude: number,
  radiusKm: number
): Promise<Rider[]> {
  const center: [number, number] = [latitude, longitude];
  const radiusM = radiusKm * 1000;
  const bounds = geohashQueryBounds(center, radiusM);

  const riders: Rider[] = [];

  for (const b of bounds) {
    const q = query(
      collection(db, "riders"),
      where("isOnline", "==", true),
      where("isAvailable", "==", true),
      where("status", "==", "approved"),
      orderBy("geohash"),
      where("geohash", ">=", b[0]),
      where("geohash", "<=", b[1])
    );

    const snap = await getDocs(q);
    for (const d of snap.docs) {
      const rider = { uid: d.id, ...d.data() } as Rider;
      if (rider.currentLocation) {
        const dist = distanceBetween(
          [rider.currentLocation.latitude, rider.currentLocation.longitude],
          center
        );
        if (dist <= radiusKm) {
          riders.push(rider);
        }
      }
    }
  }

  return riders;
}

export async function updateRiderLocation(
  uid: string,
  latitude: number,
  longitude: number
): Promise<void> {
  const geohash = geohashForLocation([latitude, longitude]);
  await updateDoc(doc(db, "riders", uid), {
    currentLocation: new GeoPoint(latitude, longitude),
    geohash,
    updatedAt: serverTimestamp(),
  });
}

export async function updateAvailability(
  uid: string,
  isOnline: boolean,
  isAvailable: boolean
): Promise<void> {
  await updateDoc(doc(db, "riders", uid), {
    isOnline,
    isAvailable,
    updatedAt: serverTimestamp(),
  });
}

export function listenToRider(
  uid: string,
  callback: (rider: Rider | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, "riders", uid), (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    callback({ uid: snap.id, ...snap.data() } as Rider);
  });
}
