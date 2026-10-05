'use client';
import { Suspense, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, ApiRequestError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { permissions } from '@/lib/permissions';
import { slaInfo } from '@/lib/time';
import { legalMoves, requiresNote, type TicketStatus } from '@/lib/transitions';
import { useToast } from '@/components/Toast';
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

function csvCell(v: unknown): string {
  const s = v == null ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-4">
          <div className="space-y-2">
            <div className="h-4 w-56 rounded bg-white/10" />
            <div className="h-3 w-20 rounded bg-white/5" />
          </div>
          <div className="h-6 w-16 rounded-full bg-white/10" />
        </div>
      ))}
    </div>
  );
}

function TicketsPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { show } = useToast();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [assigneeInput, setAssigneeInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [bulkTarget, setBulkTarget] = useState('');
  const [bulkNote, setBulkNote] = useState('');

  const role = user?.role;
  const canAssign = !!role && permissions.canAssign(role);
  const canDelete = !!role && permissions.canDeleteTicket(role);
  const canStatus = !!role && permissions.canChangeStatus(role);
  const bulkEnabled = canAssign || canDelete || canStatus;

  const queryString = searchParams.toString();

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    setSelected(new Set());
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
  }, [queryString, reloadKey]);

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

  const rows = state.status === 'ready' ? state.data.data : [];
  const allSelected = rows.length > 0 && rows.every((t) => selected.has(t.id));
  const selectedRows = rows.filter((t) => selected.has(t.id));
  const needsNoteUI =
    bulkTarget === 'in_progress' &&
    selectedRows.some((t) => requiresNote(t.status as TicketStatus, 'in_progress'));

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(rows.map((t) => t.id)));
  }

  async function runBulk(label: string, action: (id: number) => Promise<unknown>) {
    setBusy(true);
    const ids = Array.from(selected);
    const results = await Promise.allSettled(ids.map((id) => action(id)));
    const failed = results.filter((r) => r.status === 'rejected').length;
    const ok = ids.length - failed;
    show(
      failed
        ? `${label}: ${ok} done, ${failed} failed`
        : `${label}: ${ok} ticket${ok === 1 ? '' : 's'}`
    );
    setBusy(false);
    setSelected(new Set());
    setReloadKey((k) => k + 1);
  }

  function bulkAssign() {
    const parsed = Number(assigneeInput);
    if (!assigneeInput || Number.isNaN(parsed)) {
      show('Enter a numeric user ID');
      return;
    }
    runBulk('Assigned', (id) => api.assignTicket(String(id), parsed)).then(() =>
      setAssigneeInput('')
    );
  }

  function bulkDelete() {
    if (!confirm(`Delete ${selected.size} ticket(s)? This cannot be undone.`)) return;
    runBulk('Deleted', (id) => api.deleteTicket(String(id)));
  }

  async function bulkChangeStatus() {
    const target = bulkTarget as TicketStatus;
    if (!target) {
      show('Pick a status first');
      return;
    }
    const eligible = selectedRows.filter((t) =>
      legalMoves(t.status as TicketStatus).includes(target)
    );
    const skipped = selectedRows.length - eligible.length;
    if (eligible.length === 0) {
      show(`None of the selected tickets can move to ${target.replace('_', ' ')}`);
      return;
    }
    if (needsNoteUI && !bulkNote.trim()) {
      show('Reason is required for reopening closed tickets');
      return;
    }

    setBusy(true);
    const results = await Promise.allSettled(
      eligible.map((t) =>
        api.changeStatus(
          String(t.id),
          target,
          requiresNote(t.status as TicketStatus, target) ? bulkNote.trim() : undefined
        )
      )
    );
    const failed = results.filter((r) => r.status === 'rejected').length;
    const ok = eligible.length - failed;
    show(
      `Status: ${ok} done` +
        (skipped ? `, ${skipped} skipped (not allowed)` : '') +
        (failed ? `, ${failed} failed` : '')
    );
    setBusy(false);
    setSelected(new Set());
    setBulkTarget('');
    setBulkNote('');
    setReloadKey((k) => k + 1);
  }

  async function exportCsv() {
    if (state.status !== 'ready') return;
    setExporting(true);
    try {
      const pageSize = state.data.pageSize || 10;
      const totalPages = Math.min(Math.ceil(state.data.total / pageSize), 50);
      const base = new URLSearchParams(searchParams.toString());
      base.delete('page');

      const all: any[] = [];
      for (let p = 1; p <= totalPages; p++) {
        const q = new URLSearchParams(base);
        q.set('page', String(p));
        const res: Envelope<Ticket> = await api.getTickets(q.toString());
        all.push(...res.data);
      }

      const header = ['id', 'subject', 'status', 'priority', 'due_at', 'created_at'];
      const lines = [
        header.join(','),
        ...all.map((t) =>
          [t.id, t.subject, t.status, t.priority, t.due_at, t.created_at]
            .map(csvCell)
            .join(',')
        ),
      ];
      const blob = new Blob(['\uFEFF' + lines.join('\r\n')], {
        type: 'text/csv;charset=utf-8;',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tickets-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      show(`Exported ${all.length} ticket${all.length === 1 ? '' : 's'}`);
    } catch {
      show('Export failed');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="relative rounded-xl border border-teal-500/20 bg-gradient-to-br from-teal-950 via-zinc-900 to-black p-5 mb-6 overflow-hidden">
        <div className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full bg-teal-400/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="relative flex items-center justify-between gap-3">
          <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-2">
            <h1 className="text-2xl font-bold">Tickets</h1>
            <p className="text-zinc-400 text-sm mt-1">Track and manage support requests</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {state.status === 'ready' && rows.length > 0 && (
              <button
                onClick={exportCsv}
                disabled={exporting}
                className="rounded-md border border-white/20 px-3 py-2 text-sm text-zinc-200 transition-colors hover:border-teal-400 disabled:opacity-50"
              >
                {exporting ? 'Exporting…' : 'Export CSV'}
              </button>
            )}
            <Link
              href="/tickets/new"
              className="bg-teal-500 text-black font-semibold rounded-md px-4 py-2 text-sm transition-all hover:bg-teal-400 hover:scale-[1.02] active:scale-[0.98]"
            >
              + New ticket
            </Link>
          </div>
        </div>
      </div>

      <TicketFilters onChange={updateParam} />

      {state.status === 'loading' && <ListSkeleton />}
      {state.status === 'error' && (
        <p className="text-red-500 text-center py-8">{state.message}</p>
      )}

      {state.status === 'ready' && rows.length === 0 && (
        <div className="rounded-xl border border-white/10 bg-black/20 py-12 text-center">
          <p className="text-lg font-semibold text-zinc-200">
            {queryString ? 'No tickets match this filter' : 'No tickets yet'}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            {queryString
              ? 'Try removing a filter or clearing the search.'
              : 'Create your first ticket to get started.'}
          </p>
          <div className="mt-5 flex justify-center gap-2">
            {queryString && (
              <Link
                href="/tickets"
                className="rounded-md border border-white/20 px-4 py-2 text-sm hover:border-teal-400"
              >
                Clear filters
              </Link>
            )}
            <Link
              href="/tickets/new"
              className="rounded-md bg-teal-500 px-4 py-2 text-sm font-semibold text-black hover:bg-teal-400"
            >
              + New ticket
            </Link>
          </div>
        </div>
      )}

      {state.status === 'ready' && rows.length > 0 && (
        <>
          {bulkEnabled && (
            <div className="sticky top-[72px] z-30 mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-black/70 px-4 py-2.5 backdrop-blur">
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  className="accent-teal-500 h-4 w-4"
                  checked={allSelected}
                  onChange={toggleAll}
                />
                {selected.size > 0 ? `${selected.size} selected` : 'Select all'}
              </label>

              {selected.size > 0 && (
                <div className="ml-auto flex flex-wrap items-center gap-2">
                  {canStatus && (
                    <>
                      <select
                        aria-label="bulk status"
                        className="rounded-md border border-white/20 bg-black/40 px-2 py-1.5 text-sm outline-none focus:border-teal-400 [color-scheme:dark]"
                        value={bulkTarget}
                        onChange={(e) => setBulkTarget(e.target.value)}
                      >
                        <option value="">Set status…</option>
                        <option value="in_progress">In progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                      {needsNoteUI && (
                        <input
                          className="w-48 rounded-md border border-white/20 bg-transparent px-2 py-1.5 text-sm outline-none focus:border-teal-400"
                          placeholder="Reason for reopening"
                          value={bulkNote}
                          onChange={(e) => setBulkNote(e.target.value)}
                        />
                      )}
                      <button
                        onClick={bulkChangeStatus}
                        disabled={busy || !bulkTarget}
                        className="rounded-md border border-teal-500/30 px-3 py-1.5 text-sm text-teal-400 hover:bg-teal-500/10 disabled:opacity-50"
                      >
                        Apply
                      </button>
                    </>
                  )}
                  {canAssign && (
                    <>
                      <input
                        className="w-28 rounded-md border border-white/20 bg-transparent px-2 py-1.5 text-sm outline-none focus:border-teal-400"
                        placeholder="User ID"
                        value={assigneeInput}
                        onChange={(e) => setAssigneeInput(e.target.value)}
                      />
                      <button
                        onClick={bulkAssign}
                        disabled={busy}
                        className="rounded-md border border-teal-500/30 px-3 py-1.5 text-sm text-teal-400 hover:bg-teal-500/10 disabled:opacity-50"
                      >
                        Assign
                      </button>
                    </>
                  )}
                  {canDelete && (
                    <button
                      onClick={bulkDelete}
                      disabled={busy}
                      className="rounded-md border border-red-500/30 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <ul className="flex flex-col gap-3">
            {rows.map((t) => {
              const sla = slaInfo((t as any).due_at, t.status);
              return (
                <li key={t.id} className="flex items-stretch gap-3">
                  {bulkEnabled && (
                    <input
                      type="checkbox"
                      aria-label={`select ticket ${t.id}`}
                      className="accent-teal-500 h-4 w-4 self-center shrink-0"
                      checked={selected.has(t.id)}
                      onChange={() => toggle(t.id)}
                    />
                  )}
                  <Link
                    href={`/tickets/${t.id}`}
                    className={`block flex-1 min-w-0 rounded-xl border bg-black/30 backdrop-blur p-4 transition-all hover:border-teal-400/50 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-teal-500/10 ${
                      selected.has(t.id) ? 'border-teal-400/60' : 'border-white/10'
                    }`}
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
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <span
                          className={`text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full border capitalize ${
                            priorityStyles[t.priority] ?? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30'
                          }`}
                        >
                          {t.priority}
                        </span>
                        {sla && (
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${sla.cls}`}>
                            {sla.label}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
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
      <Suspense
        fallback={
          <div className="max-w-4xl mx-auto">
            <div className="rounded-xl border border-teal-500/20 bg-gradient-to-br from-teal-950 via-zinc-900 to-black p-5 mb-6 h-[88px] animate-pulse" />
            <div className="rounded-xl border border-white/10 bg-black/40 p-4 mb-6 h-[76px] animate-pulse" />
            <ListSkeleton />
          </div>
        }
      >
        <TicketsPageInner />
      </Suspense>
    </RequireAuth>
  );
}