export type DonutSlice = { label: string; value: number; color: string };

// Simple SVG donut + legend (no chart library needed).
export default function DonutChart({ title, slices }: { title: string; slices: DonutSlice[] }) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const R = 52;
  const C = 2 * Math.PI * R;

  const arcs = slices.map((s, i) => {
    const before = slices.slice(0, i).reduce((sum, x) => sum + x.value, 0);
    const len = total > 0 ? (s.value / total) * C : 0;
    const offset = total > 0 ? (before / total) * C : 0;
    return { ...s, len, offset };
  });

  return (
    <div className="rounded-xl border border-line bg-navy/[0.03] p-5">
      <h2 className="mb-4 text-sm font-semibold text-navy">{title}</h2>
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-10">
        <div className="relative h-40 w-40 shrink-0">
          <svg
            viewBox="0 0 140 140"
            className="h-full w-full -rotate-90"
            role="img"
            aria-label={`${title}: ${slices.map((s) => `${s.label} ${s.value}`).join(', ')}`}
          >
            <circle cx="70" cy="70" r={R} fill="none" stroke="currentColor" strokeWidth="16" className="text-navy/10" />
            {arcs.map((a) =>
              a.len > 0 ? (
                <circle
                  key={a.label}
                  cx="70"
                  cy="70"
                  r={R}
                  fill="none"
                  stroke={a.color}
                  strokeWidth="16"
                  strokeDasharray={`${a.len} ${C - a.len}`}
                  strokeDashoffset={-a.offset}
                  style={{ transition: 'stroke-dasharray .6s ease' }}
                />
              ) : null,
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-navy">{total}</span>
            <span className="text-xs text-muted">tickets</span>
          </div>
        </div>

        <ul className="grid w-full gap-2 text-sm">
          {arcs.map((a) => (
            <li key={a.label} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-navy">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: a.color }} />
                {a.label}
              </span>
              <span className="text-muted">
                {a.value}
                {total > 0 && <span> · {Math.round((a.value / total) * 100)}%</span>}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
