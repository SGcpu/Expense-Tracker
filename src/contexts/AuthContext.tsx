'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  UserCredential
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '@/lib/firebase';
import { logUserAction } from '@/lib/logging';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<UserCredential | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Support demo/testing mode when demo user is set in localStorage
    if (typeof window !== 'undefined' && localStorage.getItem('demo_user_logged_in') === 'true') {
      setUser({
        uid: 'demo-user-123',
        email: 'commuter@example.com',
        displayName: 'Daily Commuter',
        emailVerified: true,
        isAnonymous: false,
        metadata: {},
        providerData: [],
        refreshToken: '',
        tenantId: null,
        delete: async () => {},
        getIdToken: async () => 'mock-token',
        getIdTokenResult: async () => ({} as any),
        reload: async () => {},
        toJSON: () => ({}),
        phoneNumber: null,
        photoURL: null,
        providerId: 'google.com'
      } as unknown as User);
      setLoading(false);
      return;
    }

    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      
      if (user) {
        logUserAction(user.uid, 'auth', 'session_restored', {
          lastSignIn: user.metadata.lastSignInTime
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<UserCredential | null> => {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      toast.error('Authentication is not configured');
      return null;
    }

    try {
      setLoading(true);
      let result: UserCredential;

      if (Capacitor.isNativePlatform()) {
        // Popups do not work inside the Android WebView, so use the native Google dialog
        // and exchange its ID token for a Firebase session.
        const native = await FirebaseAuthentication.signInWithGoogle({ skipNativeAuth: true });
        const idToken = native.credential?.idToken;
        if (!idToken) throw new Error('No ID token returned by Google');
        result = await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
      } else {
        result = await signInWithPopup(auth, googleProvider);
      }

      await logUserAction(result.user.uid, 'auth', 'login', {
        method: 'google',
        isNewUser: result.user.metadata.creationTime === result.user.metadata.lastSignInTime
      });

      toast.success(`Welcome ${result.user.displayName?.split(' ')[0] || 'back'}!`);
      return result;
    } catch (error: any) {
      const code = error?.code as string | undefined;
      // The user closing the dialog is not an error worth reporting.
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        console.error('Error signing in:', error);
        toast.error('Failed to sign in. Please try again.');
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      if (!isFirebaseConfigured || !auth) {
        return;
      }
      
      if (user) {
        await logUserAction(user.uid, 'auth', 'logout', {});
      }

      if (Capacitor.isNativePlatform()) {
        await FirebaseAuthentication.signOut();
      }
      await firebaseSignOut(auth);
      toast.success('Signed out successfully');
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};