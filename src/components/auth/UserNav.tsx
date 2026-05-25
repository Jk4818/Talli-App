'use client';

import { useAuth } from '@/lib/firebase/auth';
import { useTheme } from 'next-themes';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import {
  DropDrawer,
  DropDrawerContent,
  DropDrawerGroup,
  DropDrawerItem,
  DropDrawerLabel,
  DropDrawerSeparator,
  DropDrawerSub,
  DropDrawerSubContent,
  DropDrawerSubTrigger,
  DropDrawerTrigger,
} from '../ui/dropdrawer';
import { LogOut, Monitor, Moon, Palette, Sun, User as UserIcon } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { useEffect, useState } from 'react';

export function UserNav() {
  const { user, signOut, loading } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (loading) {
    return <Skeleton className="h-10 w-10 rounded-full" />;
  }

  if (!user) {
    return null;
  }

  const getInitials = (name?: string | null) => {
    if (!name) return <UserIcon className="h-5 w-5" />;
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Resolved icon + label for the sub-menu trigger hint
  const ThemeIcon = !mounted
    ? Monitor
    : theme === 'system'
    ? Monitor
    : resolvedTheme === 'dark'
    ? Moon
    : Sun;

  const themeLabel = !mounted
    ? 'System'
    : theme === 'system'
    ? 'System'
    : resolvedTheme === 'dark'
    ? 'Dark'
    : 'Light';

  return (
    <DropDrawer>
      <DropDrawerTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full" aria-label="Open account menu">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? 'User avatar'} />
            <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropDrawerTrigger>

      <DropDrawerContent className="w-56" align="end">
        {/* User identity */}
        <DropDrawerLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropDrawerLabel>

        <DropDrawerSeparator />

        <DropDrawerGroup>
          {/* Appearance sub-menu */}
          <DropDrawerSub>
            <DropDrawerSubTrigger icon={<Palette className="h-4 w-4" />}>
              <span className="flex-1">Appearance</span>
              <span className="ml-2 text-xs text-muted-foreground">{themeLabel}</span>
            </DropDrawerSubTrigger>
            <DropDrawerSubContent>
              <DropDrawerItem
                icon={<Sun className="h-4 w-4" />}
                onClick={() => setTheme('light')}
                onSelect={(e) => e.preventDefault()}
                className={theme === 'light' ? 'text-primary font-medium' : ''}
              >
                Light
              </DropDrawerItem>
              <DropDrawerItem
                icon={<Moon className="h-4 w-4" />}
                onClick={() => setTheme('dark')}
                onSelect={(e) => e.preventDefault()}
                className={theme === 'dark' ? 'text-primary font-medium' : ''}
              >
                Dark
              </DropDrawerItem>
              <DropDrawerItem
                icon={<Monitor className="h-4 w-4" />}
                onClick={() => setTheme('system')}
                onSelect={(e) => e.preventDefault()}
                className={theme === 'system' ? 'text-primary font-medium' : ''}
              >
                System
              </DropDrawerItem>
            </DropDrawerSubContent>
          </DropDrawerSub>
        </DropDrawerGroup>

        <DropDrawerSeparator />

        <DropDrawerGroup>
          <DropDrawerItem onClick={signOut} icon={<LogOut className="h-4 w-4" />}>
            Log out
          </DropDrawerItem>
        </DropDrawerGroup>
      </DropDrawerContent>
    </DropDrawer>
  );
}
