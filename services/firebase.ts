import * as firebaseApp from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import * as firebaseAnalytics from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
// Using namespace import and cast to handle potential type definition mismatches
const app = (firebaseApp as any).initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Initialize Analytics safely
let analytics = null;
if (typeof window !== 'undefined' && (firebaseAnalytics as any).getAnalytics) {
  try {
    analytics = (firebaseAnalytics as any).getAnalytics(app);
  } catch (e) {
    console.warn("Firebase Analytics failed to initialize", e);
  }
}

// Initialize Firestore with the specific database ID 'timeline-alchemy'
const db = getFirestore(app, "timeline-alchemy");

// Initialize Storage with explicit bucket URL
const storage = getStorage(app, "gs://sh4mani4k.firebasestorage.app");

export { app, auth, analytics, db, storage, googleProvider };