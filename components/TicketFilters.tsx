'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

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
    <div className="flex gap-2 mb-4 flex-wrap items-center">
      <input
        aria-label="search"
        className="border p-2"
        placeholder="Search…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <select
        aria-label="status filter"
        className="border p-2"
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
        className="border p-2"
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
        className="border p-2"
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
        className="border p-2 w-28"
        placeholder="Assignee ID"
        value={searchParams.get('assigneeId') ?? ''}
        onChange={(e) => onChange('assigneeId', e.target.value || null)}
      />
      <label className="flex items-center gap-1">
        <input
          type="checkbox"
          checked={searchParams.get('overdue') === 'true'}
          onChange={(e) => onChange('overdue', e.target.checked ? 'true' : null)}
        />
        Overdue
      </label>

      <select
        aria-label="sort by"
        className="border p-2"
        value={searchParams.get('sortBy') ?? 'createdAt'}
        onChange={(e) => onChange('sortBy', e.target.value)}
      >
        <option value="createdAt">Sort: Created</option>
        <option value="dueAt">Sort: Due date</option>
        <option value="priority">Sort: Priority</option>
      </select>
      <select
        aria-label="sort order"
        className="border p-2"
        value={searchParams.get('order') ?? 'desc'}
        onChange={(e) => onChange('order', e.target.value)}
      >
        <option value="desc">Descending</option>
        <option value="asc">Ascending</option>
      </select>
    </div>
  );
}