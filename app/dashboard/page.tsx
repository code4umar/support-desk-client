'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { slaInfo } from '@/lib/time';
import RequireAuth from '@/components/RequireAuth';
import TrendChart from '@/components/TrendChart';
import RoleWelcome from '@/components/RoleWelcome';

type Ticket = {
  id: number;
  subject: string;
  status: string;
  priority: string;
  due_at?: string | null;
  created_at?: string;
};

const STATUSES = ['open', 'in_progress', 'resolved', 'closed'];
const PRIORITIES = ['low', 'normal', 'high', 'urgent'];
const PRIO_RANK: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };

const statusColor: Record<string, string> = {
  open: 'bg-brand',
  in_progress: 'bg-amber-400',
  resolved: 'bg-green-400',
  closed: 'bg-zinc-500',
};
const prioColor: Record<string, string> = {
  low: 'bg-sky-400',
  normal: 'bg-indigo-400',
  high: 'bg-amber-400',
  urgent: 'bg-red-400',
};
const priorityStyles: Record<string, string> = {
  low: 'bg-sky-500/10 text-sky-700 border-sky-500/30',
  normal: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/30',
  high: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
  urgent: 'bg-red-500/10 text-red-600 border-red-500/30',
};

const pick = (res: any): Ticket[] =>
  Array.isArray(res) ? res : res?.tickets ?? res?.items ?? res?.data ?? [];

async function fetchTickets(): Promise<Ticket[]> {
  const SIZE = 50;
  const sizeKeys = ['pageSize', 'per_page', 'perPage', 'take', 'size'];

  let sizeKey: string | null = null;
  let firstRes: any = null;
  for (const key of sizeKeys) {
    try {
      firstRes = await api.getTickets(`page=1&${key}=${SIZE}`);
      sizeKey = key;
      break;
    } catch (e: any) {
      if (!/should not exist/i.test(e?.message ?? '')) throw e;
    }
  }
  if (!firstRes) firstRes = await api.getTickets('page=1');

  const byId = new Map<number, Ticket>();
  for (const t of pick(firstRes)) byId.set(t.id, t);

  const totalPages: number | undefined =
    firstRes?.totalPages ?? firstRes?.pages ?? firstRes?.meta?.totalPages;
  const maxPages = Math.min(totalPages ?? 20, 20);

  for (let page = 2; page <= maxPages; page++) {
    const q = sizeKey ? `page=${page}&${sizeKey}=${SIZE}` : `page=${page}`;
    const res: any = await api.getTickets(q);
    const items = pick(res);
    const before = byId.size;
    for (const t of items) byId.set(t.id, t);
    if (items.length === 0 || byId.size === before) break;
  }

  return Array.from(byId.values());
}

