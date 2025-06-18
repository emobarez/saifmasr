
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // Added Firebase Storage

// Check for essential keys before forming the config object
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!apiKey || !authDomain || !projectId) {
  console.error("CRITICAL FIREBASE CONFIG ERROR: One or more essential Firebase environment variables (NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID) are missing.");
  console.error("This is likely the cause of 'auth/invalid-api-key' errors during build.");
  console.error("Please ensure these are correctly set in your Netlify build environment variables.");
  // Note: Firebase will still attempt to initialize below and will likely throw an error,
  // but this log provides an earlier, more specific warning.
}

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig: FirebaseOptions = {
  apiKey: apiKey, // Will be undefined if env var is missing
  authDomain: authDomain, // Will be undefined if env var is missing
  projectId: projectId, // Will be undefined if env var is missing
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
// Variables to hold Firebase services
let app;
let authInstance;
let dbInstance;
let storageInstance;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  authInstance = getAuth(app);
  dbInstance = getFirestore(app);
  storageInstance = getStorage(app); // Initialized Firebase Storage
} catch (error) {
  console.error("Firebase SDK initialization failed directly in firebase.ts. This is a critical error, likely due to missing or invalid Firebase config environment variables in your build environment.", error);
  // Re-throw the error to ensure the build process fails clearly if Firebase is essential.
  // If the build process relies on Firebase (e.g., for prerendering pages that use Firebase),
  // this failure is expected and indicates the environment config issue.
  throw error;
}

export { app, authInstance as auth, dbInstance as db, storageInstance as storage };
