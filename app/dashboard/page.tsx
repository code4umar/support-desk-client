'use client';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import RequireAuth from '@/components/RequireAuth';
import { useAuth } from '@/lib/auth-context';
import {
  ActivityList, AttentionList, GradientCard, HeroBanner, ReportsChart, SearchButton, StatusRing, type Ticket,
} from '@/components/dashboard/widgets';

const PRIO_RANK: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };

type PageInfo = { tickets?: Ticket[]; items?: Ticket[]; data?: Ticket[]; totalPages?: number; pages?: number; meta?: { totalPages?: number } };

const pick = (res: unknown): Ticket[] => {
  if (Array.isArray(res)) return res as Ticket[];
  const r = (res ?? {}) as PageInfo;
  return r.tickets ?? r.items ?? r.data ?? [];
};

// loads every page of tickets (the API's page-size parameter name differs between versions, so a few are tried)
async function fetchTickets(): Promise<Ticket[]> {
  const SIZE = 50;
  const sizeKeys = ['pageSize', 'per_page', 'perPage', 'take', 'size'];

  let sizeKey: string | null = null;
  let firstRes: unknown = null;
  for (const key of sizeKeys) {
    try {
      firstRes = await api.getTickets(`page=1&${key}=${SIZE}`);
      sizeKey = key;
      break;
    } catch (e) {
      if (!/should not exist/i.test((e as Error)?.message ?? '')) throw e;
    }
  }
  if (!firstRes) firstRes = await api.getTickets('page=1');

  const byId = new Map<number, Ticket>();
  for (const t of pick(firstRes)) byId.set(t.id, t);

  const info = (firstRes ?? {}) as PageInfo;
  const totalPages: number | undefined = info.totalPages ?? info.pages ?? info.meta?.totalPages;
  const maxPages = Math.min(totalPages ?? 20, 20);
  for (let page = 2; page <= maxPages; page++) {
    const q = sizeKey ? `page=${page}&${sizeKey}=${SIZE}` : `page=${page}`;
    const res: unknown = await api.getTickets(q);
    const items = pick(res);
    const before = byId.size;
    for (const t of items) byId.set(t.id, t);
    if (items.length === 0 || byId.size === before) break;
  }
  return Array.from(byId.values());
}

function Skeleton() {
  return (
    <div className="grid animate-pulse gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <div className="h-16 w-72 rounded-xl bg-navy/5" />
        <div className="h-40 rounded-2xl bg-navy/5" />
        <div className="h-64 rounded-2xl bg-navy/5" />
      </div>
      <div className="space-y-6">
        <div className="h-64 rounded-2xl bg-navy/5" />
        <div className="h-72 rounded-2xl bg-navy/5" />
      </div>
    </div>
  );
}

function DashboardInner() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [error, setError] = useState('');
  const [now] = useState(() => Date.now());

  useEffect(() => {
    fetchTickets().then(setTickets).catch((e) => setError(e?.message ?? 'Failed to load tickets'));
  }, []);

  const stats = useMemo(() => {
    const list = tickets ?? [];
    let open = 0, inProgress = 0, done = 0, overdue = 0, urgentOpen = 0, highInProgress = 0;
    const attention: (Ticket & { _overdue: boolean })[] = [];
    for (const t of list) {
      const active = t.status === 'open' || t.status === 'in_progress';
      if (t.status === 'open') open++;
      else if (t.status === 'in_progress') inProgress++;
      else done++;
      const isOver = !!(active && t.due_at && new Date(t.due_at).getTime() < now);
      if (isOver) overdue++;
      if (t.status === 'open' && (t.priority === 'urgent' || t.priority === 'high')) urgentOpen++;
      if (t.status === 'in_progress' && isOver) highInProgress++;
      if (active && (isOver || t.priority === 'urgent' || t.priority === 'high')) attention.push({ ...t, _overdue: isOver });
    }
    attention.sort((a, b) => {
      if (a._overdue !== b._overdue) return a._overdue ? -1 : 1;
      const pr = (PRIO_RANK[a.priority] ?? 9) - (PRIO_RANK[b.priority] ?? 9);
      return pr !== 0 ? pr : b.id - a.id;
    });
    return {
      open, inProgress, done, overdue, urgentOpen, highInProgress,
      recent: [...list].sort((a, b) => b.id - a.id).slice(0, 4),
      attention: attention.slice(0, 5), attentionTotal: attention.length,
    };
  }, [tickets, now]);

  if (error) return <p className="text-red-600 dark:text-red-400">{error}</p>;
  if (!tickets) return <Skeleton />;

  const first = (user?.name ?? '').trim().split(/\s+/)[0] || 'there';

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-navy">Hello, {first}</h1>
            <p className="mt-1 text-sm text-muted">Welcome back!</p>
          </div>
          <div className="hidden md:block xl:hidden"><SearchButton /></div>
        </div>

        <HeroBanner />

        <div className="grid gap-6 lg:grid-cols-[1fr_1.05fr]">
          <ActivityList tickets={stats.recent} />
          <div className="space-y-4">
            <GradientCard title="Open tickets" value={stats.open} footLabel="Urgent / high" footValue={stats.urgentOpen} from="#9af8f0" to="#1fe5d8" tone="light" href="/tickets?status=open" />
            <GradientCard title="In progress" value={stats.inProgress} footLabel="Overdue" footValue={stats.overdue} from="#3a5da0" to="#1d3057" tone="dark" href="/tickets?status=in_progress" />
          </div>
        </div>

        <AttentionList items={stats.attention} total={stats.attentionTotal} />
      </div>

      <aside className="space-y-6">
        <ReportsChart tickets={tickets} />
        <StatusRing open={stats.open} inProgress={stats.inProgress} done={stats.done} />
      </aside>
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
