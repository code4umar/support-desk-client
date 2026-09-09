'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function TicketFilters({
  onChange,
}: {
  onChange: (key: string, value: string | null) => void;
}) {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') ?? '');

  useEffect(() => {
    const handle = setTimeout(() => {
      onChange('q', search || null);
    }, 400);
    return () => clearTimeout(handle);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex gap-2 mb-4 flex-wrap">
      <input
        className="border p-2"
        placeholder="Search…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <select
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
        className="border p-2"
        value={searchParams.get('priority') ?? ''}
        onChange={(e) => onChange('priority', e.target.value || null)}
      >
        <option value="">All priorities</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="urgent">Urgent</option>
      </select>
      <label className="flex items-center gap-1">
        <input
          type="checkbox"
          checked={searchParams.get('overdue') === 'true'}
          onChange={(e) => onChange('overdue', e.target.checked ? 'true' : null)}
        />
        Overdue
      </label>
    </div>
  );
}