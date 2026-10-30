'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiRequestError } from '@/lib/api';
import { stashArticleDraft } from '@/lib/session';
import { useToast } from '@/components/Toast';

// On a solved ticket: AI turns the conversation into a help-article draft,
// which opens in the article editor for review.
export default function DraftArticleButton({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const { show } = useToast();
  const [busy, setBusy] = useState(false);

  async function draft() {
    setBusy(true);
    try {
      stashArticleDraft(await api.draftArticleFromTicket(ticketId));
      router.push('/help/new');
    } catch (err) {
      show(err instanceof ApiRequestError ? err.message : 'Could not draft an article', 'error');
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={draft}
      disabled={busy}
      className="rounded-md border border-brand-dark/30 px-3 py-1.5 text-sm text-brand-dark transition-colors hover:bg-brand/15 disabled:opacity-60"
      title="Turn this solved ticket into a help article"
    >
      {busy ? 'Drafting article…' : '✨ Turn into help article'}
    </button>
  );
}
