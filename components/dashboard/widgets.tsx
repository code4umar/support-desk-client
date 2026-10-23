'use client';
import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';

export type Ticket = {
  id: number;
  subject: string;
  status: string;
  priority: string;
  due_at?: string | null;
  created_at?: string;
};

export const PRIO_COLOR: Record<string, string> = { low: '#38bdf8', normal: '#4f7cff', high: '#ff9f1c', urgent: '#ef4565' };
const STATUS_PERCENT: Record<string, number> = { open: 25, in_progress: 60, resolved: 100, closed: 100 };

/* ---------- small shared pieces ---------- */
export function LogoMark({ className = '', light = false }: { className?: string; light?: boolean }) {
  return (
    <svg viewBox="0 0 661 462" className={className} aria-hidden="true">
      <path fill={light ? '#f1f5fb' : 'currentColor'} d="M294,92 L49,138 L6,242 L157,444 L201,358 L103,223 L269,181Z M508,18 L462,103 L560,237 L392,281 L368,369 L614,323 L655,216Z" />
      <path fill="#2ee6d6" d="M456,6 L376,11 L207,456 L291,447Z" />
    </svg>
  );
}

export function SearchButton({ compact = false }: { compact?: boolean }) {
  const open = () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
  return (
    <button
      type="button"
      onClick={open}
      aria-label="Search"
      className={`glass-card flex h-11 items-center gap-2.5 rounded-xl px-3.5 text-sm text-muted transition-colors hover:border-brand hover:text-navy ${compact ? 'lg:w-44' : 'w-52'}`}
    >
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
      </svg>
      <span className={compact ? 'hidden lg:inline' : ''}>Search</span>
      <kbd className="ml-auto hidden rounded border border-line px-1.5 py-0.5 text-[10px] lg:inline">Ctrl K</kbd>
    </button>
  );
}

function ProgressRing({ percent, color, size = 46 }: { percent: number; color: string; size?: number }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeOpacity={0.22} strokeWidth={3} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeDasharray={`${(percent / 100) * c} ${c}`} />
      </svg>
      <span className="absolute inset-[5px] flex items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: color }}>
        {percent}%
      </span>
    </span>
  );
}

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true }) : '';

/* ---------- hero banner ---------- */
export function HeroBanner() {
  return (
    <div className="glass-card relative overflow-hidden px-7 py-7">
      <div className="relative z-10 max-w-[60%]">
        <h2 className="text-2xl font-semibold leading-snug text-navy">
          Something needs fixing?
          <br />
          Create a ticket
        </h2>
        <p className="mt-2 text-sm text-muted">Describe the issue and the team gets on it.</p>
        <Link href="/tickets/new" className="nav-active mt-5 inline-block rounded-xl px-5 py-2.5 text-sm font-semibold">
          New ticket
        </Link>
      </div>
      <svg className="pointer-events-none absolute right-0 top-0 h-full w-[46%] min-w-[180px]" viewBox="0 0 300 170" preserveAspectRatio="xMaxYMid meet" aria-hidden="true">
        <defs>
          <radialGradient id="hb-glow" cx=".5" cy=".5" r=".5">
            <stop offset="0" stopColor="var(--accent)" stopOpacity=".55" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="190" cy="88" r="84" fill="url(#hb-glow)" />
        <circle cx="190" cy="88" r="58" fill="var(--glass-top)" stroke="var(--glass-border)" />
        <g transform="translate(190 88) scale(.17) translate(-330.5 -231)">
          <path fill="var(--text)" d="M294,92 L49,138 L6,242 L157,444 L201,358 L103,223 L269,181Z M508,18 L462,103 L560,237 L392,281 L368,369 L614,323 L655,216Z" />
          <path fill="#2ee6d6" d="M456,6 L376,11 L207,456 L291,447Z" />
        </g>
        <rect x="96" y="40" width="34" height="34" rx="11" fill="var(--glass-top)" stroke="var(--glass-border)" />
        <path d="M105 52h16a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-8l-5 4v-4h-3a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z" fill="none" stroke="var(--text)" strokeWidth="1.6" strokeLinejoin="round" transform="translate(-1 -2)" />
        <rect x="248" y="104" width="32" height="32" rx="10" fill="var(--glass-top)" stroke="var(--glass-border)" />
        <path d="M257 120l5 5 9-10" fill="none" stroke="#2ee6d6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="262" cy="34" r="3" fill="#ffb27d" />
        <circle cx="132" cy="136" r="2.5" fill="var(--text)" opacity=".6" />
      </svg>
    </div>
  );
}

