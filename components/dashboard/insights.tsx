'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Category, KbInsights } from '@/types';
import { useFitCount, type Ticket } from './widgets';

const HOUR = 3_600_000;
const isActive = (t: Ticket) => t.status === 'open' || t.status === 'in_progress';

/* ---------- pure helpers (unit-tested) ---------- */

export type SlaBucketKey = 'breached' | 'soon' | 'today' | 'later';
export const SLA_BUCKETS: { key: SlaBucketKey; label: string; color: string }[] = [
  { key: 'breached', label: 'Breached', color: 'var(--sla-breached)' },
  { key: 'soon', label: 'Due in 4h', color: 'var(--sla-soon)' },
  { key: 'today', label: 'Due today', color: 'var(--sla-today)' },
  { key: 'later', label: 'Later', color: 'var(--sla-later)' },
];

// Active tickets grouped by how close their SLA deadline is.
export function slaBuckets(tickets: Ticket[], now: number) {
  const counts: Record<SlaBucketKey, number> = { breached: 0, soon: 0, today: 0, later: 0 };
  let total = 0;
  for (const t of tickets) {
    if (!isActive(t) || !t.due_at) continue;
    const msLeft = new Date(t.due_at).getTime() - now;
    const key: SlaBucketKey = msLeft < 0 ? 'breached' : msLeft < 4 * HOUR ? 'soon' : msLeft < 24 * HOUR ? 'today' : 'later';
    counts[key]++;
    total++;
  }
  return { counts, total };
}

export type PulseLevel = 'critical' | 'busy' | 'calm';

// One sentence that says how the desk is doing right now.
export function deskPulse(tickets: Ticket[], now: number, isStaff: boolean): { level: PulseLevel; text: string } {
  const { counts } = slaBuckets(tickets, now);
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
  if (!isStaff) {
    const mine = tickets.filter(isActive);
    const working = mine.filter((t) => t.status === 'in_progress').length;
    if (!mine.length) return { level: 'calm', text: 'You have no open tickets. Everything’s sorted.' };
    return {
      level: 'calm',
      text: `You have ${plural(mine.length, 'open ticket')}${working ? `; we’re actively working on ${working}` : ''}.`,
    };
  }
  if (counts.breached) {
    return {
      level: 'critical',
      text: `${plural(counts.breached, 'ticket')} past SLA${counts.soon ? ` and ${counts.soon} more due within 4 hours` : ''}. Start with the oldest.`,
    };
  }
  if (counts.soon || counts.today) {
    return {
      level: 'busy',
      text: `Nothing breached. ${counts.soon ? `${plural(counts.soon, 'ticket')} due within 4 hours` : `${plural(counts.today, 'ticket')} due today`}.`,
    };
  }
  return { level: 'calm', text: 'All clear: nothing is due in the next 24 hours.' };
}

// Known issues = tickets other tickets are linked to, busiest first.
export function knownIssues(tickets: Ticket[]) {
  const byId = new Map(tickets.map((t) => [t.id, t]));
  const groups = new Map<number, { linked: number; active: number }>();
  for (const t of tickets) {
    if (!t.known_issue_id) continue;
    const g = groups.get(t.known_issue_id) ?? { linked: 0, active: 0 };
    g.linked++;
    if (isActive(t)) g.active++;
    groups.set(t.known_issue_id, g);
  }
  return [...groups.entries()]
    .map(([id, g]) => ({ id, subject: byId.get(id)?.subject ?? `Ticket #${id}`, status: byId.get(id)?.status, ...g }))
    .sort((a, b) => b.active - a.active || b.linked - a.linked || b.id - a.id);
}

/* ---------- widgets ---------- */

const PULSE_STYLE: Record<PulseLevel, { label: string; dot: string; chip: string }> = {
  critical: { label: 'Needs action', dot: 'bg-[var(--sla-breached)]', chip: 'border-[var(--sla-breached)]/40' },
  busy: { label: 'Busy', dot: 'bg-[var(--sla-soon)]', chip: 'border-[var(--sla-soon)]/40' },
  calm: { label: 'Calm', dot: 'bg-brand', chip: 'border-brand/40' },
};

export function DeskPulse({ tickets, now, isStaff }: { tickets: Ticket[]; now: number; isStaff: boolean }) {
  const { level, text } = deskPulse(tickets, now, isStaff);
  const s = PULSE_STYLE[level];
  return (
    <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-navy" aria-live="polite">
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${s.chip}`}>
        <span className={`relative flex h-2 w-2`}>
          {level !== 'calm' && <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${s.dot}`} />}
          <span className={`relative inline-flex h-2 w-2 rounded-full ${s.dot}`} />
        </span>
        {s.label}
      </span>
      <span>{text}</span>
    </p>
  );
}

