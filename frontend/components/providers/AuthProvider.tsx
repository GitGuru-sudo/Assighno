'use client';

import { useEffect, useState, startTransition } from 'react';
import {
  User,
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signOut,
} from 'firebase/auth';

import { auth, hasFirebaseConfig } from '@/lib/firebase';
import { fetchCurrentUser, syncUser } from '@/lib/api';
import { BackendUser } from '@/lib/types';
import { AuthContext } from '@/hooks/useAuth';

const EMAIL_STORAGE_KEY = 'assignment-assistant-email';
const NAME_STORAGE_KEY = 'assignment-assistant-name';

const actionCodeSettings = {
  url: new URL('/login', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').toString(),
  handleCodeInApp: true,
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [backendUser, setBackendUser] = useState<BackendUser | null>(null);
  const [loading, setLoading] = useState(true);

  const getToken = async () => {
    const currentUser = auth?.currentUser;

    if (!currentUser) {
      return null;
    }

    return currentUser.getIdToken();
  };

  const refreshBackendUser = async () => {
    const token = await getToken();

    if (!token) {
      setBackendUser(null);
      return;
    }

    const user = await fetchCurrentUser(token);
    setBackendUser(user);
  };

  const sendMagicLink = async (email: string, displayName: string) => {
    if (!auth || !hasFirebaseConfig) {
      throw new Error('Firebase environment variables are missing in the frontend configuration.');
    }

    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    window.localStorage.setItem(EMAIL_STORAGE_KEY, email);
    window.localStorage.setItem(NAME_STORAGE_KEY, displayName.trim());
  };

  const signOutUser = async () => {
    if (!auth) {
      return;
    }

    await signOut(auth);
    setBackendUser(null);
  };

  useEffect(() => {
    if (!auth || !hasFirebaseConfig) {
      setLoading(false);
      return;
    }

    const firebaseAuth = auth;

    const completeEmailLinkLogin = async () => {
      // Firebase completes the passwordless session client-side when the magic link lands here.
      if (!isSignInWithEmailLink(firebaseAuth, window.location.href)) {
        return;
      }

      const storedEmail = window.localStorage.getItem(EMAIL_STORAGE_KEY);
      const email = storedEmail ?? window.prompt('Confirm your email to finish sign-in');
      const storedName = window.localStorage.getItem(NAME_STORAGE_KEY);
      const displayName = storedName ?? window.prompt('Enter your name to finish sign-in');

      if (!email) {
        return;
      }

      if (displayName) {
        window.localStorage.setItem(NAME_STORAGE_KEY, displayName);
      }

      await signInWithEmailLink(firebaseAuth, email, window.location.href);
      window.localStorage.removeItem(EMAIL_STORAGE_KEY);
      window.history.replaceState({}, document.title, '/dashboard');
    };

    completeEmailLinkLogin().catch((error) => {
      console.error('Email link sign-in failed', error);
    });

    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      setFirebaseUser(user);

      if (!user) {
        startTransition(() => {
          setBackendUser(null);
          setLoading(false);
        });
        return;
      }

      try {
        const token = await user.getIdToken();
        const storedName = window.localStorage.getItem(NAME_STORAGE_KEY) ?? user.displayName ?? undefined;
        const syncedUser = await syncUser(token, storedName);

        startTransition(() => {
          setBackendUser(syncedUser);
          setLoading(false);
        });
      } catch (error) {
        console.error('Failed to sync backend user', error);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        backendUser,
        loading,
        sendMagicLink,
        signOutUser,
        refreshBackendUser,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
