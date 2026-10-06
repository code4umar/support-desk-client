'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function NewTicketsBanner() {
  const { user } = useAuth();
  const pathname = usePathname();
  const baseline = useRef<number | null>(null);
  const [fresh, setFresh] = useState(0);

  // page badalne par naya baseline (apne banaye ticket ko "new" na ginay)
  useEffect(() => {
    baseline.current = null;
    setFresh(0);
  }, [pathname]);

  useEffect(() => {
    if (!user) return;
    let stopped = false;

    async function check() {
      if (document.hidden) return;
      try {
        const res: any = await api.getTickets('page=1');
        if (stopped) return;
        const ids: number[] = (res?.data ?? []).map((t: any) => t.id);
        if (ids.length === 0) return;
        const max = Math.max(...ids);
        if (baseline.current === null) {
          baseline.current = max;
          return;
        }
        const count = ids.filter((id) => id > baseline.current!).length;
        if (count > 0) setFresh(count);
      } catch {
        /* chup rahein */
      }
    }

    check();
    const timer = setInterval(check, 60000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [user, pathname]);

  if (!user || fresh === 0) return null;

  return (
    <div className="fixed bottom-5 left-5 z-[90] flex items-center gap-3 rounded-lg border border-brand-dark/30 bg-surface px-4 py-2.5 text-sm shadow-xl">
      <span className="text-navy">
        {fresh} new ticket{fresh === 1 ? '' : 's'}
      </span>
      <button
        onClick={() => window.location.reload()}
        className="rounded-md bg-brand px-3 py-1 text-xs font-semibold text-on-brand hover:bg-brand-dark"
      >
        Refresh
      </button>
      <button
        onClick={() => setFresh(0)}
        className="text-xs text-muted hover:text-navy"
        aria-label="dismiss"
      >
        ✕
      </button>
    </div>
  );
}