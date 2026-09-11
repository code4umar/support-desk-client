'use client';
import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, ApiRequestError } from '@/lib/api';
import type { Envelope, Ticket } from '@/types';
import TicketFilters from '@/components/TicketFilters';
import Pager from '@/components/Pager';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: Envelope<Ticket> };

function TicketsPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<State>({ status: 'loading' });

  const queryString = searchParams.toString();

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    api
      .getTickets(queryString)
      .then((data: Envelope<Ticket>) => {
        if (!cancelled) setState({ status: 'ready', data });
      })
      .catch((err) => {
        if (cancelled) return;
        const message =
          err instanceof ApiRequestError ? err.message : 'Failed to load tickets';
        setState({ status: 'error', message });
      });
    return () => {
      cancelled = true;
    };
  }, [queryString]);

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete('page');
      router.push(`/tickets?${params.toString()}`);
    },
    [searchParams, router]
  );

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Tickets</h1>
      <TicketFilters onChange={updateParam} />

      {state.status === 'loading' && <p>Loading…</p>}
      {state.status === 'error' && <p className="text-red-600">{state.message}</p>}
      {state.status === 'ready' && state.data.data.length === 0 && (
        <p>
          {queryString
            ? 'No tickets match this filter.'
            : 'You have no tickets.'}
        </p>
      )}
      {state.status === 'ready' && state.data.data.length > 0 && (
        <>
          <ul className="divide-y">
            {state.data.data.map((t) => (
              <li key={t.id} className="py-2">
                <a href={`/tickets/${t.id}`} className="font-medium">
                  {t.subject}
                </a>
                <div className="text-sm text-gray-500">
                  {t.status} · {t.priority}
                </div>
              </li>
            ))}
          </ul>
          <Pager
            page={state.data.page}
            pageSize={state.data.pageSize}
            total={state.data.total}
            onPageChange={(p) => updateParam('page', String(p))}
          />
        </>
      )}
    </div>
  );
}

export default function TicketsPage() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <TicketsPageInner />
    </Suspense>
  );
}