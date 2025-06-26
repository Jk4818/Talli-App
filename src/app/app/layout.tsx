'use client';

import { useAuth } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If the auth state is not loading and there is no user, redirect to login.
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // While the auth state is loading, or if there's no user (and redirection is imminent),
  // show a skeleton screen. This prevents a flash of the login page or app content.
  if (loading || !user) {
    return (
        <div className="flex flex-col min-h-dvh bg-secondary/50">
            <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
                    <Skeleton className="h-8 w-32" />
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-8 w-24" />
                    </div>
                </div>
            </header>
            <main className="flex-1 py-8 px-4 container mx-auto">
                <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <Skeleton className="h-64 lg:col-span-1" />
                        <Skeleton className="h-64 lg:col-span-2" />
                    </div>
                    <Skeleton className="h-96 w-full" />
                </div>
            </main>
        </div>
    );
  }

  // If the user is authenticated, render the main application.
  return <>{children}</>;
}
