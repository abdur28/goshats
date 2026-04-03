/**
 * Encryption utility for sensitive bank account numbers
 * AES-256-CBC via crypto-js + expo-crypto for random IV generation
 *
 * Env var required: EXPO_PUBLIC_BANK_ENCRYPTION_KEY
 * Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

import CryptoJS from "crypto-js";
import * as Crypto from "expo-crypto";

const ENCRYPTION_KEY = process.env.EXPO_PUBLIC_BANK_ENCRYPTION_KEY;

function validateKey(): string {
  if (!ENCRYPTION_KEY) {
    throw new Error(
      "EXPO_PUBLIC_BANK_ENCRYPTION_KEY is not set. " +
        'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  if (ENCRYPTION_KEY.length !== 64) {
    throw new Error(
      `EXPO_PUBLIC_BANK_ENCRYPTION_KEY must be 64 hex characters (32 bytes). Got: ${ENCRYPTION_KEY.length}`
    );
  }
  return ENCRYPTION_KEY;
}

/**
 * Encrypt a plain-text string (e.g. account number) using AES-256-CBC.
 * Returns "ivHex:ciphertextHex"
 */
export function encryptAccountNumber(text: string): string {
  const key = validateKey();

  // Random 16-byte IV via expo-crypto
  const ivArray = new Uint8Array(16);
  Crypto.getRandomValues(ivArray);
  const ivHex = [...ivArray].map((b) => b.toString(16).padStart(2, "0")).join("");

  const iv = CryptoJS.enc.Hex.parse(ivHex);
  const keyWordArray = CryptoJS.enc.Hex.parse(key);

  const encrypted = CryptoJS.AES.encrypt(text, keyWordArray, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return iv.toString(CryptoJS.enc.Hex) + ":" + encrypted.ciphertext.toString(CryptoJS.enc.Hex);
}

/**
 * Decrypt a string produced by encryptAccountNumber.
 * Expects "ivHex:ciphertextHex"
 */
export function decryptAccountNumber(encryptedData: string): string {
  const key = validateKey();
  const parts = encryptedData.split(":");

  if (parts.length !== 2) {
    throw new Error('Invalid encrypted format. Expected "ivHex:ciphertextHex".');
  }

  const iv = CryptoJS.enc.Hex.parse(parts[0]);
  const keyWordArray = CryptoJS.enc.Hex.parse(key);
  const cipherParams = CryptoJS.lib.CipherParams.create({
    ciphertext: CryptoJS.enc.Hex.parse(parts[1]),
  });

  const decrypted = CryptoJS.AES.decrypt(cipherParams, keyWordArray, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return decrypted.toString(CryptoJS.enc.Utf8);
}

/**
 * Display-safe mask: shows only last 4 digits.
 * Works on both plain and encrypted strings — if encrypted, shows ****
 */
export function maskAccountNumber(accountNumber: string): string {
  if (!accountNumber || isEncrypted(accountNumber)) return "••••••••••";
  if (accountNumber.length < 4) return "••••";
  return "•".repeat(accountNumber.length - 4) + accountNumber.slice(-4);
}

/**
 * Returns true if the string looks like our "ivHex:ciphertextHex" format
 */
export function isEncrypted(text: string): boolean {
  const parts = text.split(":");
  return parts.length === 2 && parts[0].length === 32;
}

/**
 * Encrypt only if not already encrypted
 */
export function safeEncrypt(text: string): string {
  return isEncrypted(text) ? text : encryptAccountNumber(text);
}

/**
 * Decrypt only if encrypted; return plain text as-is
 */
export function safeDecrypt(text: string): string {
  return isEncrypted(text) ? decryptAccountNumber(text) : text;
}
