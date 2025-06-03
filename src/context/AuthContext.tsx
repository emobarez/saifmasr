
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
    const appUser: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        role: firebaseUser.email?.includes("admin@saifmasr.com") || firebaseUser.email?.includes("admin@example.com") ? "admin" : "client",
    };
    setUser(appUser);
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
        displayName: name, // Use the name from registration
        role: 'client', // New users default to client role
    };
    setUser(appUser);
    router.push('/client/dashboard'); // Redirect new users to client dashboard
    return firebaseUser;
  };
  
  const signOut = async () => {
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
