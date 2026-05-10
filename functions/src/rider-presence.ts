import { logger } from "firebase-functions";
import { onValueWritten } from "firebase-functions/v2/database";
import admin, { firestore } from "./admin";

/**
 * Mirrors RTDB rider presence into Firestore.
 *
 * The rider client writes /status/{uid} with { state: "online" | "offline" }.
 * RTDB onDisconnect handles socket loss (force-quit, network drop, OS suspend),
 * giving us reliable offline detection within ~30s.
 *
 * This function propagates that into riders/{uid}.isOnline so customer queries
 * (which filter by isOnline) immediately see the change. We deliberately do NOT
 * touch isAvailable — that field is owned by the order-acceptance flow during
 * deliveries, and an offline isOnline is enough to hide the rider from
 * getNearbyRiders.
 */
export const mirrorRiderPresence = onValueWritten(
  { ref: "/status/{uid}" },
  async (event) => {
    const uid = event.params.uid;
    const after = event.data.after.val() as
      | { state?: "online" | "offline" }
      | null;
    const isOnline = after?.state === "online";

    try {
      const riderRef = firestore.collection("riders").doc(uid);

      // Debounce: brief network blips cause flapping (offline→online→offline...)
      // — skip the Firestore write if the value already matches. Saves writes
      // and reduces noise for any downstream onSnapshot listeners.
      const snap = await riderRef.get();
      if (!snap.exists) {
        logger.warn("mirrorRiderPresence: rider doc missing", { uid });
        return;
      }
      if (snap.data()?.isOnline === isOnline) return;

      await riderRef.update({
        isOnline,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (err) {
      logger.warn("mirrorRiderPresence: failed to update rider doc", {
        uid,
        isOnline,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },
);
