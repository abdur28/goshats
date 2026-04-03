import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK (singleton)
if (!admin.apps.length) {
  admin.initializeApp();
}

export default admin;
export const firestore = admin.firestore();
