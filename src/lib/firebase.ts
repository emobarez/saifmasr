
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore }
 from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage"; // Added Firebase Storage

// Check for essential keys before forming the config object
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
// measurementId is optional

let app: FirebaseApp | undefined = undefined;
let authInstance: Auth | undefined = undefined;
let dbInstance: Firestore | undefined = undefined;
let storageInstance: FirebaseStorage | undefined = undefined;

if (!apiKey || !authDomain || !projectId) {
  console.error("--------------------------------------------------------------------");
  console.error("CRITICAL FIREBASE CONFIG ERROR (firebase.ts):");
  console.error("One or more essential Firebase environment variables are missing from process.env:");
  if (!apiKey) console.error("  - NEXT_PUBLIC_FIREBASE_API_KEY is missing or undefined.");
  if (!authDomain) console.error("  - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is missing or undefined.");
  if (!projectId) console.error("  - NEXT_PUBLIC_FIREBASE_PROJECT_ID is missing or undefined.");
  console.error("Firebase SDK will NOT be initialized properly. Authentication, Firestore, and Storage will FAIL.");
  console.error("Ensure these environment variables are correctly set in your runtime environment (e.g., Netlify, Vercel, or Firebase Studio Preview settings if applicable, or .env.local for local dev).");
  console.error("--------------------------------------------------------------------");
} else {
  const firebaseConfig: FirebaseOptions = {
    apiKey: apiKey,
    authDomain: authDomain,
    projectId: projectId,
    storageBucket: storageBucket,
    messagingSenderId: messagingSenderId,
    appId: appId,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID // Optional
  };

  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }

    if (app) {
      authInstance = getAuth(app);
      dbInstance = getFirestore(app);
      storageInstance = getStorage(app);
    } else {
      // This case should ideally not be hit if initializeApp or getApp was called and didn't throw,
      // but as a safeguard.
      console.error("Firebase app object is undefined after initialization/getApp. SDK services will not be available.");
      authInstance = undefined;
      dbInstance = undefined;
      storageInstance = undefined;
    }
  } catch (error) {
    console.error("--------------------------------------------------------------------");
    console.error("Firebase SDK initialization failed directly in firebase.ts.");
    console.error("This is a critical error, likely due to invalid Firebase config values even if the environment variables were present, or a runtime issue with Firebase SDK itself.");
    console.error("Error details:", error);
    console.error("--------------------------------------------------------------------");
    // Explicitly set all instances to undefined on any initialization error
    app = undefined;
    authInstance = undefined;
    dbInstance = undefined;
    storageInstance = undefined;
  }
}

export { app, authInstance as auth, dbInstance as db, storageInstance as storage };

