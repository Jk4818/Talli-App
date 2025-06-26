'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup, type User } from 'firebase/auth';
import { auth } from './client';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { checkInviteStatus } from '@/ai/flows/check-beta-status';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        try {
          // User has successfully signed in. Check their invite status on the server.
          const { isInvited } = await checkInviteStatus({
            user: {
              email: currentUser.email,
              email_verified: currentUser.emailVerified,
            },
          });

          if (isInvited) {
            // User is on the list, set the user state and grant access.
            setUser(currentUser);
          } else {
            // User is not on the list. Show a message and sign them out immediately.
            toast({
              variant: 'destructive',
              title: 'Access Denied',
              description: 'This account is not on the invite list. Please contact support.',
            });
            await firebaseSignOut(auth); // This will re-trigger onAuthStateChanged with user=null
          }
        } catch (error) {
          console.error("Error checking invite status:", error);
           toast({
            variant: 'destructive',
            title: 'Authentication Error',
            description: 'Could not verify access permissions. Please try again.',
          });
          await firebaseSignOut(auth);
        }
      } else {
        // User is signed out or was never signed in.
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);


  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setLoading(true);
      await signInWithPopup(auth, provider);
      // The onAuthStateChanged listener will handle verification and state changes.
    } catch (error) {
      console.error('Error signing in with Google:', error);
      toast({
        variant: 'destructive',
        title: 'Sign-in Failed',
        description: 'Could not sign in with Google. Please try again.',
      });
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      router.push('/');
      toast({
        title: 'Signed Out',
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        variant: 'destructive',
        title: 'Sign-out Failed',
        description: 'There was an issue signing out. Please try again.',
      });
    }
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
