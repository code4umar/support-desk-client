'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiRequestError } from '@/lib/api';
import RequireAuth from '@/components/RequireAuth';

const PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;

function NewTicketInner() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>('normal');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!subject.trim() || !body.trim()) {
      setError('Subject and description are required');
      return;
    }
    setLoading(true);
    try {
      const ticket = await api.createTicket({ subject: subject.trim(), body: body.trim(), priority });
      router.push(`/tickets/${ticket.id}`);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-[70vh] items-center justify-center px-4 py-8 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[400px] w-[400px] rounded-full bg-brand/15 blur-3xl" />
      </div>

      <form
        onSubmit={onSubmit}
        className="relative w-full max-w-lg flex flex-col gap-4 rounded-xl border border-line bg-surface p-8 shadow-2xl shadow-brand-dark/15 backdrop-blur"
      >
        <div className="flex flex-col gap-1 mb-2">
          <h1 className="text-2xl font-bold">New ticket</h1>
          <p className="text-muted text-sm">Describe the issue and we&apos;ll get on it.</p>
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-md py-2">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold tracking-wide text-muted">Subject</label>
          <input
            className="border border-line bg-transparent rounded-md p-2.5 outline-none focus:border-brand-dark focus:ring-1 focus:ring-brand/50 transition-colors"
            placeholder="e.g. Cannot log in to my account"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold tracking-wide text-muted">Description</label>
          <textarea
            rows={6}
            className="border border-line bg-transparent rounded-md p-2.5 outline-none focus:border-brand-dark focus:ring-1 focus:ring-brand/50 transition-colors resize-none"
            placeholder="Add as much detail as you can"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold tracking-wide text-muted">Priority</label>
          <select
            className="border border-line bg-surface rounded-md p-2.5 outline-none focus:border-brand-dark focus:ring-1 focus:ring-brand/50 transition-colors"
            value={priority}
            onChange={(e) => setPriority(e.target.value as (typeof PRIORITIES)[number])}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-3 mt-2">
          <button
            type="button"
            onClick={() => router.push('/tickets')}
            className="text-sm font-medium text-muted hover:text-navy transition-colors px-4 py-2 rounded-md hover:bg-navy/5"
          >
            Cancel
          </button>
          <button
            className="bg-brand text-on-brand font-semibold rounded-md px-5 py-2 transition-all hover:bg-brand-dark hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Creating…' : 'Create ticket'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewTicketPage() {
  return (
    <RequireAuth>
      <NewTicketInner />
    </RequireAuth>
  );
}