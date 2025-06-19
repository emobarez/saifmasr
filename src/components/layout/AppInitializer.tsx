
"use client";

import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/AuthContext';
import { DynamicHeadElementsSetter } from '@/components/layout/DynamicTitleSetter';
import { ThemeApplicator } from '@/components/layout/ThemeApplicator';
import { ClientOnly } from '@/components/layout/ClientOnly';
import { useState, useEffect } from 'react';
import { app, initializeAnalytics } from '@/lib/firebase'; // Import app and initializeAnalytics

export function AppInitializer({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [appMounted, setAppMounted] = useState(false);

  useEffect(() => {
    setAppMounted(true);
    if (app) { // Check if the main Firebase app instance is available
      initializeAnalytics(app).then(analytics => {
        if (analytics) {
          // Analytics initialized, you could potentially use it here or set it in a context
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
      <ClientOnly>
        <ThemeApplicator />
        <DynamicHeadElementsSetter />
      </ClientOnly>
      {children}
      <Toaster />
    </AuthProvider>
  );
}