/* ---------- summary tiles for the top row ---------- */

// Plain number tile, e.g. "SLA breached". `alert` adds a status dot and
// colour, always next to the label text.
export function StatTile({ label, value, hint, href, alert = false }: { label: string; value: number; hint: string; href: string; alert?: boolean }) {
  return (
    <Link href={href} className="glass-card flex h-[116px] flex-col justify-between p-4 transition-transform hover:-translate-y-0.5">
      <p className="flex items-center gap-2 text-sm font-semibold text-navy">
        <span className={`h-2 w-2 rounded-full ${alert && value > 0 ? 'bg-[var(--sla-breached)]' : 'bg-brand'}`} aria-hidden="true" />
        {label}
      </p>
      <p className={`text-3xl font-bold tracking-[0.12em] ${alert && value > 0 ? 'text-[var(--sla-breached)]' : 'text-navy'}`}>{value}</p>
      <p className="text-xs uppercase tracking-wider text-muted">{hint}</p>
    </Link>
  );
}

// Share of tickets resolved or closed, with a small ring.
export function ResolvedTile({ done, total }: { done: number; total: number }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  const r = 26, c = 2 * Math.PI * r;
  return (
    <Link href="/tickets?status=resolved" className="glass-card flex h-[116px] items-center justify-between gap-3 p-4 transition-transform hover:-translate-y-0.5">
      <div className="flex h-full flex-col justify-between">
        <p className="flex items-center gap-2 text-sm font-semibold text-navy">
          <span className="h-2 w-2 rounded-full bg-[var(--kb-bar)]" aria-hidden="true" />
          Resolved
        </p>
        <p className="text-3xl font-bold tracking-[0.12em] text-navy">{done}</p>
        <p className="text-xs uppercase tracking-wider text-muted">of {total} tickets</p>
      </div>
      <svg viewBox="0 0 64 64" className="h-16 w-16 shrink-0 -rotate-90" role="img" aria-label={`${pct}% resolved`}>
        <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor" strokeWidth="7" className="text-navy/10" />
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--kb-bar)" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${(pct / 100) * c} ${c}`} />
        <text x="32" y="36" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--text)" transform="rotate(90 32 32)">{pct}%</text>
      </svg>
    </Link>
  );
}

