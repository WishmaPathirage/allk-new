import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

export const firebaseConfig = {
  apiKey: "AIzaSyAVT6gEDDpB3VBLAKPj5WScoGRHmAjKG8U",
  authDomain: "al-lk-fed3e.firebaseapp.com",
  projectId: "al-lk-fed3e",
  storageBucket: "al-lk-fed3e.firebasestorage.app",
  messagingSenderId: "557107930416",
  appId: "1:557107930416:web:7011ef142f078f3dd854f5",
  measurementId: "G-SX8FNMV9GD"
};

const app = initializeApp(firebaseConfig);
getAnalytics(app);

// experimentalForceLongPolling works around Firebase SDK 12.x internal assertion
// bug triggered by `where('in', [...])` queries under React 19 StrictMode.
export const db      = initializeFirestore(app, { experimentalForceLongPolling: true });
export const storage = getStorage(app);
export const auth    = getAuth(app);
export default app;