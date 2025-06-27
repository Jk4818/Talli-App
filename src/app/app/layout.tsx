'use client';

import { useAuth } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { AppHeader } from '@/components/app/AppHeader';
import { Skeleton } from '@/components/ui/skeleton';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If auth state is not loading and no user, redirect to login page.
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // While auth state is loading or if there's no user (and redirection is imminent)
  if (loading || !user) {
    return (
        <div className="flex flex-col min-h-dvh">
            {/* Skeleton for Header */}
            <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-8 w-48 hidden sm:block" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                </div>
            </header>
            {/* Skeleton for main content area */}
            <main className="flex-1 flex flex-col bg-secondary/50 p-4 md:p-8">
                <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <Skeleton className="h-64 lg:col-span-1" />
                        <Skeleton className="h-64 lg:col-span-2" />
                    </div>
                    <Skeleton className="h-96 w-full" />
                </div>
                 {/* Skeleton for footer */}
                <footer className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
                    <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                        <Skeleton className="h-10 w-24" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                </footer>
            </main>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-dvh">
      <AppHeader />
      <main className="flex-1 flex flex-col bg-secondary/50">
        {children}
      </main>
    </div>
  );
}
