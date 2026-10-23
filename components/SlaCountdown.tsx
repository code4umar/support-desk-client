'use client';
import { useEffect, useState } from 'react';

function span(ms: number) {
  const mins = Math.floor(Math.abs(ms) / 60000);
  const days = Math.floor(mins / 1440);
  const hrs = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (days >= 1) return `${days}d ${hrs}h`;
  if (hrs >= 1) return `${hrs}h ${m}m`;
  return `${m}m`;
}

// Live SLA badge for a ticket: "Due in 2h 10m" -> turns amber, then orange, then a pulsing red "Overdue 15m".
// Re-checks every 30 seconds, so the page does not need to be refreshed.
export default function SlaCountdown({ dueAt, status }: { dueAt?: string | null; status: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  if (!dueAt || status === 'resolved' || status === 'closed') return null;
  const due = new Date(dueAt).getTime();
  if (Number.isNaN(due)) return null;

  const left = due - now;
  const overdue = left < 0;
  const tone = overdue
    ? 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
    : left < 3600000
      ? 'border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-400'
      : left < 4 * 3600000
        ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400'
        : 'border-brand-dark/30 bg-brand/15 text-brand-dark';

  return (
    <span
      title={`SLA due ${new Date(dueAt).toLocaleString()}`}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${tone}`}
    >
      {overdue && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" aria-hidden="true" />}
      {overdue ? `Overdue ${span(left)}` : `Due in ${span(left)}`}
    </span>
  );
}
