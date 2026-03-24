import { Timestamp } from "firebase/firestore";

export type UserStatus = "active" | "suspended" | "deleted";
export type CardType = "mastercard" | "visa" | "verve";

export interface User {
  uid: string;

  // Personal info
  surname: string;
  otherName: string;
  email: string;
  phone: string; // "+234XXXXXXXXXX"
  countryCode: string; // "NG"
  profilePhotoUrl: string | null;

  // Referral
  referralCode: string; // unique, auto-generated e.g. "JOHN1A2B"
  referralCredits: number; // in kobo

  // Auth state
  isPhoneVerified: boolean;
  isEmailVerified: boolean;

  // Account status
  status: UserStatus;

  // Push notifications
  fcmTokens: string[];

  // Notification preferences
  notifyPush: boolean;
  notifyEmail: boolean;
  notifySms: boolean;
  notifyNewsletter: boolean;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SavedAddress {
  id: string;
  label: string; // "Home", "Office"
  street: string;
  city: string;
  state: string;
  postcode: string;
  location: {
    latitude: number;
    longitude: number;
  };
  isDefault: boolean;
  createdAt: Timestamp;
}

export interface PaymentMethod {
  id: string;
  type: CardType;
  last4: string; // "4242"
  expiryMonth: number; // 1-12
  expiryYear: number; // e.g. 2027
  cardholderName: string;
  bank: string; // "GTBank"

  // Paystack fields
  paystackAuthorizationCode: string;
  paystackSignature: string;
  paystackBin: string;

  isPrimary: boolean;
  createdAt: Timestamp;
}
