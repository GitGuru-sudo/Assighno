'use client';

import Image from 'next/image';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { BrandLockup } from '@/components/common/BrandLockup';
import { useAuth } from '@/hooks/useAuth';
import { hasFirebaseConfig } from '@/lib/firebase';

export const LoginCard = () => {
  const router = useRouter();
  const { firebaseUser, sendMagicLink } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const helperText = useMemo(() => {
    if (firebaseUser) {
      return 'You are already signed in. Opening dashboard...';
    }

    return 'Enter your name and email and we will send a secure sign-in link.';
  }, [firebaseUser]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setStatus('');

    try {
      await sendMagicLink(email, displayName);
      setStatus('Magic link sent. Check your inbox to finish signing in.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to send magic link.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (firebaseUser) {
      router.replace('/dashboard');
    }
  }, [firebaseUser, router]);

  return (
    <div className="panel fade-in-up w-full max-w-lg rounded-[32px] border border-white/70 bg-white/80 p-8 shadow-glow backdrop-blur">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <BrandLockup href={undefined} subtitle="Telegram-first academic workflow" />
        <div className="float-soft rounded-[28px] border border-[#10212e]/10 bg-[#10212e] p-3 shadow-[0_20px_45px_rgba(17,32,49,0.18)]">
          <Image src="/android-chrome-512x512.png" alt="Assighno hero logo" width={72} height={72} className="h-[72px] w-[72px] rounded-2xl" priority />
        </div>
      </div>

      <h1 className="mt-8 font-display text-4xl text-ink">Sign in without a password.</h1>
      <p className="mt-3 text-sm leading-6 text-ink/70">{helperText}</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-ink/10 bg-white/70 px-4 py-4 text-sm text-ink/75">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral">Quick</p>
          <p className="mt-2">Email link login in a couple of taps.</p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-white/70 px-4 py-4 text-sm text-ink/75">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral">Connected</p>
          <p className="mt-2">Telegram submissions flow straight into your workspace.</p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-white/70 px-4 py-4 text-sm text-ink/75">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-coral">Tracked</p>
          <p className="mt-2">Deadlines, reminders, and solutions stay visible in one place.</p>
        </div>
      </div>

      {!hasFirebaseConfig ? (
        <p className="mt-4 rounded-2xl bg-sand px-4 py-3 text-sm text-ink/80">
          Add your Firebase client keys to `frontend/.env.local` before using passwordless login.
        </p>
      ) : null}
      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-ink">Name</span>
          <input
            type="text"
            required
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
            placeholder="Your name"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-ink">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-coral"
            placeholder="you@example.com"
          />
          <p className="mt-2 text-sm font-semibold text-coral">Tip: if the magic link is missing, check Promotions or Spam.</p>
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-ink/92 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Sending Assighno link...' : 'Send magic link'}
        </button>
      </form>
      {status ? <p className="mt-4 rounded-2xl bg-mist px-4 py-3 text-sm text-ink/80">{status}</p> : null}
    </div>
  );
};
