'use client';
import { useMemo } from 'react';

const DAYS = 14;

function key(d: Date) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export default function TrendChart({
  tickets,
}: {
  tickets: { created_at?: string | null }[];
}) {
  const data = useMemo(() => {
    const days: { k: string; label: string; count: number }[] = [];
    const today = new Date();
    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      days.push({
        k: key(d),
        label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        count: 0,
      });
    }
    const idx = new Map(days.map((d, i) => [d.k, i]));
    for (const t of tickets) {
      if (!t.created_at) continue;
      const dt = new Date(t.created_at);
      if (Number.isNaN(dt.getTime())) continue;
      const i = idx.get(key(dt));
      if (i !== undefined) days[i].count++;
    }
    return days;
  }, [tickets]);

  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-300">Tickets created (last 14 days)</h2>
        <span className="text-xs text-zinc-500">{total} total</span>
      </div>
      <div className="flex h-32 items-end gap-1.5">
        {data.map((d) => (
          <div key={d.k} className="group flex h-full flex-1 flex-col justify-end" title={`${d.label}: ${d.count}`}>
            <div className="mb-1 text-center text-[10px] text-zinc-500 opacity-0 group-hover:opacity-100">
              {d.count}
            </div>
            <div
              className="w-full rounded-t bg-teal-400/80 transition-all group-hover:bg-teal-300"
              style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count ? 4 : 2, opacity: d.count ? 1 : 0.25 }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-zinc-600">
        <span>{data[0].label}</span>
        <span>{data[data.length - 1].label}</span>
      </div>
    </div>
  );
}