'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import RequireAuth from '@/components/RequireAuth';
import Avatar from '@/components/Avatar';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/Toast';
import { api } from '@/lib/api';
import { timeAgo } from '@/lib/time';

type Role = 'customer' | 'agent' | 'admin';
type AdminUser = { id: number; email: string; full_name: string; role: Role; created_at: string };
type Activity = {
  id: number;
  action: string;
  details: string | null;
  created_at: string;
  actor: { id: number; full_name: string; role: string } | null;
};

const ROLES: Role[] = ['customer', 'agent', 'admin'];
const ROLE_PILL: Record<Role, string> = {
  admin: 'border-brand-dark/30 bg-brand/15 text-brand-dark',
  agent: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
  customer: 'border-line bg-navy/5 text-muted',
};
const DOT: Record<string, string> = {
  role_changed: 'bg-amber-400',
  password_changed: 'bg-red-400',
  profile_updated: 'bg-sky-400',
  user_registered: 'bg-green-400',
  login: 'bg-brand',
};

function describe(a: Activity) {
  const who = a.actor?.full_name ?? 'Someone';
  switch (a.action) {
    case 'role_changed': return `${who} changed a role`;
    case 'password_changed': return `${who} changed their password`;
    case 'profile_updated': return `${who} updated their profile`;
    case 'user_registered': return 'A new account was created';
    case 'login': return `${who} signed in`;
    default: return `${who}: ${a.action.replace(/_/g, ' ')}`;
  }
}

const messageOf = (e: unknown) => (e as { message?: string })?.message || 'Something went wrong';

function AdminInner() {
  const { user } = useAuth();
  const { show } = useToast();
  const [tab, setTab] = useState<'users' | 'activity'>('users');
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [activity, setActivity] = useState<Activity[] | null>(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';

  const loadUsers = useCallback(async () => {
    try {
      setUsers(await api.getUsers());
      setError(null);
    } catch (e) {
      setError(messageOf(e));
    }
  }, []);

  const loadActivity = useCallback(async () => {
    try {
      setActivity(await api.getActivity(50));
      setError(null);
    } catch (e) {
      setError(messageOf(e));
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const t = setTimeout(loadUsers, 0);
    return () => clearTimeout(t);
  }, [isAdmin, loadUsers]);

  const counts = useMemo(() => {
    const c = { total: 0, admin: 0, agent: 0, customer: 0 };
    for (const u of users ?? []) { c.total++; c[u.role]++; }
    return c;
  }, [users]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (users ?? []).filter((u) => !q || u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [users, query]);

  if (!user) return null;
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center gap-2 py-24 text-center">
        <p className="text-lg font-semibold text-navy">Admins only</p>
        <p className="text-sm text-muted">You do not have access to this page.</p>
      </div>
    );
  }

  async function changeRole(target: AdminUser, role: Role) {
    const previous = target.role;
    setUsers((list) => (list ?? []).map((u) => (u.id === target.id ? { ...u, role } : u)));
    try {
      await api.setUserRole(target.id, role);
      show(`${target.full_name} is now ${role}`);
    } catch (e) {
      setUsers((list) => (list ?? []).map((u) => (u.id === target.id ? { ...u, role: previous } : u)));
      show(messageOf(e), 'error');
    }
  }

  function openTab(next: 'users' | 'activity') {
    setTab(next);
    if (next === 'activity') loadActivity();
  }

  const tabClass = (t: string) =>
    `rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${tab === t ? 'bg-brand text-on-brand' : 'text-muted hover:text-navy'}`;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="text-sm text-muted">Manage people and see what has been happening</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {([['Total users', counts.total], ['Admins', counts.admin], ['Agents', counts.agent], ['Customers', counts.customer]] as const).map(([label, n]) => (
          <div key={label} className="rounded-xl border border-line bg-navy/[0.03] p-4">
            <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
            <div className="mt-1 text-2xl font-bold text-navy">{users ? n : '–'}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-line bg-surface p-1">
          <button type="button" className={tabClass('users')} onClick={() => openTab('users')}>Users</button>
          <button type="button" className={tabClass('activity')} onClick={() => openTab('activity')}>Activity</button>
        </div>
        {tab === 'users' ? (
          <input
            aria-label="Search users"
            placeholder="Search name or email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-56 rounded-md border border-line bg-transparent px-3 py-1.5 text-sm outline-none focus:border-brand-dark focus:ring-1 focus:ring-brand/50"
          />
        ) : (
          <button type="button" onClick={loadActivity} className="rounded-md border border-line px-3 py-1.5 text-sm text-navy hover:border-brand-dark">Refresh</button>
        )}
      </div>

      {error && <p className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {tab === 'users' && (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          {users === null && <li className="px-5 py-10 text-center text-sm text-muted">Loading…</li>}
          {users !== null && visible.length === 0 && <li className="px-5 py-10 text-center text-sm text-muted">No users match your search</li>}
          {visible.map((u) => {
            const self = String(u.id) === String(user.id);
            return (
              <li key={u.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <Avatar name={u.full_name} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-navy">
                    {u.full_name} {self && <span className="text-xs font-normal text-muted">(you)</span>}
                  </p>
                  <p className="truncate text-xs text-muted">{u.email} · joined {timeAgo(u.created_at)}</p>
                </div>
                {self ? (
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${ROLE_PILL[u.role]}`}>{u.role}</span>
                ) : (
                  <select
                    aria-label={`Role for ${u.full_name}`}
                    value={u.role}
                    onChange={(e) => changeRole(u, e.target.value as Role)}
                    className="rounded-md border border-line bg-surface px-2.5 py-1.5 text-sm capitalize text-navy outline-none focus:border-brand-dark"
                  >
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {tab === 'activity' && (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          {activity === null && <li className="px-5 py-10 text-center text-sm text-muted">Loading…</li>}
          {activity !== null && activity.length === 0 && <li className="px-5 py-10 text-center text-sm text-muted">Nothing has happened yet</li>}
          {(activity ?? []).map((a) => (
            <li key={a.id} className="flex items-start gap-3 px-5 py-3.5">
              <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${DOT[a.action] ?? 'bg-muted'}`} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-navy">{describe(a)}</p>
                {a.details && <p className="truncate text-xs text-muted">{a.details}</p>}
              </div>
              <span className="shrink-0 text-xs text-muted" title={a.created_at}>{timeAgo(a.created_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <RequireAuth>
      <AdminInner />
    </RequireAuth>
  );
}
