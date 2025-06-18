
"use client";

import type { User as FirebaseUser } from "firebase/auth";
import { auth, db } from "@/lib/firebase"; 
import { doc, getDoc } from "firebase/firestore"; 
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import type { ReactNode } from "react";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { logActivity } from "@/lib/activityLogger";

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role?: "client" | "admin"; 
  photoURL?: string | null; 
}

interface AppSettings {
  maintenanceMode: boolean;
  portalName: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean; 
  settings: AppSettings | null;
  isLoadingSettings: boolean; 
  signIn: (email: string, pass: string) => Promise<FirebaseUser>;
  signUp: (name: string, email: string, pass: string) => Promise<FirebaseUser>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); 
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true); 
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoadingSettings(true);
      try {
        const settingsDocRef = doc(db, "systemSettings", "general");
        const docSnap = await getDoc(settingsDocRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data() as AppSettings);
        } else {
          setSettings({ maintenanceMode: false, portalName: "سيف مصر الوطنية للأمن" });
        }
      } catch (error) {
        console.error("Error fetching system settings:", error);
        setSettings({ maintenanceMode: false, portalName: "سيف مصر الوطنية للأمن" });
      } finally {
        setIsLoadingSettings(false);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    // Check if auth instance is available from firebase.ts
    if (!auth) {
      console.error("AuthContext: Firebase auth instance is not available. Firebase might not be configured correctly.");
      setLoading(false);
      // Potentially set user to null explicitly or handle error state
      setUser(null);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const appUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          role: firebaseUser.email?.includes("admin@saifmasr.com") || firebaseUser.email?.includes("admin@example.com") ? "admin" : "client",
          photoURL: firebaseUser.photoURL, 
        };
        setUser(appUser);
      } else {
        setUser(null);
      }
      setLoading(false); 
    });

    return () => unsubscribe();
  }, []); // Removed 'auth' from dependency array as its availability is checked above.

  const signIn = async (email: string, pass: string): Promise<FirebaseUser> => {
    if (!auth) throw new Error("Firebase auth is not initialized.");
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const firebaseUser = userCredential.user;
    const appUserRole = firebaseUser.email?.includes("admin@saifmasr.com") || firebaseUser.email?.includes("admin@example.com") ? "admin" : "client";
    const appUser: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        role: appUserRole,
        photoURL: firebaseUser.photoURL,
    };
    
    await logActivity({
      actionType: "USER_LOGIN",
      description: `User ${appUser.email} logged in. Role: ${appUser.role}.`,
      actor: { id: appUser.uid, role: appUser.role, name: appUser.displayName },
    });
    return firebaseUser;
  };

  const signUp = async (name: string, email: string, pass: string): Promise<FirebaseUser> => {
    if (!auth) throw new Error("Firebase auth is not initialized.");
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const firebaseUser = userCredential.user;
    await updateProfile(firebaseUser, { displayName: name });
    
    const appUser: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: name, 
        role: 'client', 
        photoURL: firebaseUser.photoURL,
    };
    
    await logActivity({
      actionType: "USER_REGISTERED",
      description: `New user registered: ${appUser.email}. Name: ${appUser.displayName}.`,
      actor: { id: appUser.uid, role: appUser.role, name: appUser.displayName },
    });
    
    return firebaseUser;
  };
  
  const signOut = async () => {
    if (!auth) {
      console.warn("Firebase auth not initialized, cannot sign out properly through Firebase.");
      setUser(null); // Clear user state locally
      router.push("/auth/login");
      return;
    }
    if (user) { 
      await logActivity({
        actionType: "USER_LOGOUT",
        description: `User ${user.email} logged out.`,
        actor: { id: user.uid, role: user.role, name: user.displayName },
      });
    }
    await firebaseSignOut(auth);
    router.push("/auth/login");
  };

  useEffect(() => {
    if (loading || isLoadingSettings) return; 

    const publicPaths = ["/", "/auth/login", "/auth/register", "/services"];
    const maintenancePath = "/maintenance";
    const isPublicPath = publicPaths.some(p => pathname === p || (p === "/" && pathname.startsWith("/#")) || pathname.startsWith("/services/")); // Allow /services/[serviceId]
    const isMaintenancePath = pathname === maintenancePath;

    if (settings?.maintenanceMode) {
      if (user?.role === 'admin') {
        if (isMaintenancePath) router.push('/admin/dashboard'); 
      } else if (isMaintenancePath) {
      } else {
        router.push(maintenancePath);
      }
      return; 
    }

    if (!user && !isPublicPath && !isMaintenancePath) {
      router.push("/auth/login");
    } else if (user) {
      const userRole = user.role;
      if (pathname.startsWith('/auth/')) {
        router.push(userRole === 'admin' ? '/admin/dashboard' : '/client/dashboard');
      } 
      else if (userRole === 'client' && pathname.startsWith('/admin')) {
        router.push('/client/dashboard');
      } else if (userRole === 'admin' && pathname.startsWith('/client')) {
        router.push('/admin/dashboard');
      }
    }
  }, [user, loading, settings, isLoadingSettings, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, loading, settings, isLoadingSettings, signIn, signOut, signUp, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
