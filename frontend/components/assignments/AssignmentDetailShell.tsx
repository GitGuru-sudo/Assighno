'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { BrandLockup } from '@/components/common/BrandLockup';
import { useAuth } from '@/hooks/useAuth';
import { fetchAssignmentDetail } from '@/lib/api';
import { AssignmentDetail } from '@/lib/types';

export const AssignmentDetailShell = ({ assignmentId }: { assignmentId: string }) => {
  const { getToken } = useAuth();
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copyState, setCopyState] = useState('');

  useEffect(() => {
    const loadAssignment = async () => {
      try {
        const token = await getToken();

        if (!token) {
          return;
        }

        const data = await fetchAssignmentDetail(token, assignmentId);
        setAssignment(data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Could not load assignment.');
      } finally {
        setLoading(false);
      }
    };

    loadAssignment().catch(console.error);

    const interval = window.setInterval(() => {
      loadAssignment().catch(console.error);
    }, 15000);

    return () => window.clearInterval(interval);
  }, [assignmentId, getToken]);

  const handleCopy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyState(`${label} copied.`);
      window.setTimeout(() => setCopyState(''), 1800);
    } catch (copyError) {
      setCopyState(copyError instanceof Error ? copyError.message : 'Copy failed.');
    }
  };

  if (loading) {
    return <div className="text-sm text-ink/70">Loading assignment...</div>;
  }

  if (error || !assignment) {
    return (
      <div className="rounded-3xl bg-white/80 p-8 shadow-glow">
        <p className="text-sm text-coral">{error || 'Assignment not found.'}</p>
        <Link href="/dashboard" className="mt-4 inline-flex text-sm font-semibold text-ink underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <div className="panel rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-glow backdrop-blur">
        <BrandLockup href="/dashboard" subtitle="Assignment detail" />
        <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link href="/dashboard" className="text-sm font-semibold text-ink/70 underline">
              Back to dashboard
            </Link>
            <h1 className="mt-3 font-display text-4xl text-ink">{assignment.title}</h1>
            <p className="mt-3 text-sm text-ink/60">
              Status: {assignment.status} | Source: {assignment.source_type} | Questions: {assignment.questions.length}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleCopy(assignment.cleaned_content, 'Cleaned content')}
              className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm font-semibold text-ink transition duration-200 hover:-translate-y-0.5 hover:bg-mist"
            >
              Copy cleaned content
            </button>
          </div>
        </div>
        {copyState ? <p className="mt-4 text-sm text-ink/70">{copyState}</p> : null}
      </div>

      <section className="panel rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-glow backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-coral">Cleaned Content</p>
        <pre className="mt-4 whitespace-pre-wrap font-body text-sm leading-7 text-ink/75">{assignment.cleaned_content}</pre>
      </section>

      {assignment.status === 'failed' && assignment.error_message ? (
        <section className="panel rounded-[28px] border border-coral/20 bg-coral/10 p-6 shadow-glow backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-coral">Processing Error</p>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-ink">{assignment.error_message}</p>
        </section>
      ) : null}

      <section className="space-y-5">
        {assignment.questions.map((question, index) => (
          <article key={question._id} className="panel rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-glow backdrop-blur">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-coral">Question {index + 1}</p>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-ink/80">{question.question_text}</p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(question.ai_solution || 'Still processing...', `Solution ${index + 1}`)}
                className="rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm font-semibold text-ink transition duration-200 hover:-translate-y-0.5 hover:bg-mist"
              >
                Copy solution
              </button>
            </div>
            <div className="mt-6 rounded-3xl bg-mist px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ink/60">AI Solution</p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink">{question.ai_solution || 'Still processing...'}</p>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
};
