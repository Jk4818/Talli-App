import type { Metadata } from 'next';
import './globals.css';
import { ReduxProvider } from '@/lib/redux/provider';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/lib/firebase/auth';
import { SpeedInsights } from "@vercel/speed-insights/next"
import { UIStateInitializer } from '@/components/UIStateInitializer';
import { Analytics } from '@vercel/analytics/react';

export const metadata: Metadata = {
  title: 'Talli - Effortless Bill Splitting',
  description: 'Upload receipts, assign items, and settle up with ease. Powered by AI.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <ReduxProvider>
            <UIStateInitializer>
              <TooltipProvider>
                {children}
                <Toaster />
              </TooltipProvider>
            </UIStateInitializer>
          </ReduxProvider>
        </AuthProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
