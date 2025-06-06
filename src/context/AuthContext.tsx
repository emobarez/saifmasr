
"use client";

import type { User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
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

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<FirebaseUser>;
  signUp: (name: string, email: string, pass: string) => Promise<FirebaseUser>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

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
      setLoading(false);
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
    setUser(appUser);

    await logActivity({
      actionType: "USER_LOGIN",
      description: `User ${appUser.email} logged in. Role: ${appUser.role}.`,
      actor: { id: appUser.uid, role: appUser.role, name: appUser.displayName },
    });

    if (appUser.role === 'admin') {
      router.push('/admin/dashboard');
    } else {
      router.push('/client/dashboard');
    }
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
    setUser(appUser);

    await logActivity({
      actionType: "USER_REGISTERED",
      description: `New user registered: ${appUser.email}. Name: ${appUser.displayName}.`,
      actor: { id: appUser.uid, role: appUser.role, name: appUser.displayName },
    });

    router.push('/client/dashboard'); 
    return firebaseUser;
  };
  
  const signOut = async () => {
    if (user) { // Log before user object becomes null
      await logActivity({
        actionType: "USER_LOGOUT",
        description: `User ${user.email} logged out.`,
        actor: { id: user.uid, role: user.role, name: user.displayName },
      });
    }
    await firebaseSignOut(auth);
    setUser(null);
    router.push("/auth/login");
  };

  useEffect(() => {
    if (loading) return;

    const publicPaths = ["/", "/auth/login", "/auth/register"];
    const isPublicPath = publicPaths.some(p => pathname === p || (p === "/" && pathname.startsWith("/#")));

    if (!user && !isPublicPath) {
      router.push("/auth/login");
    } else if (user) {
      const userRole = user.role;
      if (pathname.startsWith('/auth/')) {
        router.push(userRole === 'admin' ? '/admin/dashboard' : '/client/dashboard');
      } else if (userRole === 'client' && pathname.startsWith('/admin')) {
        router.push('/client/dashboard');
      } else if (userRole === 'admin' && pathname.startsWith('/client')) {
        router.push('/admin/dashboard');
      }
    }
  }, [user, loading, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, signUp }}>
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

