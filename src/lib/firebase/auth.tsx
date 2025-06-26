'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider, signInWithPopup, type User } from 'firebase/auth';
import { auth } from './client';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { checkBetaStatus } from '@/ai/flows/check-beta-status';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isBetaUser: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBetaUser, setIsBetaUser] = useState<boolean>(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // User is logged in, check their beta status.
        try {
          const { isBetaUser: hasBetaAccess } = await checkBetaStatus({ 
            user: { email: user.email, email_verified: user.emailVerified }
          });
          setIsBetaUser(hasBetaAccess);
        } catch (error) {
          console.error("Failed to check beta status:", error);
          setIsBetaUser(false); // Default to not beta user on error
        }
      } else {
        // User is logged out.
        setIsBetaUser(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Effect for showing toasts based on beta status
  useEffect(() => {
    if (loading) return; // Do nothing while loading

    if (isBetaUser === true) {
      toast({
        title: 'Beta Access Granted!',
        description: 'You have full access to all AI-powered features.',
      });
    } else if (user) { // Only show for logged-in non-beta users
      toast({
        title: 'Welcome to Splitzy!',
        description: 'AI features are in a limited beta. You can still use the app manually or try the demo.',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBetaUser, loading, user]);


  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setLoading(true);
      await signInWithPopup(auth, provider);
      // The onAuthStateChanged listener will handle the user state update and redirection
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
    isBetaUser,
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
