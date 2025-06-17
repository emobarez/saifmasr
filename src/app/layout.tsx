import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/AuthContext';
import { DynamicHeadElementsSetter } from '@/components/layout/DynamicTitleSetter'; // Corrected import path
import { ThemeApplicator } from '@/components/layout/ThemeApplicator';

export const metadata: Metadata = {
  title: 'سيف مصر الوطنية للأمن', // Default title, will be updated client-side
  description: 'بوابة شاملة لخدمات سيف مصر الوطنية للأمن',
  // Note: Favicon defined in public/favicon.ico will be used by default if no dynamic one is set.
  // Or, you can add a default static link here:
  // icons: {
  //   icon: '/favicon.ico', // Or your default favicon path
  // },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Poppins for headlines, Inter for body */}
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning={true}>
        <AuthProvider>
          <ThemeApplicator />
          <DynamicHeadElementsSetter />
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
