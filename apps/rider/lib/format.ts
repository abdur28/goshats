import { Timestamp } from "firebase/firestore";

/**
 * Safely converts any timestamp-like value to a Date.
 * Handles Firestore Timestamp, plain objects with `seconds`, Date, and numbers.
 * Returns null for falsy or unrecognised input.
 */
export function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === "object" && "seconds" in (value as object)) {
    return new Date((value as { seconds: number }).seconds * 1000);
  }
  if (typeof value === "number") return new Date(value);
  return null;
}

export function formatNaira(kobo: number): string {
  const naira = kobo / 100;
  return `\u20A6${naira.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(
  value: Timestamp | Date | number,
  options?: Intl.DateTimeFormatOptions
): string {
  let date: Date;
  if (value instanceof Timestamp) {
    date = value.toDate();
  } else if (value instanceof Date) {
    date = value;
  } else {
    date = new Date(value);
  }

  return date.toLocaleDateString(
    "en-NG",
    options ?? { year: "numeric", month: "short", day: "numeric" }
  );
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)} sec`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} mins`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.round((seconds % 3600) / 60);
  return mins > 0 ? `${hours} hr ${mins} mins` : `${hours} hr`;
}

export function formatPhone(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\s/g, "");
  if (cleaned.startsWith("+234") && cleaned.length === 14) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 10)} ${cleaned.slice(10)}`;
  }
  return phone;
}
