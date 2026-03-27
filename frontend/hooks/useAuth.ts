'use client';

import { createContext, useContext } from 'react';

import type { User } from 'firebase/auth';
import { BackendUser } from '@/lib/types';

export type AuthContextValue = {
  firebaseUser: User | null;
  backendUser: BackendUser | null;
  loading: boolean;
  sendMagicLink: (email: string, displayName: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  refreshBackendUser: () => Promise<void>;
  getToken: () => Promise<string | null>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
};
