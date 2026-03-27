'use client';

import Link from 'next/link';

import { BrandLockup } from '@/components/common/BrandLockup';
import { useAuth } from '@/hooks/useAuth';

export const ProfileShell = () => {
  const { backendUser } = useAuth();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-10">
      <div className="panel rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-glow backdrop-blur">
        <BrandLockup href="/dashboard" subtitle="Profile" />
        <Link href="/dashboard" className="mt-5 inline-flex text-sm font-semibold text-ink/70 underline">
          Back to dashboard
        </Link>
        <h1 className="mt-3 font-display text-4xl text-ink">Profile</h1>
        <p className="mt-3 text-sm text-ink/60">Your account details and Telegram link status.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="panel rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-glow backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-coral">Name</p>
          <p className="mt-4 text-lg font-semibold text-ink">{backendUser?.display_name ?? 'Not set'}</p>
        </div>
        <div className="panel rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-glow backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-coral">Email</p>
          <p className="mt-4 break-all text-lg font-semibold text-ink">{backendUser?.email ?? 'Not set'}</p>
        </div>
        <div className="panel rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-glow backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-coral">Telegram</p>
          <p className="mt-4 text-lg font-semibold text-ink">{backendUser?.telegram_username ?? backendUser?.telegram_id ?? 'Not linked'}</p>
        </div>
      </section>
    </div>
  );
};
