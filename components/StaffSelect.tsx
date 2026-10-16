'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export type Staff = { id: number; full_name: string; role: string };

// one request per page load, shared by every dropdown on the page
let cache: Staff[] | null = null;
let inflight: Promise<Staff[]> | null = null;

function loadStaff(): Promise<Staff[]> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = api
      .getStaff()
      .then((rows: Staff[]) => {
        cache = rows;
        return rows;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export function useStaff() {
  const [staff, setStaff] = useState<Staff[]>(cache ?? []);
  useEffect(() => {
    let alive = true;
    loadStaff()
      .then((rows) => {
        if (alive) setStaff(rows);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  return staff;
}

export default function StaffSelect({
  value,
  onChange,
  className,
  placeholder = 'Assign to…',
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}) {
  const staff = useStaff();
  return (
    <select
      aria-label="Assign to"
      className={className}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {staff.map((s) => (
        <option key={s.id} value={String(s.id)}>
          {s.full_name} ({s.role})
        </option>
      ))}
    </select>
  );
}
