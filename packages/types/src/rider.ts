import { Timestamp } from "firebase/firestore";

export type RiderTier = "standard" | "premium" | "express";
export type VehicleType = "motorcycle" | "bicycle" | "car" | "van";
export type RiderStatus = "pending" | "approved" | "suspended";

export interface Rider {
  uid: string;

  // Personal info
  surname: string;
  otherName: string;
  email: string;
  phone: string; // "+234XXXXXXXXXX"
  profilePhotoUrl: string | null;

  // Documents (legacy flat fields — new uploads use riders/{uid}/documents subcollection)
  identityDocumentUrl?: string | null;
  vehicleDocumentUrl?: string | null;

  // Vehicle
  vehicleType: VehicleType;
  vehiclePlate: string; // "ABJ2847"
  vehicleModel: string; // "Toyota Camry"
  vehicleColor: string;
  vehicleYear: number;

  // Real-time location
  currentLocation: {
    latitude: number;
    longitude: number;
  } | null;
  geohash: string | null;

  // Availability
  isOnline: boolean;
  isAvailable: boolean; // false when actively on a delivery

  // Single-device session enforcement: id of the device currently holding the
  // active session. If a rider signs in on a second device, the older session
  // detects the mismatch via its rider-doc listener and signs itself out.
  activeDeviceId?: string | null;

  // Account status
  status: RiderStatus;

  // Performance tier
  tier: RiderTier;

  // Aggregate stats
  totalTrips: number;
  totalEarningsKobo: number;         // Lifetime earnings
  withdrawableBalanceKobo: number;   // Amount to be payout (wallet balance)
  processingPayoutsKobo: number;     // To be payouts (locked in transit)
  completedPayoutsKobo: number;      // Payout amounts (lifetime withdrawn)
  averageRating: number; // 1.0-5.0
  totalRatings: number;

  // Push notifications
  fcmTokens: string[];

  // Notification preferences
  notifyPush?: boolean;
  notifyEmail?: boolean;
  notifySms?: boolean;
  notifyNewsletter?: boolean;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * riders/{uid}/payoutDetails/{id}
 * Bank accounts added by the rider for receiving earnings.
 * accountNumber is AES-256-CBC encrypted client-side before storage.
 */
export interface PayoutDetail {
  id: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;  // stored as "ivHex:ciphertextHex" — encrypted
  accountName: string;    // verified account name from Paystack /bank/resolve
  isPrimary: boolean;
  paystackRecipientCode?: string | null; // set by Cloud Function when payout is created
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * riders/{uid}/documents/{id}
 * Verification documents uploaded by the rider (ID, vehicle docs, insurance, etc.)
 * Stored in Firebase Storage under rider-documents/{uid}/
 */
export type RiderDocumentType =
  | "identity"        // Government-issued ID, NIN slip, Driver's licence
  | "vehicle_reg"     // Vehicle registration / licence
  | "insurance"       // Vehicle insurance certificate
  | "roadworthiness"  // Roadworthiness certificate
  | "other";          // Any other supporting document

export type RiderDocumentStatus = "pending" | "approved" | "rejected";

export interface RiderDocument {
  id: string;
  type: RiderDocumentType;
  label: string;              // human-readable e.g. "Driver's Licence"
  storageUrl: string;         // Firebase Storage download URL
  storagePath: string;        // Firebase Storage path (for deletion)
  status: RiderDocumentStatus;
  rejectionReason?: string | null; // set by admin when status = "rejected"
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * rider_payouts/{id}
 * Logs all automatic and manual payout transfers to the rider.
 * This is the financial ledger receipt equivalent for the rider's withdrawals.
 */
export type PayoutStatus = "processing" | "completed" | "failed";

export interface RiderPayout {
  id: string;
  riderId: string;
  orderId?: string | null; // Null if it was a manual bulk withdrawal
  amountKobo: number;
  status: PayoutStatus;
  paystackTransferCode?: string | null;
  paystackTransferReference?: string | null;
  failureReason?: string | null; // if status === 'failed'
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
