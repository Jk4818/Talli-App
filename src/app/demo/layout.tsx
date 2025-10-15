import type { ReactNode } from 'react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-dvh">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Logo />
            <div className="hidden font-headline rounded-full bg-accent/20 px-3 py-1 text-sm font-bold text-accent-foreground sm:block">
              Demo Mode
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Exit Demo
            </Link>
          </Button>
        </div>
      </header>
      <main className="flex-1 flex flex-col bg-secondary/50">
        {children}
      </main>
    </div>
  );
}
