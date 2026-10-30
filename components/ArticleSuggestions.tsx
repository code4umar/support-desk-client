'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { ArticleSummary } from '@/types';

// Self-service step on the new-ticket form: as the customer types, show the
// help articles that match, so they can fix it themselves before filing.
// "This solved it" is recorded as a ticket that never had to be filed.
export default function ArticleSuggestions({ text, onSolved }: { text: string; onSolved?: (article: ArticleSummary) => void }) {
  // results remember which text they were for, so stale ones are simply not shown
  const [result, setResult] = useState<{ query: string; articles: ArticleSummary[] }>({ query: '', articles: [] });
  const query = text.trim();

  useEffect(() => {
    if (query.length < 3) return;
    let cancelled = false;
    const handle = setTimeout(() => {
      const qs = new URLSearchParams({ q: query, limit: '3' });
      api
        .searchArticles(qs.toString())
        .then((rows) => !cancelled && setResult({ query, articles: rows }))
        .catch(() => !cancelled && setResult({ query, articles: [] }));
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query]);

  const articles = query.length >= 3 && result.query === query ? result.articles : [];
  if (!articles.length) return null;

  return (
    <aside aria-label="Suggested articles" className="rounded-lg border border-brand/30 bg-brand/5 p-4">
      <p className="text-sm font-semibold text-navy">These articles might answer your question</p>
      <ul className="mt-2 flex flex-col gap-2">
        {articles.map((a) => (
          <li key={a.id} className="flex items-start justify-between gap-3">
            <span className="min-w-0">
              <Link href={`/help/${a.id}`} target="_blank" className="text-sm font-medium text-brand-dark hover:underline">
                {a.title}
              </Link>
              <span className="line-clamp-2 block text-xs text-muted">{a.excerpt}</span>
            </span>
            {onSolved && (
              <button
                type="button"
                onClick={() => {
                  api.articleFeedback(a.id, true, 'ticket_form').catch(() => {});
                  onSolved(a);
                }}
                className="shrink-0 rounded-md border border-brand-dark/40 px-2.5 py-1 text-xs font-semibold text-brand-dark hover:bg-brand/15"
              >
                ✓ This solved it
              </button>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}
