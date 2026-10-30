'use client';
import { useState } from 'react';
import { api } from '@/lib/api';

// "Was this helpful?" under an article. Voting again changes the vote.
export default function ArticleFeedback({ articleId }: { articleId: number }) {
  const [vote, setVote] = useState<boolean | null>(null);
  const [failed, setFailed] = useState(false);

  async function send(helpful: boolean) {
    setFailed(false);
    const previous = vote;
    setVote(helpful);
    try {
      await api.articleFeedback(articleId, helpful);
    } catch {
      setVote(previous);
      setFailed(true);
    }
  }

  const btn = (active: boolean) =>
    `rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
      active ? 'border-brand-dark bg-brand/15 text-brand-dark' : 'border-line text-navy hover:border-brand-dark/60'
    }`;

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-5">
      <p className="text-sm text-navy">
        {vote === null ? 'Was this article helpful?' : vote ? 'Thanks! Glad it helped.' : 'Thanks, we’ll use that to improve it.'}
      </p>
      <div className="flex gap-2">
        <button type="button" aria-pressed={vote === true} onClick={() => send(true)} className={btn(vote === true)}>
          👍 Yes
        </button>
        <button type="button" aria-pressed={vote === false} onClick={() => send(false)} className={btn(vote === false)}>
          👎 No
        </button>
      </div>
      {failed && <p className="text-xs text-red-500">Couldn’t save your vote. Try again.</p>}
    </div>
  );
}
