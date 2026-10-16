'use client';
import { useState } from 'react';
import { api, ApiRequestError } from '@/lib/api';

// Agent-only helper: asks the server for an AI draft reply to this ticket.
// The draft goes into an editable box; nothing is sent until the agent
// presses "Use this draft" and then posts the comment themselves.
export default function SuggestReply({
  ticketId,
  onUse,
}: {
  ticketId: string;
  onUse: (text: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function generate() {
    setLoading(true);
    setError('');
    try {
      const res = await api.suggestReply(ticketId);
      setDraft(res.draft);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not get a suggestion.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={generate}
        disabled={loading}
        className="flex w-fit items-center gap-2 rounded-md border border-brand-dark/30 px-3 py-1.5 text-sm text-brand-dark transition hover:bg-brand/15 disabled:opacity-50"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2l1.9 5.6L19.5 9.5l-5.6 1.9L12 17l-1.9-5.6L4.5 9.5l5.6-1.9L12 2zm7 11l.9 2.6 2.6.9-2.6.9L19 20l-.9-2.6-2.6-.9 2.6-.9L19 13z" />
        </svg>
        {loading ? 'Writing a draft…' : draft ? 'Regenerate' : 'Suggest reply with AI'}
      </button>

      {error && (
        <p className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-sm text-red-500">
          {error}
        </p>
      )}

      {draft !== null && (
        <div className="rounded-lg border border-brand-dark/30 bg-brand/10 p-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={6}
            aria-label="AI draft reply"
            className="w-full resize-y rounded-md border border-line bg-transparent p-2 text-sm outline-none focus:border-brand-dark"
          />
          <p className="mt-1 text-xs text-muted">
            AI drafts can be wrong. Read and edit it before you post.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => {
                onUse(draft);
                setDraft(null);
              }}
              className="rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-on-brand hover:bg-brand-dark"
            >
              Use this draft
            </button>
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="rounded-md px-3 py-1.5 text-sm text-muted hover:bg-navy/5 hover:text-navy"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
