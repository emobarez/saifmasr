
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
  console.error("CRITICAL FIREBASE CONFIG ERROR:");
  console.error("One or more essential Firebase environment variables are missing:");
  if (!apiKey) console.error("  - NEXT_PUBLIC_FIREBASE_API_KEY is missing.");
  if (!authDomain) console.error("  - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is missing.");
  if (!projectId) console.error("  - NEXT_PUBLIC_FIREBASE_PROJECT_ID is missing.");
  console.error("Firebase SDK will NOT be initialized. Authentication and other Firebase services will FAIL.");
  console.error("This will likely cause 'auth/invalid-api-key' or other Firebase-related errors during build or runtime if your application attempts to use Firebase services.");
  console.error("Please ensure these environment variables are correctly set in your Netlify (or other hosting provider) build environment settings, or in your local .env file.");
  console.error("--------------------------------------------------------------------");
  // If building for production and critical keys are missing, it's better to hard fail if Firebase is essential.
  // However, for now, we'll let it proceed, and subsequent code using Firebase will fail.
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
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    authInstance = getAuth(app);
    dbInstance = getFirestore(app);
    storageInstance = getStorage(app);
  } catch (error) {
    console.error("--------------------------------------------------------------------");
    console.error("Firebase SDK initialization failed directly in firebase.ts.");
    console.error("This is a critical error, likely due to invalid Firebase config values even if the environment variables were present.");
    console.error("Error details:", error);
    console.error("--------------------------------------------------------------------");
    // Re-throw the error to ensure the build process fails clearly if Firebase is essential.
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
}

export { app, authInstance as auth, dbInstance as db, storageInstance as storage };

