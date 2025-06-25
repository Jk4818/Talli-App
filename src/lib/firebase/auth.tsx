'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, type User } from 'firebase/auth';
import { auth } from './client';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { checkSignupEligibility } from '@/ai/flows/check-signup-eligibility';


interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUpWithEmailPassword: (email: string, password: string) => Promise<boolean>;
  signInWithEmailPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
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
        // We only consider the user "logged in" for the app if their email is verified.
        if (currentUser.emailVerified) {
          setUser(currentUser);
        } else {
          // This handles cases where a user might be technically logged in via Firebase session
          // but hasn't completed email verification. We treat them as logged out.
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const signUpWithEmailPassword = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      // First, check if the email is eligible.
      const { isEligible } = await checkSignupEligibility({ email });
      if (!isEligible) {
        toast({
          variant: 'destructive',
          title: 'Signup Not Allowed',
          description: 'This email address is not on the invite list. Please contact support.',
        });
        setLoading(false);
        return false;
      }

      // If eligible, create the user.
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Send verification email.
      await sendEmailVerification(userCredential.user);
      
      // Sign the user out immediately. They must verify their email before logging in.
      await firebaseSignOut(auth);
      
      return true;

    } catch (error: any) {
      console.error('Error signing up:', error);
      const errorCode = error.code;
      let errorMessage = 'An unexpected error occurred during signup.';
      if (errorCode === 'auth/email-already-in-use') {
        errorMessage = 'This email is already in use. Please try logging in instead.';
      } else if (errorCode === 'auth/weak-password') {
        errorMessage = 'The password is too weak. Please choose a stronger password.';
      }

      toast({
        variant: 'destructive',
        title: 'Signup Failed',
        description: errorMessage,
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmailPassword = async (email: string, password: string) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (!userCredential.user.emailVerified) {
        await firebaseSignOut(auth); // Sign out user if email is not verified
        toast({
          variant: 'destructive',
          title: 'Email Not Verified',
          description: 'Please check your inbox and verify your email address before signing in.',
        });
      }
      // The onAuthStateChanged listener will handle setting the user state upon successful, verified login
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast({
        variant: 'destructive',
        title: 'Sign-in Failed',
        description: 'Invalid email or password. Please check your credentials or sign up if you don\'t have an account.',
      });
    } finally {
        setLoading(false);
    }
  };


  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // Redirect to home page after sign out to ensure a clean state.
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

  const sendPasswordReset = async (email: string) => {
    if (!email) {
      toast({
        variant: 'destructive',
        title: 'Email Required',
        description: 'Please enter your email address to reset your password.',
      });
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      // For security, we show a generic success message to prevent email enumeration.
      toast({
        title: 'Password Reset Email Sent',
        description: 'If an account exists for this email, you will receive instructions to reset your password.',
      });
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      // Even on error, show the generic message.
      toast({
        title: 'Password Reset Email Sent',
        description: 'If an account exists for this email, you will receive instructions to reset your password.',
      });
    } finally {
      setLoading(false);
    }
  };


  const value = {
    user,
    loading,
    signUpWithEmailPassword,
    signInWithEmailPassword,
    signOut,
    sendPasswordReset,
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
