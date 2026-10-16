'use client';
import { useEffect, useState } from 'react';
import { api, ApiRequestError } from '@/lib/api';
import { useToast } from '@/components/Toast';

type Saved = { stars: number; comment: string | null };

export function Star({ filled, size = 28 }: { filled: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={filled ? 'text-amber-400' : 'text-muted'}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinejoin="round"
    >
      <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1.1 5.8L12 16.8 6.7 19.6l1.1-5.8L3.5 9.7l5.9-.8L12 3.5z" />
    </svg>
  );
}

// Shows on a ticket page. The person who raised the ticket can rate it once it
// is resolved or closed; everyone else only sees the rating if there is one.
export default function RatingStars({
  ticketId,
  status,
  isRequester,
}: {
  ticketId: string;
  status: string;
  isRequester: boolean;
}) {
  const { show } = useToast();
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const done = status === 'resolved' || status === 'closed';

  useEffect(() => {
    let alive = true;
    setLoaded(false);
    api
      .getRating(ticketId)
      .then((res: any) => {
        if (!alive) return;
        setSaved(res?.rating ?? null);
        setStars(res?.rating?.stars ?? 0);
        setComment(res?.rating?.comment ?? '');
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, [ticketId]);

  if (!loaded) return null;
  const canRate = isRequester && done;
  if (!canRate && !saved) return null;

  async function submit() {
    if (stars < 1) {
      setError('Pick a star rating first.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res: any = await api.rateTicket(ticketId, stars, comment.trim() || undefined);
      setSaved(res?.rating ?? { stars, comment: comment.trim() || null });
      setEditing(false);
      show('Thanks for your feedback');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not save your rating.');
    } finally {
      setSaving(false);
    }
  }

  const card = 'rounded-xl border border-line bg-surface backdrop-blur p-6 mt-6';

  // read-only view
  if (saved && !editing) {
    return (
      <div className={card}>
        <h2 className="text-lg font-bold mb-2">Customer feedback</h2>
        <div className="flex items-center gap-1" aria-label={`${saved.stars} out of 5 stars`}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} filled={n <= saved.stars} />
          ))}
          <span className="ml-2 text-sm text-muted">{saved.stars} / 5</span>
        </div>
        {saved.comment && <p className="mt-2 text-sm text-navy">{saved.comment}</p>}
        {canRate && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mt-3 text-sm text-brand-dark hover:underline"
          >
            Change my rating
          </button>
        )}
      </div>
    );
  }

  // rating form
  const shown = hover || stars;
  return (
    <div className={card}>
      <h2 className="text-lg font-bold mb-1">How did we do?</h2>
      <p className="mb-3 text-sm text-muted">Your ticket is {status}. Rate the support you received.</p>
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={stars === n}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            onClick={() => setStars(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            className="rounded p-0.5 transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-dark"
          >
            <Star filled={n <= shown} size={34} />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={500}
        rows={2}
        placeholder="Anything you want to add? (optional)"
        className="mt-3 w-full resize-none rounded-md border border-line bg-transparent p-2 text-sm outline-none focus:border-brand-dark focus:ring-1 focus:ring-brand/50"
      />
      {error && (
        <p className="mt-2 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-sm text-red-500">
          {error}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-on-brand transition hover:bg-brand-dark disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Submit rating'}
        </button>
        {saved && (
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setStars(saved.stars);
              setComment(saved.comment ?? '');
            }}
            className="rounded-md px-4 py-2 text-sm text-muted hover:bg-navy/5 hover:text-navy"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
