"use client";

import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/AuthContext';
import { DynamicHeadElementsSetter } from '@/components/layout/DynamicTitleSetter';
import { ThemeApplicator } from '@/components/layout/ThemeApplicator';
import { SessionProvider } from "next-auth/react";
import { useState, useEffect } from 'react';
import ErrorBoundary from '@/components/layout/ErrorBoundary';

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
    return null;
  }

  return (
    <ErrorBoundary>
      <SessionProvider>
        <AuthProvider>
          <DynamicHeadElementsSetter />
          <ThemeApplicator />
          {children}
          <Toaster />
        </AuthProvider>
      </SessionProvider>
    </ErrorBoundary>
  );
}