
import type { Metadata } from 'next';
import './globals.css';
import { AppInitializer } from '@/components/layout/AppInitializer';

export const metadata: Metadata = {
  title: 'سيف مصر الوطنية للأمن',
  description: 'بوابة شاملة لخدمات سيف مصر الوطنية للأمن',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning={true}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning={true}>
        <AppInitializer>{children}</AppInitializer>
      </body>
    </html>
  );
}
