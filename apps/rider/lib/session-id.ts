import * as Crypto from "expo-crypto";

let sessionId: string | null = null;

/**
 * Returns a stable per-process session id, generated lazily on first call.
 *
 * Used to enforce single-device sessions: each app launch generates one id
 * and writes it to riders/{uid}.activeDeviceId. The root layout listens to
 * the rider doc; if activeDeviceId no longer matches our session id (i.e.
 * the rider signed in on another device), we sign out.
 *
 * The id is intentionally NOT persisted across launches — a fresh launch
 * gets a new id, which is fine because the most recent launch should win.
 */
export function getSessionId(): string {
  if (!sessionId) {
    sessionId = Crypto.randomUUID();
  }
  return sessionId;
}
