'use client';

import { useAuth } from '@/lib/firebase/auth';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import {
  DropDrawer,
  DropDrawerContent,
  DropDrawerGroup,
  DropDrawerItem,
  DropDrawerLabel,
  DropDrawerSeparator,
  DropDrawerTrigger,
} from '../ui/dropdrawer';
import { LogOut, User as UserIcon } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

export function UserNav() {
  const { user, signOut, loading } = useAuth();

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

  return (
    <DropDrawer>
      <DropDrawerTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? 'User'} />
            <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropDrawerTrigger>
      <DropDrawerContent className="w-56" align="end">
        <DropDrawerLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropDrawerLabel>
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
