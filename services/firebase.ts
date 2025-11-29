import * as firebaseApp from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import * as firebaseAnalytics from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDoX-RsMVtlBEMyQqSuR2KLjyVXKD1nqL0",
  authDomain: "sh4mani4k.firebaseapp.com",
  projectId: "sh4mani4k",
  storageBucket: "sh4mani4k.firebasestorage.app",
  messagingSenderId: "634411208599",
  appId: "1:634411208599:web:c5db017a257c51b3e6bed2",
  measurementId: "G-50NJ577W18"
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