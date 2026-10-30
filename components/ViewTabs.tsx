'use client';

// Segmented tabs used to split a page into views that each fit on one screen.
export default function ViewTabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: { id: T; label: string; badge?: number }[];
  value: T;
  onChange: (id: T) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex shrink-0 rounded-xl border border-line bg-surface p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
            value === t.id ? 'nav-active' : 'text-muted hover:text-navy'
          }`}
        >
          {t.label}
          {!!t.badge && (
            <span className="rounded-full bg-navy/10 px-1.5 text-[11px] font-semibold leading-5">{t.badge}</span>
          )}
        </button>
      ))}
    </div>
  );
}
