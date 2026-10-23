'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Person = { id: number; full_name: string; role?: string };

// One-click "@Name" chips under the comment box (staff only). Clicking adds the tag to the text;
// the backend then sends that person a notification when the comment is posted.
export default function MentionPicker({ onPick, meId }: { onPick: (text: string) => void; meId?: number | string }) {
  const [staff, setStaff] = useState<Person[]>([]);

  useEffect(() => {
    let alive = true;
    api
      .getStaff()
      .then((list) => alive && setStaff(Array.isArray(list) ? list : []))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const others = staff.filter((s) => String(s.id) !== String(meId));
  if (others.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      <span className="text-muted">Mention:</span>
      {others.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onPick(`@${s.full_name} `)}
          className="rounded-full border border-line px-2.5 py-1 text-navy transition-colors hover:border-brand-dark hover:bg-brand/10"
        >
          @{s.full_name}
        </button>
      ))}
    </div>
  );
}
