
"use client";

import type { User as FirebaseUser } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import type { ReactNode } from "react";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  // Add 'role' if you have role-based access
  role?: "client" | "admin"; 
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<any>; // Replace 'any' with actual Firebase sign-in response type
  signUp: (email: string, pass: string) => Promise<any>; // Replace 'any' with actual Firebase sign-up response type
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
        // In a real app, you might fetch user role from Firestore here
        const appUser: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          // Mock role based on email for example, or fetch from DB
          role: firebaseUser.email?.includes("admin") ? "admin" : "client",
        };
        setUser(appUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    // This is a placeholder. Implement actual Firebase sign-in
    // For example: import { signInWithEmailAndPassword } from "firebase/auth";
    // await signInWithEmailAndPassword(auth, email, pass);
    console.log("signIn placeholder", email, pass);
    // Mock successful login
    const mockUser: User = { uid: 'mock-uid', email, displayName: 'Mock User', role: email.includes('admin') ? 'admin' : 'client' };
    setUser(mockUser); 
    if (mockUser.role === 'admin') {
      router.push('/admin/dashboard');
    } else {
      router.push('/client/dashboard');
    }
  };

  const signUp = async (email: string, pass: string) => {
    // This is a placeholder. Implement actual Firebase sign-up
    // For example: import { createUserWithEmailAndPassword } from "firebase/auth";
    // await createUserWithEmailAndPassword(auth, email, pass);
    console.log("signUp placeholder", email, pass);
     // Mock successful signup
    const mockUser: User = { uid: 'mock-uid-new', email, displayName: 'New User', role: 'client' };
    setUser(mockUser);
    router.push('/client/dashboard');
  };
  
  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    router.push("/auth/login");
  };


  // Redirect logic
  useEffect(() => {
    if (!loading && !user) {
      const publicPaths = ["/", "/auth/login", "/auth/register"];
      const isPublicPath = publicPaths.some(p => pathname === p || (p === "/" && pathname.startsWith("/#"))); // Allow hash links on landing
      if (!isPublicPath) {
        router.push("/auth/login");
      }
    }
    if (!loading && user) {
      if (pathname.startsWith('/auth/')) { // If logged in and on auth page, redirect
        router.push(user.role === 'admin' ? '/admin/dashboard' : '/client/dashboard');
      } else if (user.role === 'client' && pathname.startsWith('/admin')) {
        router.push('/client/dashboard'); // Client trying to access admin
      } else if (user.role === 'admin' && pathname.startsWith('/client')) {
        router.push('/admin/dashboard'); // Admin trying to access client
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
