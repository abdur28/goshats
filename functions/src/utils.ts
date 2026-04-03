import { logger } from "firebase-functions";
import axios from "axios";
import * as crypto from "crypto";
import admin, { firestore } from "./admin";

// Expo Push Notification API endpoints
const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";
const EXPO_PUSH_RECEIPTS_ENDPOINT =
  "https://exp.host/--/api/v2/push/getReceipts";

// ── Notification Storage ────────────────────────────────────────────────────

/**
 * Store a notification in a user's or rider's notification subcollection.
 *
 * @param collectionName - "users" or "riders"
 * @param uid            - The recipient's UID
 * @param data           - Notification payload (id, title, body, type, data)
 */
export async function storeNotification(
  collectionName: "users" | "riders",
  uid: string,
  notificationData: {
    id: string;
    title: string;
    body: string;
    type: string;
    data?: Record<string, unknown>;
  }
): Promise<boolean> {
  try {
    const notificationRef = firestore
      .collection(collectionName)
      .doc(uid)
      .collection("notifications")
      .doc(notificationData.id);

    await notificationRef.set({
      ...notificationData,
      userId: uid,
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info("Notification stored", {
      collection: collectionName,
      uid,
      notificationId: notificationData.id,
      type: notificationData.type,
    });

    return true;
  } catch (error) {
    logger.error("Error storing notification:", error);
    return false;
  }
}

// ── Expo Push Notifications ─────────────────────────────────────────────────

/**
 * Check Expo push receipts to verify delivery.
 */
async function checkReceipts(ticketIds: string[]): Promise<void> {
  try {
    if (!ticketIds || ticketIds.length === 0) return;

    const response = await axios.post(
      EXPO_PUSH_RECEIPTS_ENDPOINT,
      { ids: ticketIds },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    const { data } = response;

    if (data.errors && data.errors.length > 0) {
      logger.error("Error checking push receipts", data.errors);
      return;
    }

    for (const [ticketId, receipt] of Object.entries(data.data) as [
      string,
      any,
    ][]) {
      if (receipt.status === "error") {
        logger.warn("Push receipt error", {
          ticketId,
          message: receipt.message,
          details: receipt.details,
        });

        if (receipt.details?.error === "DeviceNotRegistered") {
          logger.warn(
            "Device not registered — token should be cleaned up",
            { ticketId }
          );
        }
      }
    }
  } catch (error) {
    logger.error("Error checking push receipts:", error);
  }
}

/**
 * Send push notifications via Expo Push API.
 * Only sends to valid ExponentPushToken[...] tokens.
 */
export async function sendToExpo(
  tokens: string | string[],
  title: string,
  body: string,
  data: Record<string, unknown> = {},
  sound: string = "default",
  badge: number = 1
): Promise<{
  success: boolean;
  ticketIds?: string[];
  error?: string;
}> {
  try {
    const tokenArray = Array.isArray(tokens) ? tokens : [tokens];

    // Filter valid Expo push tokens
    const validTokens = tokenArray.filter(
      (token) =>
        typeof token === "string" && token.startsWith("ExponentPushToken[")
    );

    if (validTokens.length === 0) {
      logger.warn("No valid Expo push tokens provided");
      return { success: false, error: "No valid tokens" };
    }

    // Build messages
    const messages = validTokens.map((token) => ({
      to: token,
      title,
      body,
      data,
      sound,
      badge,
      _displayInForeground: true,
    }));

    const response = await axios.post(EXPO_PUSH_ENDPOINT, messages, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
      },
    });

    const { data: responseData } = response;

    if (responseData.errors && responseData.errors.length > 0) {
      logger.error("Expo Push API returned errors", responseData.errors);
      return { success: false, error: "Expo API errors" };
    }

    // Collect ticket IDs for receipt checking
    const ticketIds = responseData.data
      .filter((ticket: any) => ticket.status === "ok")
      .map((ticket: any) => ticket.id);

    // Log any ticket-level errors
    const ticketErrors = responseData.data.filter(
      (ticket: any) => ticket.status === "error"
    );
    if (ticketErrors.length > 0) {
      logger.warn("Some push tickets had errors", { ticketErrors });
    }

    // Check receipts after a delay for delivery confirmation
    if (ticketIds.length > 0) {
      setTimeout(async () => {
        await checkReceipts(ticketIds);
      }, 5000);
    }

    return { success: true, ticketIds };
  } catch (error: any) {
    logger.error("Error sending to Expo Push API:", error);
    return { success: false, error: error.message };
  }
}

// ── Encryption ──────────────────────────────────────────────────────────────

const BANK_ENCRYPTION_KEY = process.env.BANK_ENCRYPTION_KEY;

/**
 * Decrypt a bank account number encrypted with AES-256-CBC.
 * Format: "iv:encryptedData" (hex)
 */
export function decryptAccountNumber(encryptedData: string): string | null {
  if (!encryptedData) return null;

  // Already decrypted (no separator)
  if (!encryptedData.includes(":")) {
    logger.warn(
      "Account number appears to be unencrypted (no separator found)"
    );
    return encryptedData;
  }

  if (!BANK_ENCRYPTION_KEY) {
    logger.error("BANK_ENCRYPTION_KEY not set in environment");
    throw new Error("Bank encryption key not configured");
  }

  if (BANK_ENCRYPTION_KEY.length !== 64) {
    logger.error("BANK_ENCRYPTION_KEY must be 32 bytes (64 hex characters)");
    throw new Error("Invalid encryption key length");
  }

  try {
    const parts = encryptedData.split(":");
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format. Expected "iv:encryptedData"');
    }

    const iv = Buffer.from(parts[0], "hex");
    const encryptedText = parts[1];

    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      Buffer.from(BANK_ENCRYPTION_KEY, "hex"),
      iv
    );

    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error: any) {
    logger.error("Failed to decrypt account number:", error);
    throw new Error(`Failed to decrypt bank account number: ${error.message}`);
  }
}

/**
 * Helper to get push tokens for a user or rider.
 */
export async function getPushTokens(
  collectionName: "users" | "riders",
  uid: string
): Promise<string[]> {
  try {
    const doc = await firestore.collection(collectionName).doc(uid).get();
    if (!doc.exists) return [];
    const data = doc.data();
    return data?.fcmTokens || [];
  } catch (error) {
    logger.error("Error getting push tokens:", error);
    return [];
  }
}
