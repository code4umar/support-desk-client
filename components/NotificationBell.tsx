'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/Toast';
import { timeAgo } from '@/lib/time';

type Notif = {
  id: number;
  type: string;
  message: string;
  ticket_id: number | null;
  read_at: string | null;
  created_at: string;
};

const POLL_MS = 20000;

const TYPE_LABEL: Record<string, string> = {
  ticket_created: 'New ticket',
  user_login: 'Login',
};

// Bell with an unread badge. Only admins receive notifications, so for every
// other role this renders nothing. It checks the API every 20s while the tab is
// visible, and shows a toast when something new arrives.
export default function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const { show } = useToast();
  const isAdmin = user?.role === 'admin';

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const lastId = useRef<number | null>(null);
  const box = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.getNotifications();
      const list: Notif[] = res.items ?? [];
      setItems(list);
      setUnread(res.unread ?? 0);

      const maxId = list.reduce((m, n) => Math.max(m, n.id), 0);
      if (lastId.current === null) {
        lastId.current = maxId; // first load: don't toast old ones
      } else if (maxId > lastId.current) {
        const prev = lastId.current;
        lastId.current = maxId;
        const fresh = list.filter((n) => n.id > prev && !n.read_at);
        if (fresh.length === 1) show(fresh[0].message);
        else if (fresh.length > 1) show(`${fresh.length} new notifications`);
      }
    } catch {
      /* stay quiet, try again on the next poll */
    }
  }, [show]);

  useEffect(() => {
    if (!isAdmin) return;
    const first = setTimeout(load, 0);
    const tick = () => {
      if (!document.hidden) load();
    };
    const timer = setInterval(tick, POLL_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [isAdmin, load]);

  // close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!isAdmin) return null;

  function openItem(n: Notif) {
    setOpen(false);
    if (!n.read_at) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)));
      setUnread((u) => Math.max(0, u - 1));
      api.markNotificationRead(n.id).catch(() => load());
    }
    if (n.ticket_id) router.push(`/tickets/${n.ticket_id}`);
  }

  function markAll() {
    const now = new Date().toISOString();
    setItems((prev) => prev.map((x) => (x.read_at ? x : { ...x, read_at: now })));
    setUnread(0);
    api.markAllNotificationsRead().catch(() => load());
  }

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          if (!open) load();
        }}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-expanded={open}
        title="Notifications"
        className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-dark/50 bg-surface text-brand-dark shadow-sm transition-all hover:border-brand hover:bg-brand/15 hover:shadow-md"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold leading-none text-white shadow">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-xl border border-line bg-surface shadow-2xl sm:w-96">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold text-navy">Notifications</h2>
            <button
              type="button"
              onClick={markAll}
              disabled={unread === 0}
              className="text-xs font-medium text-brand-dark hover:underline disabled:opacity-40 disabled:no-underline"
            >
              Mark all read
            </button>
          </div>

          {items.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted">No notifications yet</p>
          ) : (
            <ul className="max-h-96 divide-y divide-line overflow-y-auto">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => openItem(n)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-navy/5 ${
                      n.read_at ? '' : 'bg-brand/10'
                    }`}
                  >
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read_at ? 'bg-transparent' : 'bg-brand'}`}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-brand-dark">
                        {TYPE_LABEL[n.type] ?? 'Update'}
                      </span>
                      <span className={`block text-sm ${n.read_at ? 'text-muted' : 'text-navy'}`}>{n.message}</span>
                      <span className="mt-0.5 block text-xs text-muted">{timeAgo(n.created_at)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
