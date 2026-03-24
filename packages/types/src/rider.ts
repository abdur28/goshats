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

  // Account status
  status: RiderStatus;

  // Performance tier
  tier: RiderTier;

  // Aggregate stats
  totalTrips: number;
  totalEarningsKobo: number;
  pendingEarningsKobo: number;
  averageRating: number; // 1.0-5.0
  totalRatings: number;

  // Push notifications
  fcmTokens: string[];

  createdAt: Timestamp;
  updatedAt: Timestamp;
}
