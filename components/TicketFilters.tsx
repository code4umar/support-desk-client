'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const inputClass =
  'border border-white/20 bg-black/30 rounded-md px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 transition-colors [color-scheme:dark]';

const FILTER_KEYS = ['q', 'status', 'priority', 'tag', 'assigneeId', 'overdue'];

type Preset = {
  label: string;
  params: Record<string, string>;
  sort?: Record<string, string>;
};

export default function TicketFilters({
  onChange,
}: {
  onChange: (key: string, value: string | null) => void;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const urlQ = searchParams.get('q') ?? '';
  const [search, setSearch] = useState(urlQ);
  const [tags, setTags] = useState<any[]>([]);

  useEffect(() => {
    api.getTags().then(setTags).catch(() => {});
  }, []);

  // URL badle (preset / clear) to search box bhi badle
  useEffect(() => {
    setSearch(urlQ);
  }, [urlQ]);

  // typing ke 400ms baad hi URL update
  useEffect(() => {
    if (search === urlQ) return;
    const handle = setTimeout(() => {
      onChange('q', search || null);
    }, 400);
    return () => clearTimeout(handle);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const presets: Preset[] = [
    { label: 'All', params: {} },
    ...(user && String(user.role) !== 'requester'
      ? [{ label: 'My tickets', params: { assigneeId: String(user.id) } }]
      : []),
    { label: 'Urgent & open', params: { status: 'open', priority: 'urgent' } },
    {
      label: 'Overdue',
      params: { overdue: 'true' },
      sort: { sortBy: 'dueAt', order: 'asc' },
    },
    { label: 'In progress', params: { status: 'in_progress' } },
    { label: 'Open', params: { status: 'open' } },
  ];

  const toKey = (get: (k: string) => string | null | undefined) =>
    FILTER_KEYS.filter((k) => get(k))
      .map((k) => `${k}=${get(k)}`)
      .sort()
      .join('&');

  const currentKey = toKey((k) => searchParams.get(k));
  const hasFilters = currentKey !== '';

  function applyPreset(p: Preset) {
    const next = new URLSearchParams();
    Object.entries(p.params).forEach(([k, v]) => next.set(k, v));
    Object.entries(p.sort ?? {}).forEach(([k, v]) => next.set(k, v));
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function clearAll() {
    router.push(pathname);
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur p-4 mb-6">
      {/* Saved views */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {presets.map((p) => {
          const active = toKey((k) => p.params[k]) === currentKey;
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                active
                  ? 'border-teal-400 bg-teal-500/15 text-teal-300'
                  : 'border-white/10 text-zinc-400 hover:border-teal-400/60 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          );
        })}
        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="ml-auto text-xs text-zinc-500 hover:text-red-400 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <input
          aria-label="search"
          className={`${inputClass} flex-1 min-w-[160px]`}
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          aria-label="status filter"
          className={inputClass}
          value={searchParams.get('status') ?? ''}
          onChange={(e) => onChange('status', e.target.value || null)}
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select
          aria-label="priority filter"
          className={inputClass}
          value={searchParams.get('priority') ?? ''}
          onChange={(e) => onChange('priority', e.target.value || null)}
        >
          <option value="">All priorities</option>
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <select
          aria-label="tag filter"
          className={inputClass}
          value={searchParams.get('tag') ?? ''}
          onChange={(e) => onChange('tag', e.target.value || null)}
        >
          <option value="">All tags</option>
          {tags.map((t) => (
            <option key={t.id} value={t.name}>
              {t.name}
            </option>
          ))}
        </select>
        <input
          aria-label="assignee filter"
          className={`${inputClass} w-28`}
          placeholder="Assignee ID"
          value={searchParams.get('assigneeId') ?? ''}
          onChange={(e) => onChange('assigneeId', e.target.value || null)}
        />
        <label className="flex items-center gap-2 text-sm text-zinc-300 px-2">
          <input
            type="checkbox"
            className="accent-teal-500 h-4 w-4"
            checked={searchParams.get('overdue') === 'true'}
            onChange={(e) => onChange('overdue', e.target.checked ? 'true' : null)}
          />
          Overdue
        </label>

        <select
          aria-label="sort by"
          className={inputClass}
          value={searchParams.get('sortBy') ?? 'createdAt'}
          onChange={(e) => onChange('sortBy', e.target.value)}
        >
          <option value="createdAt">Sort: Created</option>
          <option value="dueAt">Sort: Due date</option>
          <option value="priority">Sort: Priority</option>
        </select>
        <select
          aria-label="sort order"
          className={inputClass}
          value={searchParams.get('order') ?? 'desc'}
          onChange={(e) => onChange('order', e.target.value)}
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </div>
    </div>
  );
}