/* ---------- recent tickets ("top activities") ---------- */
export function ActivityList({ tickets }: { tickets: Ticket[] }) {
  return (
    <div className="glass-card p-6">
      <h3 className="mb-4 text-lg font-semibold text-navy">Recent tickets</h3>
      {tickets.length === 0 ? (
        <p className="py-6 text-sm text-muted">No tickets yet.</p>
      ) : (
        <ul className="space-y-4">
          {tickets.map((t) => (
            <li key={t.id}>
              <Link href={`/tickets/${t.id}`} className="flex items-center justify-between gap-3 rounded-lg transition-opacity hover:opacity-80">
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-medium text-navy">{t.subject}</span>
                  <span className="block text-xs text-muted">
                    #{t.id} · {fmtDate(t.created_at)}
                  </span>
                </span>
                <ProgressRing percent={STATUS_PERCENT[t.status] ?? 25} color={PRIO_COLOR[t.priority] ?? '#38a9e8'} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------- gradient number cards (like the pink / blue cards) ---------- */
export function GradientCard({ title, value, footLabel, footValue, from, to, href, tone = 'dark' }: { title: string; value: number; footLabel: string; footValue: number; from: string; to: string; href: string; tone?: 'light' | 'dark' }) {
  return (
    <Link href={href} className={`relative block h-[150px] overflow-hidden rounded-2xl p-5 shadow-lg ring-1 ring-white/10 transition-transform hover:-translate-y-0.5 ${tone === 'light' ? 'text-[#213558]' : 'text-white'}`} style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
      <svg className="pointer-events-none absolute right-0 top-0 h-full w-[48%]" viewBox="0 0 140 150" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
        <path d="M140 0H70a70 70 0 0 1 70 70z" fill="#fff" opacity=".92" />
        <path d="M140 70a70 70 0 0 1-70 70h70z" fill="#fff" opacity=".55" />
        <path d="M70 0a70 70 0 0 0-70 70h70z" fill="#fff" opacity=".3" />
        <path d="M0 70a70 70 0 0 0 70 70V70z" fill="#fff" opacity=".18" />
      </svg>
      <div className="relative">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <LogoMark className="h-3.5 w-5" light={tone === 'dark'} />
          {title}
        </p>
        <p className="mt-4 text-4xl font-bold tracking-[0.12em]">{value}</p>
        <p className="mt-3 text-xs font-medium uppercase tracking-wider opacity-90">
          {footLabel} <span className="ml-1 text-sm font-bold tracking-normal">{footValue}</span>
        </p>
      </div>
      <span className="absolute bottom-4 right-5 flex">
        <span className={`h-7 w-7 rounded-full ${tone === 'light' ? 'bg-[#213558]/60' : 'bg-black/45'}`} />
        <span className="-ml-3 h-7 w-7 rounded-full bg-white/60" />
      </span>
    </Link>
  );
}

/* ---------- reports line chart ---------- */
const RANGES = [{ label: '7 days', days: 7 }, { label: '14 days', days: 14 }, { label: '30 days', days: 30 }];
const W = 300, H = 190, PL = 34, PR = 12, PT = 20, PB = 28;

function smoothPath(pts: { x: number; y: number }[]) {
  if (pts.length < 2) return '';
  const clampY = (y: number) => Math.min(H - PB, Math.max(PT, y));
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2;
    d += ` C${p1.x + (p2.x - p0.x) / 6},${clampY(p1.y + (p2.y - p0.y) / 6)} ${p2.x - (p3.x - p1.x) / 6},${clampY(p2.y - (p3.y - p1.y) / 6)} ${p2.x},${p2.y}`;
  }
  return d;
}

export function ReportsChart({ tickets }: { tickets: Ticket[] }) {
  const [days, setDays] = useState(14);
  const [hover, setHover] = useState<number | null>(null);
  const box = useRef<HTMLDivElement>(null);

  const series = useMemo(() => {
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const out = Array.from({ length: days }, (_, i) => {
      const d = new Date(end);
      d.setDate(end.getDate() - (days - 1 - i));
      return { date: d, count: 0 };
    });
    for (const t of tickets) {
      if (!t.created_at) continue;
      const c = new Date(t.created_at);
      c.setHours(0, 0, 0, 0);
      const idx = Math.round((c.getTime() - out[0].date.getTime()) / 86400000);
      if (idx >= 0 && idx < days) out[idx].count++;
    }
    return out;
  }, [tickets, days]);

  const max = Math.max(1, ...series.map((s) => s.count));
  const yMax = Math.max(4, Math.ceil(max / 4) * 4);
  const pts = series.map((s, i) => ({ x: PL + (i * (W - PL - PR)) / (series.length - 1), y: PT + (1 - s.count / yMax) * (H - PT - PB) }));
  const active = hover ?? series.length - 1;
  const step = Math.ceil(series.length / 6);
  const total = series.reduce((a, s) => a + s.count, 0);

  function onMove(e: React.PointerEvent) {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    const x = ((e.clientX - r.left) / r.width) * W;
    let best = 0;
    pts.forEach((p, i) => { if (Math.abs(p.x - x) < Math.abs(pts[best].x - x)) best = i; });
    setHover(best);
  }

  return (
    <div className="glass-card p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-navy">Reports</h3>
        <select
          aria-label="Report range"
          value={days}
          onChange={(e) => { setDays(Number(e.target.value)); setHover(null); }}
          className="glass-card rounded-xl px-3 py-2 text-sm text-navy outline-none"
        >
          {RANGES.map((r) => <option key={r.days} value={r.days}>{r.label}</option>)}
        </select>
      </div>
      <div ref={box} className="relative" onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Tickets created in the last ${days} days: ${total}`}>
          {[0, 1, 2, 3, 4].map((i) => {
            const y = PT + (i * (H - PT - PB)) / 4;
            return (
              <g key={i}>
                <line x1={PL} x2={W - PR} y1={y} y2={y} stroke="currentColor" className="text-navy/10" strokeDasharray="2 5" />
                <text x={PL - 8} y={y + 3} textAnchor="end" fontSize="9" fill="currentColor" className="text-muted">{Math.round(yMax - (i * yMax) / 4)}</text>
              </g>
            );
          })}
          <path d={smoothPath(pts)} fill="none" stroke="var(--text)" strokeWidth="2.6" strokeLinecap="round" />
          <circle cx={pts[active].x} cy={pts[active].y} r="5.5" fill="#ff9f1c" stroke="var(--text)" strokeWidth="1.5" />
          {series.map((s, i) => (i === active || (i % step === 0 && Math.abs(i - active) >= Math.max(2, Math.ceil(step * 0.7)))) ? (
            <g key={i}>
              {i === active && <rect x={pts[i].x - 20} y={H - 20} width="40" height="16" rx="8" fill="currentColor" className="text-navy/10" />}
              <text x={pts[i].x} y={H - 8} textAnchor="middle" fontSize="8.5" fill="currentColor" className={i === active ? 'text-navy' : 'text-muted'}>
                {s.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </text>
            </g>
          ) : null)}
        </svg>
        <div className="glass-card pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[135%] whitespace-nowrap rounded-xl px-3 py-1.5 text-center" style={{ left: `clamp(16%, ${(pts[active].x / W) * 100}%, 84%)`, top: `${(pts[active].y / H) * 100}%`, background: 'var(--card)' }}>
          <span className="block text-[10px] text-muted">Created</span>
          <span className="block text-sm font-semibold text-navy">{series[active].count} {series[active].count === 1 ? 'ticket' : 'tickets'}</span>
        </div>
      </div>
    </div>
  );
}

/* ---------- status ring ---------- */
export function StatusRing({ open, inProgress, done }: { open: number; inProgress: number; done: number }) {
  const total = open + inProgress + done;
  const R = 62, C = 2 * Math.PI * R, GAP = total > 0 && [open, inProgress, done].filter(Boolean).length > 1 ? 9 : 0;
  const parts = [
    { label: 'Resolved', value: done, color: '#1fe5d8' },
    { label: 'In progress', value: inProgress, color: '#4f7cff' },
    { label: 'Open', value: open, color: '#ff9f1c' },
  ];
  let acc = 0;
  const arcs = parts.map((p) => {
    const len = total ? (p.value / total) * C : 0;
    const a = { ...p, len, start: acc };
    acc += len;
    return a;
  });
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="glass-card p-5">
      <div className="relative mx-auto h-[180px] w-[180px]">
        <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90" role="img" aria-label={`${pct}% of tickets resolved`}>
          <circle cx="80" cy="80" r={R} fill="none" stroke="currentColor" strokeWidth="13" className="text-navy/10" />
          {arcs.filter((a) => a.len > 0).map((a) => (
            <g key={a.label}>
              <circle cx="80" cy="80" r={R} fill="none" stroke={a.color} strokeWidth="13" strokeLinecap="round" strokeDasharray={`${Math.max(a.len - GAP, 0.5)} ${C}`} strokeDashoffset={-(a.start + GAP / 2)} />
              <circle cx={80 + R * Math.cos((a.start / C) * 2 * Math.PI)} cy={80 + R * Math.sin((a.start / C) * 2 * Math.PI)} r="3.2" fill="#fff" opacity=".9" />
            </g>
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-light text-navy">{pct}<span className="text-lg">%</span></span>
          <span className="text-xs text-muted">resolved</span>
        </div>
      </div>
      <ul className="mt-5 space-y-3 px-1">
        {[...parts].reverse().map((p) => (
          <li key={p.label} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2.5 text-navy">
              <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
              {p.label}
            </span>
            <span className="font-medium text-navy">{p.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- needs attention ---------- */
export function AttentionList({ items, total }: { items: (Ticket & { _overdue: boolean })[]; total: number }) {
  return (
    <div className="glass-card p-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-navy">
          Needs attention {total > 0 && <span className="ml-1.5 rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-600 dark:text-red-400">{total}</span>}
        </h3>
        <Link href="/tickets?overdue=true&sortBy=dueAt&order=asc" className="text-xs text-brand-dark hover:underline">View all →</Link>
      </div>
      {items.length === 0 ? (
        <p className="py-4 text-sm text-muted">Nothing urgent right now. Nice work.</p>
      ) : (
        <ul className="divide-y divide-line">
          {items.map((t) => (
            <li key={t.id}>
              <Link href={`/tickets/${t.id}`} className="flex items-center justify-between gap-3 py-2.5 text-sm hover:opacity-80">
                <span className="min-w-0 truncate text-navy">{t.subject} <span className="text-muted">#{t.id}</span></span>
                <span className="flex shrink-0 gap-2">
                  {t._overdue && <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[11px] text-red-600 dark:text-red-400">Overdue</span>}
                  <span className="rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase" style={{ color: PRIO_COLOR[t.priority], borderColor: `${PRIO_COLOR[t.priority]}55`, background: `${PRIO_COLOR[t.priority]}1a` }}>{t.priority}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
