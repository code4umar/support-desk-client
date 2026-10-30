'use client';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import RequireAuth from '@/components/RequireAuth';
import { useAuth } from '@/lib/auth-context';
import {
  ActivityList, AttentionList, GradientCard, HeroBanner, ReportsChart, type Ticket,
} from '@/components/dashboard/widgets';
import {
  CategoryMix, DeskPulse, HelpCenterImpact, KnownIssuesCard, ResolvedTile, SlaRadar, StatTile,
} from '@/components/dashboard/insights';
import ViewTabs from '@/components/ViewTabs';

type DashView = 'overview' | 'workload' | 'insights';

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
    <div className="animate-pulse space-y-5">
      <div className="h-16 w-72 rounded-xl bg-navy/5" />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="h-72 rounded-2xl bg-navy/5" />
        <div className="h-72 rounded-2xl bg-navy/5" />
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
  const [view, setView] = useState<DashView>('overview');

  useEffect(() => {
    fetchTickets().then(setTickets).catch((e) => setError(e?.message ?? 'Failed to load tickets'));
  }, []);

  const stats = useMemo(() => {
    const list = tickets ?? [];
    let open = 0, inProgress = 0, done = 0, overdue = 0, urgentOpen = 0, overdueInProgress = 0;
    const attention: (Ticket & { _overdue: boolean })[] = [];
    for (const t of list) {
      const active = t.status === 'open' || t.status === 'in_progress';
      if (t.status === 'open') open++;
      else if (t.status === 'in_progress') inProgress++;
      else done++;
      const isOver = !!(active && t.due_at && new Date(t.due_at).getTime() < now);
      if (isOver) overdue++;
      if (t.status === 'open' && (t.priority === 'urgent' || t.priority === 'high')) urgentOpen++;
      if (t.status === 'in_progress' && isOver) overdueInProgress++;
      if (active && (isOver || t.priority === 'urgent' || t.priority === 'high')) attention.push({ ...t, _overdue: isOver });
    }
    attention.sort((a, b) => {
      if (a._overdue !== b._overdue) return a._overdue ? -1 : 1;
      const pr = (PRIO_RANK[a.priority] ?? 9) - (PRIO_RANK[b.priority] ?? 9);
      return pr !== 0 ? pr : b.id - a.id;
    });
    return {
      open, inProgress, done, overdue, urgentOpen, overdueInProgress,
      // lists trim these to however many rows fit on screen
      recent: [...list].sort((a, b) => b.id - a.id).slice(0, 15),
      attention: attention.slice(0, 15), attentionTotal: attention.length,
    };
  }, [tickets, now]);

  if (error) return <p className="text-red-600 dark:text-red-400">{error}</p>;
  if (!tickets) return <Skeleton />;

  const first = (user?.name ?? '').trim().split(/\s+/)[0] || 'there';
  const isStaff = user?.role === 'agent' || user?.role === 'admin';

  // Each tab fills exactly one screen: a row of summary tiles (Overview) or a
  // summary card on top, and cards below that stretch to the bottom. Lists
  // show as many rows as fit, so nothing scrolls and nothing sits half-empty.
  const tabs: { id: DashView; label: string; badge?: number }[] = isStaff
    ? [
        { id: 'overview', label: 'Overview' },
        { id: 'workload', label: 'Workload', badge: stats.attentionTotal },
        { id: 'insights', label: 'Insights' },
      ]
    : [
        { id: 'overview', label: 'Overview' },
        { id: 'insights', label: 'Activity', badge: stats.attentionTotal },
      ];
  const twoRows = 'grid gap-5 md:h-full md:grid-rows-[auto_minmax(0,1fr)]';

  return (
    <div className="flex flex-col gap-5 md:h-full md:min-h-0">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-navy">Hello, {first}</h1>
          <DeskPulse tickets={tickets} now={now} isStaff={isStaff} />
        </div>
        <ViewTabs label="Dashboard views" tabs={tabs} value={view} onChange={setView} />
      </div>

      <div className="md:min-h-0 md:flex-1">
        {view === 'overview' && (
          <div className={twoRows}>
            <div className={`grid gap-4 sm:grid-cols-2 ${isStaff ? 'xl:grid-cols-4' : 'xl:grid-cols-3'}`}>
              <GradientCard compact title="Open tickets" value={stats.open} footLabel="Urgent / high" footValue={stats.urgentOpen} from="#9af8f0" to="#1fe5d8" tone="light" href="/tickets?status=open" />
              <GradientCard compact title="In progress" value={stats.inProgress} footLabel="Overdue" footValue={stats.overdueInProgress} from="#3a5da0" to="#1d3057" tone="dark" href="/tickets?status=in_progress" />
              {isStaff && (
                <StatTile alert label="Past SLA" value={stats.overdue} hint="open or in progress" href="/tickets?overdue=true&sortBy=dueAt&order=asc" />
              )}
              <ResolvedTile done={stats.done} total={tickets.length} />
            </div>
            <div className="grid gap-5 md:min-h-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
              <ActivityList tickets={stats.recent} />
              {isStaff ? <ReportsChart tickets={tickets} /> : <HeroBanner className="md:h-full" />}
            </div>
          </div>
        )}

        {view === 'workload' && isStaff && (
          <div className={twoRows}>
            <SlaRadar tickets={tickets} now={now} />
            <div className="grid gap-5 md:min-h-0 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
              <AttentionList items={stats.attention} total={stats.attentionTotal} />
              <KnownIssuesCard tickets={tickets} />
            </div>
          </div>
        )}

        {view === 'insights' &&
          (isStaff ? (
            <div className={twoRows}>
              <HelpCenterImpact />
              <CategoryMix />
            </div>
          ) : (
            <div className="grid gap-5 md:h-full lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
              <ReportsChart tickets={tickets} />
              <AttentionList items={stats.attention} total={stats.attentionTotal} />
            </div>
          ))}
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
