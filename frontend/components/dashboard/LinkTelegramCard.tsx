'use client';

import { useEffect, useState } from 'react';

import { BrandLockup } from '@/components/common/BrandLockup';
import { useAuth } from '@/hooks/useAuth';
import { generateLinkingCode } from '@/lib/api';

export const LinkTelegramCard = () => {
  const { backendUser, getToken, refreshBackendUser } = useAuth();
  const [code, setCode] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copyState, setCopyState] = useState('');

  const loadCode = async () => {
    setLoading(true);
    setError('');

    try {
      const token = await getToken();

      if (!token) {
        return;
      }

      const response = await generateLinkingCode(token);
      setCode(response.code);
      setExpiresAt(response.expires_at);
      await refreshBackendUser();
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not generate a linking code.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fresh codes are short-lived so a user can safely paste them into Telegram without long exposure.
    if (!backendUser?.telegram_id) {
      loadCode().catch(console.error);
    }
  }, [backendUser?.telegram_id]);

  useEffect(() => {
    if (backendUser?.telegram_id) {
      return;
    }

    const interval = window.setInterval(() => {
      refreshBackendUser().catch(console.error);
    }, 15000);

    return () => window.clearInterval(interval);
  }, [backendUser?.telegram_id, refreshBackendUser]);

  const command = `/start ${code || '......'}`;
  const expiresLabel = expiresAt
    ? new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' }).format(new Date(expiresAt))
    : '';

  const handleCopy = async () => {
    if (!code) {
      return;
    }

    try {
      await navigator.clipboard.writeText(command);
      setCopyState('Command copied.');
      window.setTimeout(() => setCopyState(''), 2000);
    } catch (copyError) {
      setCopyState(copyError instanceof Error ? copyError.message : 'Could not copy the command.');
    }
  };

  if (backendUser?.telegram_id) {
    return (
      <aside className="panel rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-glow backdrop-blur">
        <BrandLockup href={undefined} subtitle="Telegram channel is active" />
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-coral">Telegram</p>
        <h2 className="mt-2 font-display text-2xl text-ink">Linked and ready</h2>
        <p className="mt-4 text-sm leading-6 text-ink/70">
          Linked account: <span className="font-semibold text-ink">{backendUser.telegram_username ?? backendUser.telegram_id}</span>
        </p>
        <p className="mt-2 text-sm text-ink/60">Send text, PDF, or image assignments directly to the bot.</p>
      </aside>
    );
  }

  return (
    <aside className="panel rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-glow backdrop-blur">
      <BrandLockup href={undefined} subtitle="Connect your bot workspace" />
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-coral">Telegram Linking</p>
      <h2 className="mt-2 font-display text-2xl text-ink">Connect your bot access</h2>
      <ol className="mt-5 space-y-3 text-sm leading-6 text-ink/70">
        <li>1. Open your Telegram bot.</li>
        <li>2. Send the command below within 10 minutes.</li>
        <li>3. Start sending assignments after the success message.</li>
      </ol>

      <div className="mt-6 rounded-3xl bg-ink px-5 py-5 text-white shadow-[0_20px_45px_rgba(17,32,49,0.22)]">
        <p className="text-xs uppercase tracking-[0.2em] text-white/60">Send this command</p>
        <p className="mt-3 break-all font-display text-3xl">{command}</p>
        {expiresAt ? <p className="mt-3 text-sm text-white/70">Expires at {expiresLabel}</p> : null}
      </div>

      {error ? <p className="mt-4 text-sm text-coral">{error}</p> : null}
      {copyState ? <p className="mt-4 text-sm font-medium text-ink/75">{copyState}</p> : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleCopy}
          disabled={!code}
          className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm font-semibold text-ink transition duration-200 hover:-translate-y-0.5 hover:bg-mist disabled:cursor-not-allowed disabled:opacity-70"
        >
          Copy command
        </button>
        <button
          type="button"
          onClick={() => loadCode()}
          disabled={loading}
          className="rounded-2xl border border-ink/10 px-4 py-3 text-sm font-semibold text-ink transition duration-200 hover:-translate-y-0.5 hover:bg-mist disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Refreshing code...' : 'Generate new code'}
        </button>
      </div>
    </aside>
  );
};
