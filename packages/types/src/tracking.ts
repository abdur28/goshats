import { Timestamp } from "firebase/firestore";

export interface TrackingPoint {
  id: string;
  location: {
    latitude: number;
    longitude: number;
  };
  headingDegrees: number; // 0-360
  speedKmh: number;
  timestamp: Timestamp;
}
