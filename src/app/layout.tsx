import type { Metadata } from 'next';
import './globals.css';
import { ReduxProvider } from '@/lib/redux/provider';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/lib/firebase/auth';
import { SpeedInsights } from "@vercel/speed-insights/next"
import { UIStateInitializer } from '@/components/UIStateInitializer';
import { Analytics } from '@vercel/analytics/react';
import { ThemeProvider } from 'next-themes';

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
        {/* Space Grotesk — headlines, display, numerics */}
        {/* DM Sans — all body and UI text */}
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        {/*
          ThemeProvider config:
          - attribute="class"  — applies 'dark' class to <html> (Tailwind darkMode: ['class'])
          - defaultTheme="system" — respects OS preference on first visit (typically light)
          - enableSystem — watches prefers-color-scheme media query
          - disableTransitionOnChange — prevents colour flash during theme switch
        */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
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
        </ThemeProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
