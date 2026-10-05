export function timeAgo(input?: string | null): string {
  if (!input) return '—';
  const t = new Date(input).getTime();
  if (Number.isNaN(t)) return String(input);
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(t).toLocaleDateString();
}

export function slaInfo(dueAt?: string | null, status?: string) {
  if (!dueAt || status === 'closed' || status === 'resolved') return null;
  const ms = new Date(dueAt).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  const mins = Math.floor(Math.abs(ms) / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  const text = days >= 1 ? `${days}d` : hrs >= 1 ? `${hrs}h` : `${mins}m`;
  if (ms < 0)
    return { overdue: true, label: `Overdue ${text}`, cls: 'bg-red-500/10 text-red-400 border-red-500/30' };
  return {
    overdue: false,
    label: `Due in ${text}`,
    cls: hrs < 24
      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
      : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
  };
}

export function initials(name?: string) {
  return (name ?? '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}