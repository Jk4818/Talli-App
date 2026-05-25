import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ReduxProvider } from '@/lib/redux/provider';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/lib/firebase/auth';
import { SpeedInsights } from "@vercel/speed-insights/next"
import { UIStateInitializer } from '@/components/UIStateInitializer';
import { Analytics } from '@vercel/analytics/react';
import { ThemeProvider } from 'next-themes';

/**
 * Viewport config — kept separate from metadata per Next.js 14 convention.
 *
 * `interactiveWidget: 'resizes-content'` tells Android Chrome 108+ to shrink
 * the *layout* viewport (not just the visual viewport) when the software
 * keyboard opens. This means `dvh` units, flexbox heights, and
 * `position: fixed; bottom: 0` elements all adapt automatically — the
 * keyboard pushes the whole layout up rather than overlaying it.
 *
 * iOS ignores this value entirely (WebKit always overlays the keyboard);
 * iOS keyboard handling is done per-component via `useIosKeyboardInset`.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  interactiveWidget: 'resizes-content',
};

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
