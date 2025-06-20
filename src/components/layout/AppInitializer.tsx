
"use client";

import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/AuthContext';
import { DynamicHeadElementsSetter } from '@/components/layout/DynamicTitleSetter';
import { ThemeApplicator } from '@/components/layout/ThemeApplicator';
import { useState, useEffect } from 'react';
import { app, initializeAnalytics } from '@/lib/firebase';

export function AppInitializer({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [appMounted, setAppMounted] = useState(false);

  useEffect(() => {
    setAppMounted(true);
    if (app) {
      // Explicitly handle potential errors from initializeAnalytics
      const initAnalytics = async () => {
        try {
          const analytics = await initializeAnalytics(app);
          if (analytics) {
            console.log("Firebase Analytics instance is ready in AppInitializer.");
          }
        } catch (error) {
          console.error("Failed to initialize analytics from AppInitializer:", error);
          // This catch block prevents an unhandled promise rejection from analytics init
        }
      };
      initAnalytics();
    } else {
      console.warn("Firebase app instance not available in AppInitializer, skipping analytics init.");
    }
  }, []);

  if (!appMounted) {
    return null;
  }

  return (
    <AuthProvider>
      <ThemeApplicator />
      <DynamicHeadElementsSetter />
      {children}
      <Toaster />
    </AuthProvider>
  );
}