export function SlaRadar({ tickets, now }: { tickets: Ticket[]; now: number }) {
  const { counts, total } = slaBuckets(tickets, now);
  return (
    <div className="glass-card p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-navy">SLA radar</h2>
        <p className="text-xs text-muted">{total} active ticket{total === 1 ? '' : 's'} by time left</p>
      </div>

      {total === 0 ? (
        <p className="py-6 text-sm text-muted">No active tickets with a deadline. Enjoy the quiet.</p>
      ) : (
        <>
          {/* one stacked bar: segment width = share of active tickets */}
          <div className="mt-4 flex h-4 w-full gap-[2px]" role="img" aria-label={SLA_BUCKETS.map((b) => `${b.label}: ${counts[b.key]}`).join(', ')}>
            {SLA_BUCKETS.filter((b) => counts[b.key] > 0).map((b, i, shown) => (
              <Link
                key={b.key}
                href={b.key === 'breached' ? '/tickets?overdue=true&sortBy=dueAt&order=asc' : '/tickets?sortBy=dueAt&order=asc'}
                title={`${b.label}: ${counts[b.key]} ticket${counts[b.key] === 1 ? '' : 's'}`}
                className={`min-w-[10px] transition-opacity hover:opacity-80 ${i === 0 ? 'rounded-l' : ''} ${i === shown.length - 1 ? 'rounded-r' : ''}`}
                style={{ flexGrow: counts[b.key], background: b.color }}
              />
            ))}
          </div>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs">
            {SLA_BUCKETS.map((b) => (
              <li key={b.key} className="flex items-center gap-1.5 text-muted">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: b.color }} aria-hidden="true" />
                {b.label} <span className="font-semibold text-navy">{counts[b.key]}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export function HelpCenterImpact() {
  const [data, setData] = useState<KbInsights | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    api.getKbInsights().then(setData).catch(() => setFailed(true));
  }, []);
  if (failed) return null;

  // a wide, short strip: number | helpful meter | articles to rewrite
  return (
    <div className="glass-card p-6">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-navy">Help Center impact</h2>
        <Link href="/help" className="text-xs text-brand-dark hover:underline">Open →</Link>
      </div>
      {!data ? (
        <div className="mt-4 h-24 animate-pulse rounded-xl bg-navy/5" />
      ) : (
        <div className="mt-3 grid gap-6 lg:grid-cols-3 lg:items-center">
          <div>
            <p className="text-4xl font-bold text-navy">{data.deflected_7d}</p>
            <p className="text-sm text-muted">ticket{data.deflected_7d === 1 ? '' : 's'} avoided this week by self-service</p>
          </div>

          <div>
            <div className="flex justify-between text-xs text-muted">
              <span>Found articles helpful (30 days)</span>
              <span className="font-semibold text-navy">
                {data.helpful_rate_30d === null ? 'No votes yet' : `${data.helpful_rate_30d}% of ${data.votes_30d}`}
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full rounded bg-navy/10" role="img" aria-label={`${data.helpful_rate_30d ?? 0}% helpful`}>
              <div className="h-2 rounded" style={{ width: `${data.helpful_rate_30d ?? 0}%`, background: 'var(--kb-bar)' }} />
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Needs a rewrite</h3>
            {data.needs_work.length === 0 ? (
              <p className="mt-1.5 text-sm text-muted">No article has been voted unhelpful in the last 30 days.</p>
            ) : (
              <ul className="mt-1.5 space-y-1.5">
                {data.needs_work.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 text-sm">
                    <Link href={`/help/${a.id}/edit`} className="min-w-0 truncate text-navy hover:text-brand-dark">{a.title}</Link>
                    <span className="shrink-0 text-xs text-muted">👎 {a.unhelpful} · 👍 {a.helpful}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Shows as many known issues as fit in the card's height.
export function KnownIssuesCard({ tickets }: { tickets: Ticket[] }) {
  const [listRef, fit] = useFitCount<HTMLUListElement>(59, 0, 3); // 58px row + 1px divider
  const issues = knownIssues(tickets).slice(0, fit);
  return (
    <div className="glass-card flex flex-col p-6 md:h-full md:min-h-0">
      <h2 className="text-lg font-semibold text-navy">Known issues</h2>
      <p className="text-xs text-muted">Fix one ticket, close all its duplicates</p>
      {issues.length === 0 ? (
        <p className="py-5 text-sm text-muted">None yet. On a ticket page, link duplicates to the main ticket.</p>
      ) : (
        <ul ref={listRef} className="mt-3 divide-y divide-line overflow-hidden md:min-h-0 md:flex-1">
          {issues.map((k) => (
            <li key={k.id}>
              <Link href={`/tickets/${k.id}`} className="flex h-[58px] items-center justify-between gap-3 text-sm hover:opacity-80">
                <span className="min-w-0">
                  <span className="block truncate text-navy">{k.subject} <span className="text-muted">#{k.id}</span></span>
                  <span className="text-xs text-muted">{k.linked} linked{k.status === 'resolved' || k.status === 'closed' ? ' · fixed' : ''}</span>
                </span>
                <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${k.active ? 'border-[var(--sla-soon)]/40 text-navy' : 'border-line text-muted'}`}>
                  {k.active ? `${k.active} waiting` : 'all resolved'}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CategoryMix() {
  const [cats, setCats] = useState<Category[] | null>(null);
  useEffect(() => {
    api.getCategories().then(setCats).catch(() => setCats([]));
  }, []);
  if (cats && cats.length === 0) return null;
  const max = Math.max(1, ...(cats ?? []).map((c) => c.ticket_count));
  const sorted = [...(cats ?? [])].sort((a, b) => b.ticket_count - a.ticket_count);

  return (
    <div className="glass-card flex flex-col p-6 md:h-full md:min-h-0">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-navy">Tickets by category</h2>
        <span className="text-xs text-muted">{(cats ?? []).reduce((n, c) => n + c.ticket_count, 0)} categorised</span>
      </div>
      {!cats ? (
        <div className="mt-3 h-24 animate-pulse rounded-xl bg-navy/5" />
      ) : (
        <>
        {/* column chart: the columns grow into whatever height the card has */}
        <ul className="mt-4 flex h-56 items-stretch gap-4 border-b border-line md:h-auto md:min-h-0 md:flex-1">
          {sorted.map((c) => (
            <li key={c.id} className="flex min-w-0 flex-1">
              <Link
                href={`/tickets?categoryId=${c.id}`}
                className="group flex w-full flex-col items-center"
                title={`${c.name}: ${c.ticket_count} tickets`}
              >
                <span className="flex w-full flex-1 flex-col items-center justify-end">
                  <span className="mb-1.5 text-sm font-semibold text-navy">{c.ticket_count}</span>
                  <span
                    className="block w-full max-w-[72px] rounded-t transition-opacity group-hover:opacity-80"
                    style={{ height: `${Math.max(2, (c.ticket_count / max) * 85)}%`, background: 'var(--kb-bar)' }}
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <ul className="mt-2 flex gap-4">
          {sorted.map((c) => (
            <li key={c.id} className="min-w-0 flex-1 truncate text-center text-xs text-muted" title={c.name}>{c.name}</li>
          ))}
        </ul>
        </>
      )}
    </div>
  );
}
