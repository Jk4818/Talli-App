'use client';

import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { UserNav } from '../auth/UserNav';

export default function AppNavbar() {
    const { isMobile } = useSidebar();
    return (
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:justify-end">
            <div className='flex items-center gap-2'>
                {isMobile && <SidebarTrigger />}
            </div>
            <div className="flex items-center gap-4">
                <UserNav />
            </div>
        </header>
    );
}
