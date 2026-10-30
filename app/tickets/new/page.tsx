'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiRequestError } from '@/lib/api';
import RequireAuth from '@/components/RequireAuth';
import Link from 'next/link';
import ArticleSuggestions from '@/components/ArticleSuggestions';
import SimilarTickets from '@/components/SimilarTickets';
import type { ArticleSummary, Category } from '@/types';

const PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;

function NewTicketInner() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>('normal');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [solvedBy, setSolvedBy] = useState<ArticleSummary | null>(null);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!subject.trim() || !body.trim()) {
      setError('Subject and description are required');
      return;
    }
    setLoading(true);
    try {
      const ticket = await api.createTicket({
        subject: subject.trim(),
        body: body.trim(),
        priority,
        ...(categoryId ? { categoryId: Number(categoryId) } : {}),
      });
      router.push(`/tickets/${ticket.id}`);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  if (solvedBy) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 py-8 md:h-full md:min-h-0">
        <div className="w-full max-w-lg rounded-xl border border-brand/30 bg-surface p-8 text-center shadow-2xl shadow-brand-dark/15">
          <p className="text-3xl" aria-hidden="true">🎉</p>
          <h1 className="mt-2 text-2xl font-bold text-navy">Glad that sorted it!</h1>
          <p className="mt-2 text-sm text-muted">
            No ticket needed. &ldquo;{solvedBy.title}&rdquo; is saved in the Help Center if it happens again.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href={`/help/${solvedBy.id}`} className="rounded-md border border-line px-4 py-2 text-sm font-medium text-navy hover:bg-navy/5">
              Open the article
            </Link>
            <Link href="/dashboard" className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-on-brand hover:bg-brand-dark">
              Back to dashboard
            </Link>
          </div>
          <button type="button" onClick={() => setSolvedBy(null)} className="mt-4 text-xs text-muted hover:text-navy">
            Actually, I still need help
          </button>
        </div>
      </div>
    );
  }

  const field =
    'border border-line bg-transparent rounded-md p-2.5 outline-none focus:border-brand-dark focus:ring-1 focus:ring-brand/50 transition-colors';
  const hasHints = subject.trim().length >= 3;

  // Two columns that fit one screen: the form, and "before you send" help beside it.
  return (
    <div className="flex flex-col gap-4 md:h-full md:min-h-0">
      <div>
        <h1 className="text-2xl font-bold">New ticket</h1>
        <p className="text-sm text-muted">Describe the issue and we&apos;ll get on it.</p>
      </div>

      <div className="grid gap-5 md:min-h-0 md:flex-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-6 shadow-xl shadow-brand-dark/10 md:min-h-0"
        >
          {error && (
            <p role="alert" className="rounded-md border border-red-500/20 bg-red-500/10 py-2 text-center text-sm text-red-500">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="ticket-subject" className="text-xs font-semibold tracking-wide text-muted">Subject</label>
            <input
              id="ticket-subject"
              className={field}
              placeholder="e.g. Cannot log in to my account"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1 md:min-h-0 md:flex-1">
            <label htmlFor="ticket-body" className="text-xs font-semibold tracking-wide text-muted">Description</label>
            <textarea
              id="ticket-body"
              rows={5}
              className={`${field} resize-none md:min-h-[96px] md:flex-1`}
              placeholder="Add as much detail as you can"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label htmlFor="ticket-priority" className="text-xs font-semibold tracking-wide text-muted">Priority</label>
              <select
                id="ticket-priority"
                className={`${field} bg-surface`}
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
            <div className="flex flex-col gap-1">
              <label htmlFor="ticket-category" className="text-xs font-semibold tracking-wide text-muted">Category</label>
              <select
                id="ticket-category"
                className={`${field} bg-surface`}
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Not sure</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push('/tickets')}
              className="rounded-md px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-navy/5 hover:text-navy"
            >
              Cancel
            </button>
            <button
              className="rounded-md bg-brand px-5 py-2 font-semibold text-on-brand transition-all hover:scale-[1.02] hover:bg-brand-dark active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Creating…' : 'Create ticket'}
            </button>
          </div>
        </form>

        <aside aria-label="Before you send" className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-6 md:min-h-0">
          <div>
            <h2 className="text-base font-semibold text-navy">Before you send</h2>
            <p className="text-xs text-muted">Answers and similar reports appear here as you type the subject.</p>
          </div>
          <ArticleSuggestions text={subject} onSolved={setSolvedBy} />
          <SimilarTickets text={`${subject} ${body}`} />
          {!hasHints && (
            <ul className="space-y-2.5 text-sm text-muted">
              <li>✍️ Say what you were trying to do and what happened instead.</li>
              <li>🧾 Include any error message, word for word.</li>
              <li>📎 You can attach screenshots after the ticket is created.</li>
              <li>
                📚 Or browse the <Link href="/help" className="text-brand-dark hover:underline">Help Center</Link> first.
              </li>
            </ul>
          )}
        </aside>
      </div>
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