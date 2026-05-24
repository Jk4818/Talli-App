'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/**
 * ThemeToggle — three-state theme picker: system / light / dark.
 *
 * Defaults to system preference (OS setting). User override stored in
 * localStorage by next-themes. Mounts client-side only to prevent SSR mismatch.
 *
 * Best-practice pattern:
 *  - Render a blank placeholder with the same dimensions during SSR to avoid layout shift
 *  - Use resolvedTheme (not theme) for the active icon so "system" resolves correctly
 */
export function ThemeToggle({ size = 'icon' }: { size?: 'icon' | 'icon-sm' }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only render after hydration — prevents SSR mismatch
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return <div className={size === 'icon' ? 'h-12 w-12' : 'h-10 w-10'} aria-hidden="true" />;
  }

  const isDark = resolvedTheme === 'dark';

  const Icon = theme === 'system'
    ? Monitor
    : isDark
    ? Moon
    : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={size}
          aria-label="Change colour theme"
        >
          <Icon className="h-[1.1rem] w-[1.1rem]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className={theme === 'light' ? 'text-primary font-medium' : ''}
        >
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className={theme === 'dark' ? 'text-primary font-medium' : ''}
        >
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className={theme === 'system' ? 'text-primary font-medium' : ''}
        >
          <Monitor className="mr-2 h-4 w-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
