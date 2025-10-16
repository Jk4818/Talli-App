import type { ReactNode } from 'react';
import { AppHeader } from '@/components/app/AppHeader';

export default function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-dvh">
      <AppHeader />
      <main className="flex-1 flex flex-col bg-secondary/50">
        {children}
      </main>
    </div>
  );
}
