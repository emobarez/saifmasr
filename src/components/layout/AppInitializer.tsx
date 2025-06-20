
"use client";

import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/AuthContext';
import { DynamicHeadElementsSetter } from '@/components/layout/DynamicTitleSetter';
import { ThemeApplicator } from '@/components/layout/ThemeApplicator';
import { useState, useEffect } from 'react';
import { app, initializeAnalytics } from '@/lib/firebase';
import ErrorBoundary from '@/components/layout/ErrorBoundary'; // Import the ErrorBoundary

export function AppInitializer({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [appMounted, setAppMounted] = useState(false);

  useEffect(() => {
    setAppMounted(true);
    if (app) {
      const initAnalyticsAsync = async () => {
        try {
          const analytics = await initializeAnalytics(app);
          if (analytics) {
            console.log("Firebase Analytics instance is ready in AppInitializer.");
          }
        } catch (error) {
          console.error("Failed to initialize analytics from AppInitializer:", error);
        }
      };
      initAnalyticsAsync();
    } else {
      console.warn("Firebase app instance not available in AppInitializer, skipping analytics init.");
    }

    // Global Unhandled Promise Rejection Handler
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.warn("Global Unhandled Promise Rejection Caught in AppInitializer:", event.reason);
      if (event.reason && (typeof event.reason.message === 'string' && event.reason.message.toLowerCase().includes('permission error'))) {
        console.warn(
          "This unhandled rejection appears to be a 'permission error', possibly from a browser extension. " +
          "The application's global handler has caught it and will attempt to prevent default browser handling."
        );
        event.preventDefault(); // Attempt to prevent default handling for this specific error
      }
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
    <ErrorBoundary fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif' }}><p>Loading application...</p></div>}>
      <AuthProvider>
        <ThemeApplicator />
        <DynamicHeadElementsSetter />
        {children}
        <Toaster />
      </AuthProvider>
    </ErrorBoundary>
  );
}
