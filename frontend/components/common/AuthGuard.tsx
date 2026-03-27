'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/hooks/useAuth';

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { firebaseUser, loading } = useAuth();

  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.replace('/login');
    }
  }, [firebaseUser, loading, router]);

  if (loading) {
    return <div className="text-sm text-ink/70">Loading your workspace...</div>;
  }

  if (!firebaseUser) {
    return null;
  }

  return <>{children}</>;
};

