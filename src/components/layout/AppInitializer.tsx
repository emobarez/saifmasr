
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
      const initAnalytics = async () => {
        try {
          const analytics = await initializeAnalytics(app);
          if (analytics) {
            console.log("Firebase Analytics instance is ready in AppInitializer.");
          }
        } catch (error) {
          console.error("Failed to initialize analytics from AppInitializer:", error);
        }
      };
      initAnalytics();
    } else {
      console.warn("Firebase app instance not available in AppInitializer, skipping analytics init.");
    }

    // Global Unhandled Promise Rejection Handler
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.warn("Global Unhandled Promise Rejection Caught in AppInitializer:", event.reason);
      // Check if the error seems to be from an extension
      if (event.reason && (typeof event.reason.message === 'string' && event.reason.message.includes('permission error')) || (event.reason?.name === 'i' && event.reason?.code === 403)) {
        console.warn(
          "This unhandled rejection might be from a browser extension. " +
          "Your application has caught it to prevent a crash, but the underlying extension issue may persist."
        );
        // Optionally, you can prevent default behavior for specific errors you know are from extensions
        // event.preventDefault(); // Use with caution, might hide actual app issues if not specific enough
      }
      // For other unhandled rejections, you might still want them to bubble up or be reported to an error service
    };

    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleRejection);
    };
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
