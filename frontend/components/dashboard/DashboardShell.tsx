'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { BrandLockup } from '@/components/common/BrandLockup';
import { useAuth } from '@/hooks/useAuth';
import { extendAssignmentDeadline, fetchAssignments, markAssignmentSubmitted } from '@/lib/api';
import { AssignmentSummary } from '@/lib/types';
import { LinkTelegramCard } from './LinkTelegramCard';

const statusClasses: Record<AssignmentSummary['status'], string> = {
  queued: 'bg-sand text-ink',
  processing: 'bg-mint text-ink',
  completed: 'bg-ink text-white',
  failed: 'bg-coral text-white',
  submitted: 'bg-emerald-600 text-white',
};

export const DashboardShell = () => {
  const { backendUser, getToken, signOutUser } = useAuth();
  const [assignments, setAssignments] = useState<AssignmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionAssignmentId, setActionAssignmentId] = useState<string | null>(null);

  const updateAssignmentInState = (updatedAssignment: AssignmentSummary) => {
    setAssignments((currentAssignments) =>
      currentAssignments.map((assignment) => (assignment._id === updatedAssignment._id ? updatedAssignment : assignment)),
    );
  };

  const activeAssignments = assignments.filter((assignment) => assignment.status !== 'submitted').length;
  const completedAssignments = assignments.filter((assignment) => assignment.status === 'completed' || assignment.status === 'submitted').length;
  const dueSoonAssignments = assignments.filter((assignment) => {
    if (!assignment.deadline || assignment.status === 'submitted') {
      return false;
    }

    const diff = new Date(assignment.deadline).getTime() - Date.now();
    return diff > 0 && diff <= 1000 * 60 * 60 * 24 * 3;
  }).length;

  useEffect(() => {
    const loadAssignments = async () => {
      try {
        const token = await getToken();

        if (!token) {
          return;
        }

        const data = await fetchAssignments(token);
        setAssignments(data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Could not load assignments.');
      } finally {
        setLoading(false);
      }
    };

    loadAssignments().catch(console.error);

    const interval = window.setInterval(() => {
      loadAssignments().catch(console.error);
    }, 15000);

    return () => window.clearInterval(interval);
  }, [getToken]);

  const handleMarkSubmitted = async (assignmentId: string) => {
    try {
      setActionAssignmentId(assignmentId);
      setError('');

      const token = await getToken();

      if (!token) {
        return;
      }

      const updatedAssignment = await markAssignmentSubmitted(token, assignmentId);
      updateAssignmentInState(updatedAssignment);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Could not mark assignment as submitted.');
    } finally {
      setActionAssignmentId(null);
    }
  };

  const handleExtendDeadline = async (assignment: AssignmentSummary) => {
    const deadlineInput = window.prompt(
      'Enter the new deadline. Example: 26/04/2026 or 26 April 2026',
      assignment.deadline ? new Date(assignment.deadline).toLocaleDateString('en-GB') : '',
    );

    if (!deadlineInput?.trim()) {
      return;
    }

    try {
      setActionAssignmentId(assignment._id);
      setError('');

      const token = await getToken();

      if (!token) {
        return;
      }

      const updatedAssignment = await extendAssignmentDeadline(token, assignment._id, deadlineInput);
      updateAssignmentInState(updatedAssignment);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Could not extend the deadline.');
    } finally {
      setActionAssignmentId(null);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="panel fade-in-up flex flex-col gap-6 rounded-[32px] bg-ink px-8 py-8 text-white shadow-glow md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <BrandLockup href={undefined} subtitle="Control room" tone="light" />
          <h1 className="mt-3 font-display text-4xl">
            {backendUser?.display_name ? `${backendUser.display_name}'s Assighno hub.` : 'Your assignments, one clean pipeline.'}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
            Send text, PDFs, or assignment images to Telegram. Assighno keeps the queue visible, reminders moving, and each solution ready
            for quick follow-up from the dashboard.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/12 bg-white/8 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">Active</p>
              <p className="mt-2 font-display text-3xl">{activeAssignments}</p>
            </div>
            <div className="rounded-2xl border border-white/12 bg-white/8 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">Completed</p>
              <p className="mt-2 font-display text-3xl">{completedAssignments}</p>
            </div>
            <div className="rounded-2xl border border-white/12 bg-white/8 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">Due Soon</p>
              <p className="mt-2 font-display text-3xl">{dueSoonAssignments}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm">
            <p className="font-semibold">{backendUser?.display_name ?? 'Profile'}</p>
            <p className="text-white/70">{backendUser?.email}</p>
          </div>
          <Link href="/profile" className="rounded-2xl border border-white/20 px-4 py-3 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 hover:bg-white/10">
            Profile
          </Link>
          <Link href="/settings" className="rounded-2xl border border-white/20 px-4 py-3 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 hover:bg-white/10">
            Settings
          </Link>
          <button
            type="button"
            onClick={() => signOutUser()}
            className="rounded-2xl border border-white/20 px-4 py-3 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 hover:bg-white/10"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <LinkTelegramCard />
        <section className="panel rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-glow backdrop-blur">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-coral">Assignments</p>
              <h2 className="mt-2 font-display text-2xl text-ink">Recent activity</h2>
            </div>
            <p className="text-sm text-ink/60">Auto-refresh every 15 seconds</p>
          </div>

          {loading ? <p className="mt-6 text-sm text-ink/70">Loading assignments...</p> : null}
          {error ? <p className="mt-6 text-sm text-coral">{error}</p> : null}

          {!loading && !assignments.length ? (
            <p className="mt-6 rounded-2xl bg-mist px-4 py-4 text-sm text-ink/70">
              Nothing here yet. Once your Telegram account is linked, send any assignment to the bot and it will show up here.
            </p>
          ) : null}

          <div className="mt-6 space-y-4">
            {assignments.map((assignment) => (
              <article
                key={assignment._id}
                className="panel grid gap-4 rounded-3xl border border-ink/10 bg-white px-5 py-5 md:grid-cols-[minmax(0,1fr)_auto]"
              >
                <div>
                  <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[assignment.status]}`}>
                    {assignment.status}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-ink">{assignment.title}</h3>
                  <p className="mt-2 text-sm text-ink/60">
                    Created {new Date(assignment.created_at).toLocaleString()}
                    {assignment.deadline ? ` | Deadline ${new Date(assignment.deadline).toLocaleDateString()}` : ' | No deadline'}
                  </p>
                  {assignment.reminder_last_sent_at ? (
                    <p className="mt-2 text-xs text-ink/50">Last reminder sent {new Date(assignment.reminder_last_sent_at).toLocaleString()}</p>
                  ) : null}
                  {assignment.submitted_at ? (
                    <p className="mt-2 text-xs text-emerald-700">Submitted on {new Date(assignment.submitted_at).toLocaleString()}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center justify-start gap-3 md:justify-end">
                  {assignment.status !== 'submitted' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleMarkSubmitted(assignment._id)}
                        disabled={actionAssignmentId === assignment._id}
                        className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition duration-200 hover:-translate-y-0.5 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        Mark submitted
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExtendDeadline(assignment)}
                        disabled={actionAssignmentId === assignment._id}
                        className="rounded-2xl border border-ink/10 bg-mist px-4 py-3 text-sm font-semibold text-ink transition duration-200 hover:-translate-y-0.5 hover:bg-sand disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {assignment.deadline ? 'Extend deadline' : 'Set deadline'}
                      </button>
                    </>
                  ) : null}
                  <Link
                    href={`/assignments/${assignment._id}`}
                    className="rounded-2xl bg-coral px-4 py-3 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-coral/90"
                  >
                    View solution
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
