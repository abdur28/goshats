// Firebase config
export { app, db, auth, storage, functions } from "./config";

// Auth
export * from "./auth";

// Firestore services
export * from "./firestore";

// Storage
export {
  uploadProfilePhoto,
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
