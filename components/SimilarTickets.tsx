'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { SimilarTickets as Similar } from '@/types';

// On the new-ticket form: "3 other people reported this recently". Customers
// only see the count (other people's tickets stay private); staff see links.
export default function SimilarTickets({ text }: { text: string }) {
  const [result, setResult] = useState<{ query: string; data: Similar } | null>(null);
  const query = text.trim();

  useEffect(() => {
    if (query.length < 6) return;
    let cancelled = false;
    const handle = setTimeout(() => {
      api
        .similarTickets(query)
        .then((data) => !cancelled && setResult({ query, data }))
        .catch(() => {});
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query]);

  const data = query.length >= 6 && result?.query === query ? result.data : null;
  if (!data || data.count === 0) return null;

  return (
    <aside aria-label="Similar tickets" className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
      <p className="text-sm font-semibold text-navy">
        {data.count === 1 ? '1 other person' : `${data.count} other people`} reported something similar recently
      </p>
      {data.items?.length ? (
        <ul className="mt-2 flex flex-col gap-1">
          {data.items.map((t) => (
            <li key={t.id} className="text-sm">
              <Link href={`/tickets/${t.id}`} target="_blank" className="text-brand-dark hover:underline">
                #{t.id} {t.subject}
              </Link>
              <span className="ml-2 text-xs text-muted">{t.status.replace('_', ' ')}</span>
              {t.known_issue_id && <span className="ml-2 text-xs text-muted">→ known issue #{t.known_issue_id}</span>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-xs text-muted">Our team may already be working on it. File your ticket anyway and we’ll keep you posted.</p>
      )}
    </aside>
  );
}
