
"use client";

import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/AuthContext';
import { DynamicHeadElementsSetter } from '@/components/layout/DynamicTitleSetter';
import { ThemeApplicator } from '@/components/layout/ThemeApplicator';
// ClientOnly is no longer needed here for these specific components
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
      initializeAnalytics(app).then(analytics => {
        if (analytics) {
          console.log("Firebase Analytics instance is ready in AppInitializer.");
        }
      }).catch(error => {
        console.error("Failed to initialize analytics from AppInitializer:", error);
      });
    } else {
      console.warn("Firebase app instance not available in AppInitializer, skipping analytics init.");
    }
  }, []);

  if (!appMounted) {
    return null;
  }

  return (
    <AuthProvider>
      {/* Render ThemeApplicator and DynamicHeadElementsSetter directly */}
      {/* Their internal logic will wait for settings if needed */}
      <ThemeApplicator />
      <DynamicHeadElementsSetter />
      {children}
      <Toaster />
    </AuthProvider>
  );
}

