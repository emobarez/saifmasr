"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut, getSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

interface User {
  id: string;
  email: string | null;
  name: string | null;
  role?: "CLIENT" | "ADMIN"; 
  image?: string | null; 
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
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (name: string, email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_SETTINGS = {
  maintenanceMode: false,
  portalName: "سيف مصر الوطنية للأمن",
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status, update } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(DEFAULT_SETTINGS);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const loading = status === "loading";

  useEffect(() => {
    console.log("=== SESSION EFFECT ===")
    console.log("Session data:", session)
    console.log("Session status:", status)
    console.log("Session user:", session?.user)
    
    if (session?.user) {
      setUser({
        id: session.user.id,
        email: session.user.email || null,
        name: session.user.name || null,
        role: session.user.role as "CLIENT" | "ADMIN",
        image: session.user.image || null,
      });
    } else {
      setUser(null);
    }
  }, [session]);

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoadingSettings(true);
        // In a real implementation, you would fetch from your database
        // For now, using defaults
        setSettings(DEFAULT_SETTINGS);
      } catch (error) {
        console.error("Error loading settings:", error);
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setIsLoadingSettings(false);
      }
    };

    loadSettings();
  }, []);

  // Navigation logic
  useEffect(() => {
    // Skip navigation during loading states
    if (loading || isLoadingSettings) {
      return;
    }

    const publicPaths = ["/", "/auth/login", "/auth/register", "/services", "/test-user"];
    const maintenancePath = "/maintenance";
    const isPublicPath = publicPaths.some(p => pathname === p || pathname.startsWith("/services/"));
    const isMaintenancePath = pathname === maintenancePath;
    const isAuthPath = pathname === "/auth/login" || pathname === "/auth/register";

    console.log('Navigation logic:', { 
      user: !!user, 
      userEmail: user?.email,
      userRole: user?.role,
      pathname, 
      sessionStatus: status,
      isPublicPath,
      isAuthPath
    });

    // Defensive role inference: if authenticated but role missing, infer ADMIN for known admin email
    if (status === 'authenticated' && user && !user.role && user.email === 'admin@saifmasr.com') {
      console.warn('Role missing on session user; inferring ADMIN based on email');
      const inferred: User = { ...user, role: 'ADMIN' } as User;
      setUser(inferred);
      // proceed after setting
      setTimeout(() => {
        router.replace('/admin/dashboard');
      }, 50);
      return;
    }

    // Maintenance mode handling
    if (settings?.maintenanceMode && !isMaintenancePath) {
      if (user?.role !== 'ADMIN') {
        router.replace(maintenancePath);
        return;
      }
    }

    // Handle authenticated users on auth pages
    if (user && status === 'authenticated' && isAuthPath) {
      const targetPath = user.role === "ADMIN" ? "/admin/dashboard" : "/client/dashboard";
      console.log(`Redirecting authenticated ${user.role} from ${pathname} to ${targetPath}`);
      router.replace(targetPath);
      return;
    }

    // Handle unauthenticated users on protected pages
    if (!user && status === 'unauthenticated' && !isPublicPath && !isMaintenancePath) {
      console.log(`Redirecting unauthenticated user from ${pathname} to login`);
      router.replace("/auth/login");
      return;
    }

    // Role-based access control (only for authenticated users)
    if (user && status === 'authenticated' && user.role) {
      if (pathname.startsWith("/admin") && user.role !== "ADMIN") {
        console.log('Redirecting non-admin from admin area');
        router.replace("/client/dashboard");
        return;
      }

      if (pathname.startsWith("/client") && user.role !== "CLIENT") {
        console.log('Redirecting non-client from client area');
        router.replace("/admin/dashboard");
        return;
      }
    }
  }, [user, status, settings?.maintenanceMode, pathname, router, loading, isLoadingSettings]);

  const signIn = async (email: string, password: string) => {
    try {
      const result = await nextAuthSignIn("credentials", {
        email,
        password,
        redirect: false,
      });
      
      if (result?.ok) {
        // Force session update and wait for it
        await update();
        // Fallback: fetch the latest session explicitly then redirect immediately
        try {
          const freshSession = await getSession();
          console.log('Post-login fresh session:', freshSession);
          const role = (freshSession?.user as any)?.role;
          if (role) {
            const targetPath = role === 'ADMIN' ? '/admin/dashboard' : '/client/dashboard';
            console.log('Manual redirect after login to', targetPath);
            router.replace(targetPath);
          } else {
            // Force a provisional ADMIN role for known admin email so user can proceed
            if (email === 'admin@saifmasr.com') {
              console.warn('No role on session; provisioning temporary ADMIN role for admin email');
              setUser({
                id: (freshSession?.user as any)?.id || 'temp-admin-id',
                email: 'admin@saifmasr.com',
                name: (freshSession?.user as any)?.name || 'Administrator',
                role: 'ADMIN',
                image: (freshSession?.user as any)?.image || null,
              });
              router.replace('/admin/dashboard');
            } else {
              console.warn('Login succeeded but no role found on session.user; will rely on AuthContext effect. Session:', freshSession);
            }
          }
        } catch (e) {
          console.warn('Failed to fetch fresh session after login:', e);
        }
      }
      
      return result;
    } catch (error) {
      console.error('SignIn error:', error);
      throw error;
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    try {
      // Create user in database via API route
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      if (!response.ok) {
        throw new Error("Registration failed");
      }

      // Auto sign in after registration
      return await signIn(email, password);
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const signOut = async () => {
    await nextAuthSignOut({ redirect: false });
    router.push("/auth/login");
  };

  const contextValue: AuthContextType = {
    user,
    loading,
    settings,
    isLoadingSettings,
    signIn,
    signUp,
    signOut,
    setUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};