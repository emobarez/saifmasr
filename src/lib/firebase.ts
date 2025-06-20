
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getAnalytics, type Analytics, isSupported as isAnalyticsSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyA6jyoz9UWvmRJgckYnSMsc825mpyQlpIU",
  authDomain: "saif-masr.firebaseapp.com",
  projectId: "saif-masr",
  storageBucket: "saif-masr.appspot.com",
  messagingSenderId: "738970444904",
  appId: "1:738970444904:web:9b26e803c50abbacad07dd",
  measurementId: "G-27Q0JSGQVL"
};

let app: FirebaseApp | undefined;
let authInstance: Auth | undefined;
let dbInstance: Firestore | undefined;
let storageInstance: FirebaseStorage | undefined;
let _analyticsInstance: Analytics | undefined;

// Initialize Firebase App
if (getApps().length === 0) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (error) {
    console.error("CRITICAL FIREBASE APP INIT ERROR:", error);
    app = undefined; // Ensure app is undefined if init fails
  }
} else {
  app = getApp();
}

// Initialize individual Firebase services only if app initialized successfully
if (app) {
  try {
    authInstance = getAuth(app);
  } catch (error) {
    console.error("CRITICAL FIREBASE AUTH INIT ERROR:", error);
    authInstance = undefined;
  }

  try {
    dbInstance = getFirestore(app);
  } catch (error) {
    console.error("CRITICAL FIREBASE FIRESTORE INIT ERROR:", error);
    dbInstance = undefined;
  }

  try {
    storageInstance = getStorage(app);
  } catch (error) {
    console.error("CRITICAL FIREBASE STORAGE INIT ERROR:", error);
    storageInstance = undefined;
  }
  // Analytics will be initialized on demand via initializeAnalytics function
} else {
  console.error("Firebase app failed to initialize. All Firebase services (Auth, Firestore, Storage, Analytics) will be unavailable.");
  authInstance = undefined;
  dbInstance = undefined;
  storageInstance = undefined;
  _analyticsInstance = undefined;
}

export async function initializeAnalytics(currentApp: FirebaseApp): Promise<Analytics | undefined> {
  if (typeof window !== 'undefined' && !_analyticsInstance && currentApp) {
    try {
      const supported = await isAnalyticsSupported();
      if (supported) {
        _analyticsInstance = getAnalytics(currentApp);
        console.log("Firebase Analytics initialized successfully via explicit call.");
      } else {
        console.warn("Firebase Analytics is not supported in this environment.");
        _analyticsInstance = undefined;
      }
    } catch (error) {
      console.error("Error during explicit Firebase Analytics initialization:", error);
      _analyticsInstance = undefined;
    }
  }
  return _analyticsInstance;
}

export const getAnalyticsInstance = (): Analytics | undefined => _analyticsInstance;

// Export potentially undefined service instances
export { app, authInstance as auth, dbInstance as db, storageInstance as storage };
