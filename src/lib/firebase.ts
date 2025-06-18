
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getAnalytics, type Analytics, isSupported as isAnalyticsSupported } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyA6jyoz9UWvmRJgckYnSMsc825mpyQlpIU",
  authDomain: "saif-masr.firebaseapp.com",
  projectId: "saif-masr",
  storageBucket: "saif-masr.firebasestorage.app", // Double-check this value. Firebase Storage buckets usually end with '.appspot.com'.
  messagingSenderId: "738970444904",
  appId: "1:738970444904:web:9b26e803c50abbacad07dd",
  measurementId: "G-27Q0JSGQVL"
};

let app: FirebaseApp;
let authInstance: Auth;
let dbInstance: Firestore;
let storageInstance: FirebaseStorage;
let analyticsInstance: Analytics | undefined; // Initialize as undefined

// Initialize Firebase
// Check if Firebase has already been initialized to avoid re-initialization errors
if (getApps().length === 0) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (error) {
    console.error("CRITICAL FIREBASE INIT ERROR:", error);
    // If app initialization fails, subsequent Firebase service initializations will also fail.
    // Gracefully handle this by ensuring service instances remain undefined or are set to a non-functional state.
    // @ts-ignore
    app = undefined; 
  }
} else {
  app = getApp(); // Use the already initialized app
}

// Initialize Firebase services only if 'app' was successfully initialized
if (app) {
  try {
    authInstance = getAuth(app);
  } catch (error) {
    console.error("CRITICAL FIREBASE AUTH INIT ERROR:", error);
    // @ts-ignore
    authInstance = undefined;
  }

  try {
    dbInstance = getFirestore(app);
  } catch (error) {
    console.error("CRITICAL FIREBASE FIRESTORE INIT ERROR:", error);
    // @ts-ignore
    dbInstance = undefined;
  }

  try {
    storageInstance = getStorage(app);
  } catch (error) {
    console.error("CRITICAL FIREBASE STORAGE INIT ERROR:", error);
    // @ts-ignore
    storageInstance = undefined;
  }

  // Conditionally initialize Analytics only on the client-side
  if (typeof window !== 'undefined') {
    isAnalyticsSupported().then((supported) => {
      if (supported) {
        try {
          analyticsInstance = getAnalytics(app);
        } catch (error) {
          console.error("Firebase Analytics Init Error (client-side):", error);
          analyticsInstance = undefined;
        }
      } else {
        console.warn("Firebase Analytics is not supported in this environment.");
        analyticsInstance = undefined;
      }
    }).catch(error => {
        console.error("Error checking Analytics support:", error);
        analyticsInstance = undefined;
    });
  } else {
    // Server-side or environment where window is not defined
    analyticsInstance = undefined; 
  }

} else {
  // If app failed to initialize, ensure all service instances are undefined
  console.error("Firebase app failed to initialize. All Firebase services will be unavailable.");
  // @ts-ignore
  authInstance = undefined;
  // @ts-ignore
  dbInstance = undefined;
  // @ts-ignore
  storageInstance = undefined;
  analyticsInstance = undefined;
}

export { app, authInstance as auth, dbInstance as db, storageInstance as storage, analyticsInstance as analytics };
