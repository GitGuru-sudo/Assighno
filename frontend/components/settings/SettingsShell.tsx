'use client';

import Link from 'next/link';

import { BrandLockup } from '@/components/common/BrandLockup';

export const SettingsShell = () => {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-10">
      <div className="panel rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-glow backdrop-blur">
        <BrandLockup href="/dashboard" subtitle="Settings" />
        <Link href="/dashboard" className="mt-5 inline-flex text-sm font-semibold text-ink/70 underline">
          Back to dashboard
        </Link>
        <h1 className="mt-3 font-display text-4xl text-ink">Settings</h1>
        <p className="mt-3 text-sm text-ink/60">Current reminder behavior and dashboard controls.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="panel rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-glow backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-coral">Reminder pace</p>
          <p className="mt-4 text-sm leading-7 text-ink/80">Assignments with a deadline get at most one Telegram reminder per day.</p>
        </div>
        <div className="panel rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-glow backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-coral">Auto stop</p>
          <p className="mt-4 text-sm leading-7 text-ink/80">Reminders stop once the assignment is submitted or after the deadline passes.</p>
        </div>
        <div className="panel rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-glow backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-coral">Manual control</p>
          <p className="mt-4 text-sm leading-7 text-ink/80">Use the dashboard buttons to mark work submitted or extend the deadline when plans change.</p>
        </div>
      </section>
    </div>
  );
};
