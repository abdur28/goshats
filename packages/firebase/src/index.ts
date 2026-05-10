// Firebase config
export { app, db, rtdb, auth, storage, functions } from "./config";

// Auth
export * from "./auth";

// Firestore services
export * from "./firestore";

// Storage
export {
  uploadProfilePhoto,
  uploadRiderDocument,
  uploadDisputePhoto,
  deletePhoto,
} from "./storage";

// Messaging
export {
  requestNotificationPermission,
  saveFcmToken,
  removeFcmToken,
  setupNotificationHandler,
  addNotificationResponseListener,
} from "./messaging";
