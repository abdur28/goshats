import { INACTIVITY_OFFLINE_MS } from "@/constants/app";
import { useAuthStore } from "@/store/auth-store";
import { useDeliveryStore } from "@/store/delivery-store";
import { rtdb } from "@goshats/firebase";
import {
  onDisconnect,
  onValue,
  ref,
  serverTimestamp,
  set,
} from "firebase/database";
import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

/**
 * Rider presence: writes /status/{uid} in RTDB.
 *
 * - On connection: registers onDisconnect to mark "offline" if the socket drops
 *   (force-quit, network loss, OS suspend).
 * - When effectively online (toggle on, OR active delivery): writes "online".
 * - When effectively offline: writes "offline" and cancels onDisconnect.
 * - When app backgrounds while online: starts a 30-min timer; on fire writes "offline".
 * - When app foregrounds: clears the timer; re-asserts the current effective state.
 *
 * Active-delivery exception: while the rider has an active order, presence is
 * forced "online" regardless of toggle state, and the inactivity timer is
 * suppressed. This guarantees the customer's live tracking map stays current
 * for the whole delivery — including after a force-quit + relaunch, where the
 * local toggle state is stale-false until reconciled.
 *
 * A small mirror Cloud Function propagates these writes into Firestore
 * `riders/{uid}.isOnline`, which is what customer queries filter on.
 */
export function usePresence() {
  const uid = useAuthStore((s) => s.user?.uid);
  const toggleOnline = useAuthStore((s) => s.riderProfile?.isOnline);
  const activeOrder = useDeliveryStore((s) => s.activeOrder);

  const isOnDelivery = !!activeOrder;
  const effectiveOnline = isOnDelivery || !!toggleOnline;

  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasOnlineBeforeBackgroundRef = useRef<boolean>(false);

  // Main presence effect — runs whenever uid or effectiveOnline changes
  useEffect(() => {
    if (!uid) return;
    const statusRef = ref(rtdb, `status/${uid}`);
    const connectedRef = ref(rtdb, ".info/connected");

    let cancelled = false;

    const unsubscribe = onValue(connectedRef, async (snap) => {
      if (cancelled) return;
      const isConnected = snap.val() === true;
      if (!isConnected) return;

      try {
        if (effectiveOnline) {
          // Register onDisconnect first, then mark online
          await onDisconnect(statusRef).set({
            state: "offline",
            lastChanged: serverTimestamp(),
          });
          await set(statusRef, {
            state: "online",
            lastChanged: serverTimestamp(),
          });
        } else {
          // Manual offline: cancel the auto-offline handler and write offline now
          await onDisconnect(statusRef).cancel();
          await set(statusRef, {
            state: "offline",
            lastChanged: serverTimestamp(),
          });
        }
      } catch {
        // Network errors are recoverable; next .info/connected fire will retry
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [uid, effectiveOnline]);

  // AppState inactivity timer — forces offline if backgrounded too long.
  // Suppressed during active deliveries so an in-progress trip is never
  // auto-offlined.
  useEffect(() => {
    if (!uid) return;
    const statusRef = ref(rtdb, `status/${uid}`);

    const handleChange = (state: AppStateStatus) => {
      if (state === "background" || state === "inactive") {
        if (effectiveOnline && !isOnDelivery) {
          wasOnlineBeforeBackgroundRef.current = true;
          if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
          }
          inactivityTimerRef.current = setTimeout(() => {
            set(statusRef, {
              state: "offline",
              lastChanged: serverTimestamp(),
            }).catch(() => {});
          }, INACTIVITY_OFFLINE_MS);
        }
      } else if (state === "active") {
        if (inactivityTimerRef.current) {
          clearTimeout(inactivityTimerRef.current);
          inactivityTimerRef.current = null;
        }
        if (wasOnlineBeforeBackgroundRef.current && effectiveOnline) {
          // Re-assert online in case the socket dropped while backgrounded
          set(statusRef, {
            state: "online",
            lastChanged: serverTimestamp(),
          }).catch(() => {});
        }
        wasOnlineBeforeBackgroundRef.current = false;
      }
    };

    const sub = AppState.addEventListener("change", handleChange);
    return () => {
      sub.remove();
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    };
  }, [uid, effectiveOnline, isOnDelivery]);
}