function Stat({
  label, value, tone, href,
}: { label: string; value: number | string; tone?: string; href?: string }) {
  const body = (
    <div className="rounded-xl border border-line bg-navy/[0.03] p-4 transition-colors hover:border-brand-dark/">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className={`mt-1 text-3xl font-bold ${tone ?? 'text-navy'}`}>{value}</div>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

function Bars({
  title, data, colors, param,
}: {
  title: string;
  data: Record<string, number>;
  colors: Record<string, string>;
  param: 'status' | 'priority';
}) {
  const max = Math.max(1, ...Object.values(data));
  return (
    <div className="rounded-xl border border-line bg-navy/[0.03] p-5">
      <h2 className="mb-4 text-sm font-semibold text-navy">{title}</h2>
      <div className="space-y-3">
        {Object.entries(data).map(([k, v]) => (
          <Link key={k} href={`/tickets?${param}=${k}`} className="group block">
            <div className="mb-1 flex justify-between text-xs text-muted group-hover:text-navy">
              <span className="capitalize">{k.replace('_', ' ')}</span>
              <span>{v}</span>
            </div>
            <div className="h-2 rounded-full bg-navy/5">
              <div
                className={`h-2 rounded-full ${colors[k] ?? 'bg-brand'} transition-all`}
                style={{ width: `${(v / max) * 100}%` }}
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-12 w-48 rounded-lg bg-navy/5" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-[84px] rounded-xl bg-navy/5" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-44 rounded-xl bg-navy/5" />
        <div className="h-44 rounded-xl bg-navy/5" />
      </div>
      <div className="h-56 rounded-xl bg-navy/5" />
    </div>
  );
}

function DashboardInner() {
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTickets()
      .then(setTickets)
      .catch((e) => setError(e?.message ?? 'Failed to load tickets'));
  }, []);

  const stats = useMemo(() => {
    const list = tickets ?? [];
    const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]));
    const byPrio = Object.fromEntries(PRIORITIES.map((p) => [p, 0]));
    const now = Date.now();
    let overdue = 0;
    const attention: (Ticket & { _overdue: boolean })[] = [];

    for (const t of list) {
      if (t.status in byStatus) byStatus[t.status]++;
      if (t.priority in byPrio) byPrio[t.priority]++;
      const active = t.status === 'open' || t.status === 'in_progress';
      const isOver = !!(active && t.due_at && new Date(t.due_at).getTime() < now);
      if (isOver) overdue++;
      if (active && (isOver || t.priority === 'urgent' || t.priority === 'high')) {
        attention.push({ ...t, _overdue: isOver });
      }
    }

    attention.sort((a, b) => {
      if (a._overdue !== b._overdue) return a._overdue ? -1 : 1;
      const pr = (PRIO_RANK[a.priority] ?? 9) - (PRIO_RANK[b.priority] ?? 9);
      return pr !== 0 ? pr : b.id - a.id;
    });

    const recent = [...list].sort((a, b) => b.id - a.id).slice(0, 5);
    return {
      total: list.length, byStatus, byPrio, overdue, recent,
      attention: attention.slice(0, 6), attentionTotal: attention.length,
    };
  }, [tickets]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!tickets) return <DashboardSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <RoleWelcome />
        <p className="text-sm text-muted">Overview of your support desk</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Stat label="Total tickets" value={stats.total} href="/tickets" />
        <Stat label="Open" value={stats.byStatus.open} tone="text-brand-dark" href="/tickets?status=open" />
        <Stat label="In progress" value={stats.byStatus.in_progress} tone="text-amber-700" href="/tickets?status=in_progress" />
        <Stat
          label="Overdue (SLA)"
          value={stats.overdue}
          tone={stats.overdue ? 'text-red-600' : 'text-navy'}
          href="/tickets?overdue=true&sortBy=dueAt&order=asc"
        />
        <Stat
          label="Resolved / closed"
          value={stats.byStatus.resolved + stats.byStatus.closed}
          tone="text-green-700"
          href="/tickets?status=resolved"
        />
      </div>

      {/* Needs attention */}
      <div className="rounded-xl border border-red-500/20 bg-red-500/[0.03] p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-navy">
            Needs attention{' '}
            {stats.attentionTotal > 0 && (
              <span className="ml-1 rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-600">
                {stats.attentionTotal}
              </span>
            )}
          </h2>
          <Link href="/tickets?overdue=true&sortBy=dueAt&order=asc" className="text-xs text-brand-dark hover:underline">
            View overdue →
          </Link>
        </div>
        {stats.attention.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted">
            Nothing urgent right now. Nice work.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {stats.attention.map((t) => {
              const sla = slaInfo(t.due_at, t.status);
              return (
                <li key={t.id}>
                  <Link
                    href={`/tickets/${t.id}`}
                    className="flex items-center justify-between gap-3 py-2.5 text-sm hover:text-navy"
                  >
                    <span className="min-w-0 truncate">
                      {t.subject} <span className="text-muted">#{t.id}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {sla && (
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${sla.cls}`}>
                          {sla.label}
                        </span>
                      )}
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase ${
                          priorityStyles[t.priority] ?? ''
                        }`}
                      >
                        {t.priority}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <TrendChart tickets={tickets} />
      <div className="grid gap-4 md:grid-cols-2">
        <Bars title="Tickets by status" data={stats.byStatus} colors={statusColor} param="status" />
        <Bars title="Tickets by priority" data={stats.byPrio} colors={prioColor} param="priority" />
      </div>

      <div className="rounded-xl border border-line bg-navy/[0.03] p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-navy">Latest tickets</h2>
          <Link href="/tickets" className="text-xs text-brand-dark hover:underline">View all →</Link>
        </div>
        <ul className="divide-y divide-line">
          {stats.recent.map((t) => (
            <li key={t.id}>
              <Link href={`/tickets/${t.id}`} className="flex items-center justify-between py-2.5 text-sm hover:text-navy">
                <span>{t.subject} <span className="text-muted">#{t.id}</span></span>
                <span className="text-xs capitalize text-muted">{t.status.replace('_', ' ')}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardInner />
    </RequireAuth>
  );
}