'use client';
import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, ApiRequestError } from '@/lib/api';
import type { Envelope, Ticket } from '@/types';
import TicketFilters from '@/components/TicketFilters';
import Pager from '@/components/Pager';
import RequireAuth from '@/components/RequireAuth';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: Envelope<Ticket> };

const priorityStyles: Record<string, string> = {
  low: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
  normal: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
  high: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  urgent: 'bg-red-500/10 text-red-400 border-red-500/30',
};

const statusStyles: Record<string, string> = {
  open: 'text-teal-400',
  in_progress: 'text-amber-400',
  resolved: 'text-green-400',
  closed: 'text-zinc-500',
};

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
      if (key !== 'page') params.delete('page');
      router.push(`/tickets?${params.toString()}`);
    },
    [searchParams, router]
  );

  return (
    <div className="max-w-4xl mx-auto">
            <div className="relative rounded-xl border border-teal-500/20 bg-gradient-to-br from-teal-950 via-zinc-900 to-black p-5 mb-6 overflow-hidden">
        <div className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full bg-teal-400/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-2">
            <h1 className="text-2xl font-bold">Tickets</h1>
            <p className="text-zinc-400 text-sm mt-1">Track and manage support requests</p>
          </div>
          <a
            href="/tickets/new"
            className="bg-teal-500 text-black font-semibold rounded-md px-4 py-2 text-sm transition-all hover:bg-teal-400 hover:scale-[1.02] active:scale-[0.98] shrink-0"
          >
            + New ticket
          </a>
        </div>
      </div>

      <TicketFilters onChange={updateParam} />

      {state.status === 'loading' && (
        <p className="text-zinc-400 text-center py-8">Loading…</p>
      )}
      {state.status === 'error' && (
        <p className="text-red-500 text-center py-8">{state.message}</p>
      )}
      {state.status === 'ready' && state.data.data.length === 0 && (
        <p className="text-zinc-400 text-center py-8 border border-white/10 rounded-xl bg-black/20">
          {queryString ? 'No tickets match this filter.' : 'You have no tickets.'}
        </p>
      )}
      {state.status === 'ready' && state.data.data.length > 0 && (
        <>
          <ul className="flex flex-col gap-3">
            {state.data.data.map((t) => (
              <li key={t.id}>
                <a
                  href={`/tickets/${t.id}`}
                  className="block rounded-xl border border-white/10 bg-black/30 backdrop-blur p-4 transition-all hover:border-teal-400/50 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-teal-500/10"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {t.subject}{' '}
                        <span className="text-zinc-500 font-normal">#{t.id}</span>
                      </p>
                      <p className={`text-sm mt-1 capitalize ${statusStyles[t.status] ?? 'text-zinc-400'}`}>
                        {t.status.replace('_', ' ')}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full border capitalize ${
                        priorityStyles[t.priority] ?? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </div>
                </a>
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
    <RequireAuth>
      <Suspense fallback={<p className="text-zinc-400 text-center py-8">Loading…</p>}>
        <TicketsPageInner />
      </Suspense>
    </RequireAuth>
  );
}