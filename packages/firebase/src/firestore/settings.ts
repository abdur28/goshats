import { doc, getDoc, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { db } from "../config";
import type { PricingSettings, AppSettings } from "@goshats/types";

export async function getPricingSettings(): Promise<PricingSettings> {
  const snap = await getDoc(doc(db, "settings", "pricing"));
  if (!snap.exists()) throw new Error("Pricing settings not found");
  return snap.data() as PricingSettings;
}

export async function getAppSettings(): Promise<AppSettings> {
  const snap = await getDoc(doc(db, "settings", "app"));
  if (!snap.exists()) throw new Error("App settings not found");
  return snap.data() as AppSettings;
}

export function listenToPricingSettings(
  callback: (settings: PricingSettings) => void
): Unsubscribe {
  return onSnapshot(doc(db, "settings", "pricing"), (snap) => {
    if (snap.exists()) {
      callback(snap.data() as PricingSettings);
    }
  });
}
