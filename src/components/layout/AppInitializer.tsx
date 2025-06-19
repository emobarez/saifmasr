
"use client";

import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/AuthContext';
import { DynamicHeadElementsSetter } from '@/components/layout/DynamicTitleSetter';
import { ThemeApplicator } from '@/components/layout/ThemeApplicator';
import { ClientOnly } from '@/components/layout/ClientOnly';
import { useState, useEffect } from 'react';

export function AppInitializer({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [appMounted, setAppMounted] = useState(false);

  useEffect(() => {
    setAppMounted(true);
  }, []);

  if (!appMounted) {
    // Render nothing or a very simple global loader until mounted.
    // This helps ensure server and initial client render are consistent
    // for the parts managed by AppInitializer.
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
