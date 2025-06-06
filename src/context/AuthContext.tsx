
"use client";

import type { User as FirebaseUser } from "firebase/auth";
import { auth, db } from "@/lib/firebase"; // Added db
import { doc, getDoc } from "firebase/firestore"; // Added Firestore imports
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
}

interface AppSettings {
  maintenanceMode: boolean;
  portalName: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean; // Covers auth state loading
  settings: AppSettings | null;
  isLoadingSettings: boolean; // Specifically for settings loading
  signIn: (email: string, pass: string) => Promise<FirebaseUser>;
  signUp: (name: string, email: string, pass: string) => Promise<FirebaseUser>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Auth loading
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true); // Settings loading
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
          // Fallback to default settings if not found in Firestore
          setSettings({ maintenanceMode: false, portalName: "سيف مصر الوطنية للأمن" });
        }
      } catch (error) {
        console.error("Error fetching system settings:", error);
        // Fallback on error
        setSettings({ maintenanceMode: false, portalName: "سيف مصر الوطنية للأمن" });
      } finally {
        setIsLoadingSettings(false);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const appUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          role: firebaseUser.email?.includes("admin@saifmasr.com") || firebaseUser.email?.includes("admin@example.com") ? "admin" : "client",
        };
        setUser(appUser);
      } else {
        setUser(null);
      }
      setLoading(false); // Auth state is now determined
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string): Promise<FirebaseUser> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const firebaseUser = userCredential.user;
    const appUserRole = firebaseUser.email?.includes("admin@saifmasr.com") || firebaseUser.email?.includes("admin@example.com") ? "admin" : "client";
    const appUser: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        role: appUserRole,
    };
    // setUser(appUser); // Already handled by onAuthStateChanged

    await logActivity({
      actionType: "USER_LOGIN",
      description: `User ${appUser.email} logged in. Role: ${appUser.role}.`,
      actor: { id: appUser.uid, role: appUser.role, name: appUser.displayName },
    });

    // Redirection logic will be handled by the main useEffect
    return firebaseUser;
  };

  const signUp = async (name: string, email: string, pass: string): Promise<FirebaseUser> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const firebaseUser = userCredential.user;
    await updateProfile(firebaseUser, { displayName: name });
    
    const appUser: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: name, 
        role: 'client', 
    };
    // setUser(appUser); // Already handled by onAuthStateChanged

    await logActivity({
      actionType: "USER_REGISTERED",
      description: `New user registered: ${appUser.email}. Name: ${appUser.displayName}.`,
      actor: { id: appUser.uid, role: appUser.role, name: appUser.displayName },
    });
    
    // Redirection logic will be handled by the main useEffect
    return firebaseUser;
  };
  
  const signOut = async () => {
    if (user) { 
      await logActivity({
        actionType: "USER_LOGOUT",
        description: `User ${user.email} logged out.`,
        actor: { id: user.uid, role: user.role, name: user.displayName },
      });
    }
    await firebaseSignOut(auth);
    // setUser(null); // Handled by onAuthStateChanged
    router.push("/auth/login");
  };

  useEffect(() => {
    if (loading || isLoadingSettings) return; // Wait for both auth and settings to load

    const publicPaths = ["/", "/auth/login", "/auth/register", "/services"];
    const maintenancePath = "/maintenance";
    const isPublicPath = publicPaths.some(p => pathname === p || (p === "/" && pathname.startsWith("/#")));
    const isMaintenancePath = pathname === maintenancePath;

    if (settings?.maintenanceMode) {
      if (user?.role === 'admin') {
        // Admin can access everything
        if (isMaintenancePath) router.push('/admin/dashboard'); // If admin lands on maintenance, redirect to dashboard
      } else if (isMaintenancePath) {
        // Non-admin or unauth on maintenance page is fine
      } else {
        // Everyone else (non-admin logged in, or unauthenticated not on a public/maintenance page)
        router.push(maintenancePath);
      }
      return; // Maintenance mode logic takes precedence
    }

    // --- Regular redirection logic (maintenance mode is OFF) ---
    if (!user && !isPublicPath && !isMaintenancePath) {
      router.push("/auth/login");
    } else if (user) {
      const userRole = user.role;
      // If user is logged in and tries to access auth pages, redirect them to their dashboard
      if (pathname.startsWith('/auth/')) {
        router.push(userRole === 'admin' ? '/admin/dashboard' : '/client/dashboard');
      } 
      // Role-based access control for admin/client areas
      else if (userRole === 'client' && pathname.startsWith('/admin')) {
        router.push('/client/dashboard');
      } else if (userRole === 'admin' && pathname.startsWith('/client')) {
        router.push('/admin/dashboard');
      }
    }
  }, [user, loading, settings, isLoadingSettings, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, loading, settings, isLoadingSettings, signIn, signOut, signUp }}>
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
