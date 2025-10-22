
import type { Metadata } from 'next';
import './globals.css';
import 'leaflet/dist/leaflet.css'; // side-effect import for map styles
import { AppInitializer } from '@/components/layout/AppInitializer';

// Default metadata - can be overridden by DynamicHeadElementsSetter
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('unhandledrejection', function(event) {
                if (event.reason && typeof event.reason.message === 'string' && event.reason.message.toLowerCase().includes('permission error')) {
                  console.warn('[Early Handler] Unhandled Rejection (Permission Error). Attempting to prevent default. Reason:', event.reason);
                  event.preventDefault();
                }
              });
              window.addEventListener('error', function(event) {
                if (typeof event.message === 'string' && event.message.toLowerCase().includes('permission error')) {
                    console.warn('[Early Handler] Error Event (Permission Error). Attempting to prevent default. Message:', event.message);
                    event.preventDefault();
                }
              });
            `,
          }}
        />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning={true}>
        <AppInitializer>{children}</AppInitializer>
      </body>
    </html>
  );
}
