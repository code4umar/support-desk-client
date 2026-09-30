'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

const inputClass =
  'border border-white/20 bg-black/30 rounded-md px-3 py-2 text-sm outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 transition-colors';

export default function TicketFilters({
  onChange,
}: {
  onChange: (key: string, value: string | null) => void;
}) {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [tags, setTags] = useState<any[]>([]);

  useEffect(() => {
    api.getTags().then(setTags).catch(() => {});
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      onChange('q', search || null);
    }, 400);
    return () => clearTimeout(handle);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur p-4 mb-6">
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