'use client';

import { useAuth } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuSkeleton } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import AppSidebar from '@/components/app/AppSidebar';
import AppNavbar from '@/components/app/AppNavbar';

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
  // show a skeleton screen that matches the new app layout.
  if (loading || !user) {
    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader>
                    <Skeleton className="h-8 w-32" />
                </SidebarHeader>
                <SidebarContent className="p-2">
                    <SidebarMenu>
                       <SidebarMenuSkeleton showIcon />
                       <SidebarMenuSkeleton showIcon />
                       <SidebarMenuSkeleton showIcon />
                    </SidebarMenu>
                </SidebarContent>
            </Sidebar>
            <SidebarInset>
                <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:justify-end">
                    <Skeleton className="h-10 w-10 rounded-full" />
                </header>
                <main className="flex-1 p-4 md:p-8 overflow-auto bg-secondary/50">
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <Skeleton className="h-64 lg:col-span-1" />
                            <Skeleton className="h-64 lg:col-span-2" />
                        </div>
                        <Skeleton className="h-96 w-full" />
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
  }

  // If the user is authenticated, render the main application with the new sidebar layout.
  return (
    <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
            <AppNavbar />
            <div className="flex-1 overflow-auto bg-secondary/50">
                {children}
            </div>
        </SidebarInset>
    </SidebarProvider>
    );
}
