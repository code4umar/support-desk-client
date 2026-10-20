#!/usr/bin/env node
// Deskly CLIENT Phase 2: Settings page (/settings) and Admin page (/admin: users + activity).
// Run from the client repo root (after apply-phase1.mjs):   node apply-phase2-client.mjs          Undo:  node apply-phase2-client.mjs --revert
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const BACKUP = path.join(ROOT, '.phase2-backup');
const MANIFEST = '.phase2-created.json';
const abs = (p) => path.join(ROOT, p);
const exists = (p) => fs.existsSync(abs(p));
const read = (p) => fs.readFileSync(abs(p), 'utf8');
const write = (p, s) => { fs.mkdirSync(path.dirname(abs(p)), { recursive: true }); fs.writeFileSync(abs(p), s); };
const backup = (p) => { const d = path.join(BACKUP, p); if (exists(p) && !fs.existsSync(d)) { fs.mkdirSync(path.dirname(d), { recursive: true }); fs.copyFileSync(abs(p), d); } };
const created = [];
const warnings = [];

if (process.argv.includes('--revert')) {
  let n = 0;
  if (fs.existsSync(BACKUP)) (function w(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) w(p); else { fs.copyFileSync(p, abs(path.relative(BACKUP, p))); n++; } } })(BACKUP);
  if (exists(MANIFEST)) { for (const rel of JSON.parse(read(MANIFEST))) if (exists(rel)) { fs.unlinkSync(abs(rel)); n++; } fs.unlinkSync(abs(MANIFEST)); }
  console.log(n ? `Phase 2 client removed (${n} files restored/deleted).` : 'Nothing to revert.');
  process.exit(0);
}
if (!exists('package.json') || !exists('lib/api.ts') || !exists('components/Header.tsx')) {
  console.error('Run this from the client repo root (the folder with package.json, lib/ and components/).'); process.exit(1);
}
if (!exists('components/Avatar.tsx')) {
  console.error('Run  node apply-phase1.mjs  first (the new pages use its Avatar component).'); process.exit(1);
}

function createFile(rel, content) {
  const had = exists(rel);
  if (had && read(rel) === content) return;
  if (!had) created.push(rel); else backup(rel);
  write(rel, content);
}
function edit(rel, label, from, to, doneMarker) {
  if (!exists(rel)) { warnings.push(`${rel} not found (${label})`); return; }
  const s = read(rel);
  if (s.includes(doneMarker)) return;
  if (!s.includes(from)) { warnings.push(`${rel}: could not find the place for "${label}". That part was skipped.`); return; }
  backup(rel); write(rel, s.replace(from, to));
}
function editRe(rel, label, re, to, doneMarker) {
  if (!exists(rel)) { warnings.push(`${rel} not found (${label})`); return; }
  const s = read(rel);
  if (s.includes(doneMarker)) return;
  if (!re.test(s)) { warnings.push(`${rel}: could not find the place for "${label}". That part was skipped.`); return; }
  backup(rel); write(rel, s.replace(re, to));
}

// ---------- pages ----------
createFile("app/settings/page.tsx", "'use client';\nimport { useState } from 'react';\nimport RequireAuth from '@/components/RequireAuth';\nimport Avatar from '@/components/Avatar';\nimport { useAuth } from '@/lib/auth-context';\nimport { useToast } from '@/components/Toast';\nimport { api } from '@/lib/api';\n\nconst inputClass =\n  'w-full rounded-md border border-line bg-transparent p-2.5 text-sm outline-none transition-colors focus:border-brand-dark focus:ring-1 focus:ring-brand/50';\nconst buttonClass =\n  'rounded-md bg-brand px-5 py-2 text-sm font-semibold text-on-brand transition-all hover:bg-brand-dark disabled:opacity-50';\nconst labelClass = 'mb-1 block text-xs font-semibold tracking-wide text-muted';\n\nconst messageOf = (e: unknown) => (e as { message?: string })?.message || 'Something went wrong';\n\nfunction SettingsInner() {\n  const auth = useAuth() as ReturnType<typeof useAuth> & { refreshUser?: () => Promise<void> };\n  const { user } = auth;\n  const { show } = useToast();\n\n  const [name, setName] = useState(user?.name ?? '');\n  const [savingName, setSavingName] = useState(false);\n\n  const [current, setCurrent] = useState('');\n  const [next, setNext] = useState('');\n  const [confirm, setConfirm] = useState('');\n  const [savingPw, setSavingPw] = useState(false);\n\n  if (!user) return null;\n\n  async function saveProfile(e: React.FormEvent) {\n    e.preventDefault();\n    const trimmed = name.trim();\n    if (!trimmed) return show('Name cannot be empty', 'error');\n    setSavingName(true);\n    try {\n      await api.updateMe(trimmed);\n      if (auth.refreshUser) await auth.refreshUser();\n      else window.location.reload();\n      show('Profile updated');\n    } catch (err) {\n      show(messageOf(err), 'error');\n    } finally {\n      setSavingName(false);\n    }\n  }\n\n  async function savePassword(e: React.FormEvent) {\n    e.preventDefault();\n    if (next.length < 8) return show('New password must be at least 8 characters', 'error');\n    if (next !== confirm) return show('The two new passwords do not match', 'error');\n    setSavingPw(true);\n    try {\n      await api.changePassword(current, next);\n      setCurrent('');\n      setNext('');\n      setConfirm('');\n      show('Password updated');\n    } catch (err) {\n      show(messageOf(err), 'error');\n    } finally {\n      setSavingPw(false);\n    }\n  }\n\n  return (\n    <div className=\"mx-auto max-w-2xl space-y-6\">\n      <div>\n        <h1 className=\"text-2xl font-bold\">Settings</h1>\n        <p className=\"text-sm text-muted\">Manage your profile and password</p>\n      </div>\n\n      <div className=\"flex items-center gap-4 rounded-xl border border-line bg-surface p-6\">\n        <Avatar name={user.name} size={64} />\n        <div className=\"min-w-0\">\n          <p className=\"truncate text-lg font-semibold text-navy\">{user.name}</p>\n          <p className=\"truncate text-sm text-muted\">{user.email}</p>\n          <span className=\"mt-1 inline-block rounded-full border border-brand-dark/30 bg-brand/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-dark\">\n            {user.role}\n          </span>\n        </div>\n      </div>\n\n      <form onSubmit={saveProfile} className=\"space-y-4 rounded-xl border border-line bg-surface p-6\">\n        <h2 className=\"text-sm font-semibold text-navy\">Profile</h2>\n        <div>\n          <label htmlFor=\"full-name\" className={labelClass}>Full name</label>\n          <input id=\"full-name\" className={inputClass} value={name} maxLength={200} onChange={(e) => setName(e.target.value)} />\n        </div>\n        <div>\n          <label htmlFor=\"email\" className={labelClass}>Email</label>\n          <input id=\"email\" className={`${inputClass} opacity-60`} value={user.email} disabled readOnly />\n        </div>\n        <button className={buttonClass} disabled={savingName || name.trim() === user.name}>\n          {savingName ? 'Saving\u2026' : 'Save changes'}\n        </button>\n      </form>\n\n      <form onSubmit={savePassword} className=\"space-y-4 rounded-xl border border-line bg-surface p-6\">\n        <h2 className=\"text-sm font-semibold text-navy\">Change password</h2>\n        <div>\n          <label htmlFor=\"current-pw\" className={labelClass}>Current password</label>\n          <input id=\"current-pw\" type=\"password\" autoComplete=\"current-password\" className={inputClass} value={current} onChange={(e) => setCurrent(e.target.value)} />\n        </div>\n        <div className=\"grid gap-4 sm:grid-cols-2\">\n          <div>\n            <label htmlFor=\"new-pw\" className={labelClass}>New password</label>\n            <input id=\"new-pw\" type=\"password\" autoComplete=\"new-password\" className={inputClass} value={next} onChange={(e) => setNext(e.target.value)} />\n          </div>\n          <div>\n            <label htmlFor=\"confirm-pw\" className={labelClass}>Confirm new password</label>\n            <input id=\"confirm-pw\" type=\"password\" autoComplete=\"new-password\" className={inputClass} value={confirm} onChange={(e) => setConfirm(e.target.value)} />\n          </div>\n        </div>\n        <p className=\"text-xs text-muted\">At least 8 characters.</p>\n        <button className={buttonClass} disabled={savingPw || !current || !next || !confirm}>\n          {savingPw ? 'Updating\u2026' : 'Update password'}\n        </button>\n      </form>\n    </div>\n  );\n}\n\nexport default function SettingsPage() {\n  return (\n    <RequireAuth>\n      <SettingsInner />\n    </RequireAuth>\n  );\n}\n");
createFile("app/admin/page.tsx", "'use client';\nimport { useCallback, useEffect, useMemo, useState } from 'react';\nimport RequireAuth from '@/components/RequireAuth';\nimport Avatar from '@/components/Avatar';\nimport { useAuth } from '@/lib/auth-context';\nimport { useToast } from '@/components/Toast';\nimport { api } from '@/lib/api';\nimport { timeAgo } from '@/lib/time';\n\ntype Role = 'customer' | 'agent' | 'admin';\ntype AdminUser = { id: number; email: string; full_name: string; role: Role; created_at: string };\ntype Activity = {\n  id: number;\n  action: string;\n  details: string | null;\n  created_at: string;\n  actor: { id: number; full_name: string; role: string } | null;\n};\n\nconst ROLES: Role[] = ['customer', 'agent', 'admin'];\nconst ROLE_PILL: Record<Role, string> = {\n  admin: 'border-brand-dark/30 bg-brand/15 text-brand-dark',\n  agent: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',\n  customer: 'border-line bg-navy/5 text-muted',\n};\nconst DOT: Record<string, string> = {\n  role_changed: 'bg-amber-400',\n  password_changed: 'bg-red-400',\n  profile_updated: 'bg-sky-400',\n  user_registered: 'bg-green-400',\n  login: 'bg-brand',\n};\n\nfunction describe(a: Activity) {\n  const who = a.actor?.full_name ?? 'Someone';\n  switch (a.action) {\n    case 'role_changed': return `${who} changed a role`;\n    case 'password_changed': return `${who} changed their password`;\n    case 'profile_updated': return `${who} updated their profile`;\n    case 'user_registered': return 'A new account was created';\n    case 'login': return `${who} signed in`;\n    default: return `${who}: ${a.action.replace(/_/g, ' ')}`;\n  }\n}\n\nconst messageOf = (e: unknown) => (e as { message?: string })?.message || 'Something went wrong';\n\nfunction AdminInner() {\n  const { user } = useAuth();\n  const { show } = useToast();\n  const [tab, setTab] = useState<'users' | 'activity'>('users');\n  const [users, setUsers] = useState<AdminUser[] | null>(null);\n  const [activity, setActivity] = useState<Activity[] | null>(null);\n  const [query, setQuery] = useState('');\n  const [error, setError] = useState<string | null>(null);\n\n  const isAdmin = user?.role === 'admin';\n\n  const loadUsers = useCallback(async () => {\n    try {\n      setUsers(await api.getUsers());\n      setError(null);\n    } catch (e) {\n      setError(messageOf(e));\n    }\n  }, []);\n\n  const loadActivity = useCallback(async () => {\n    try {\n      setActivity(await api.getActivity(50));\n      setError(null);\n    } catch (e) {\n      setError(messageOf(e));\n    }\n  }, []);\n\n  useEffect(() => {\n    if (!isAdmin) return;\n    const t = setTimeout(loadUsers, 0);\n    return () => clearTimeout(t);\n  }, [isAdmin, loadUsers]);\n\n  const counts = useMemo(() => {\n    const c = { total: 0, admin: 0, agent: 0, customer: 0 };\n    for (const u of users ?? []) { c.total++; c[u.role]++; }\n    return c;\n  }, [users]);\n\n  const visible = useMemo(() => {\n    const q = query.trim().toLowerCase();\n    return (users ?? []).filter((u) => !q || u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));\n  }, [users, query]);\n\n  if (!user) return null;\n  if (!isAdmin) {\n    return (\n      <div className=\"flex flex-col items-center gap-2 py-24 text-center\">\n        <p className=\"text-lg font-semibold text-navy\">Admins only</p>\n        <p className=\"text-sm text-muted\">You do not have access to this page.</p>\n      </div>\n    );\n  }\n\n  async function changeRole(target: AdminUser, role: Role) {\n    const previous = target.role;\n    setUsers((list) => (list ?? []).map((u) => (u.id === target.id ? { ...u, role } : u)));\n    try {\n      await api.setUserRole(target.id, role);\n      show(`${target.full_name} is now ${role}`);\n    } catch (e) {\n      setUsers((list) => (list ?? []).map((u) => (u.id === target.id ? { ...u, role: previous } : u)));\n      show(messageOf(e), 'error');\n    }\n  }\n\n  function openTab(next: 'users' | 'activity') {\n    setTab(next);\n    if (next === 'activity') loadActivity();\n  }\n\n  const tabClass = (t: string) =>\n    `rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${tab === t ? 'bg-brand text-on-brand' : 'text-muted hover:text-navy'}`;\n\n  return (\n    <div className=\"mx-auto max-w-4xl space-y-6\">\n      <div>\n        <h1 className=\"text-2xl font-bold\">Admin</h1>\n        <p className=\"text-sm text-muted\">Manage people and see what has been happening</p>\n      </div>\n\n      <div className=\"grid grid-cols-2 gap-3 md:grid-cols-4\">\n        {([['Total users', counts.total], ['Admins', counts.admin], ['Agents', counts.agent], ['Customers', counts.customer]] as const).map(([label, n]) => (\n          <div key={label} className=\"rounded-xl border border-line bg-navy/[0.03] p-4\">\n            <div className=\"text-xs uppercase tracking-wide text-muted\">{label}</div>\n            <div className=\"mt-1 text-2xl font-bold text-navy\">{users ? n : '\u2013'}</div>\n          </div>\n        ))}\n      </div>\n\n      <div className=\"flex items-center justify-between gap-3\">\n        <div className=\"inline-flex rounded-lg border border-line bg-surface p-1\">\n          <button type=\"button\" className={tabClass('users')} onClick={() => openTab('users')}>Users</button>\n          <button type=\"button\" className={tabClass('activity')} onClick={() => openTab('activity')}>Activity</button>\n        </div>\n        {tab === 'users' ? (\n          <input\n            aria-label=\"Search users\"\n            placeholder=\"Search name or email\u2026\"\n            value={query}\n            onChange={(e) => setQuery(e.target.value)}\n            className=\"w-56 rounded-md border border-line bg-transparent px-3 py-1.5 text-sm outline-none focus:border-brand-dark focus:ring-1 focus:ring-brand/50\"\n          />\n        ) : (\n          <button type=\"button\" onClick={loadActivity} className=\"rounded-md border border-line px-3 py-1.5 text-sm text-navy hover:border-brand-dark\">Refresh</button>\n        )}\n      </div>\n\n      {error && <p className=\"rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400\">{error}</p>}\n\n      {tab === 'users' && (\n        <ul className=\"divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface\">\n          {users === null && <li className=\"px-5 py-10 text-center text-sm text-muted\">Loading\u2026</li>}\n          {users !== null && visible.length === 0 && <li className=\"px-5 py-10 text-center text-sm text-muted\">No users match your search</li>}\n          {visible.map((u) => {\n            const self = String(u.id) === String(user.id);\n            return (\n              <li key={u.id} className=\"flex flex-wrap items-center gap-3 px-5 py-3.5\">\n                <Avatar name={u.full_name} size={40} />\n                <div className=\"min-w-0 flex-1\">\n                  <p className=\"truncate text-sm font-semibold text-navy\">\n                    {u.full_name} {self && <span className=\"text-xs font-normal text-muted\">(you)</span>}\n                  </p>\n                  <p className=\"truncate text-xs text-muted\">{u.email} \u00b7 joined {timeAgo(u.created_at)}</p>\n                </div>\n                {self ? (\n                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${ROLE_PILL[u.role]}`}>{u.role}</span>\n                ) : (\n                  <select\n                    aria-label={`Role for ${u.full_name}`}\n                    value={u.role}\n                    onChange={(e) => changeRole(u, e.target.value as Role)}\n                    className=\"rounded-md border border-line bg-surface px-2.5 py-1.5 text-sm capitalize text-navy outline-none focus:border-brand-dark\"\n                  >\n                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}\n                  </select>\n                )}\n              </li>\n            );\n          })}\n        </ul>\n      )}\n\n      {tab === 'activity' && (\n        <ul className=\"divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface\">\n          {activity === null && <li className=\"px-5 py-10 text-center text-sm text-muted\">Loading\u2026</li>}\n          {activity !== null && activity.length === 0 && <li className=\"px-5 py-10 text-center text-sm text-muted\">Nothing has happened yet</li>}\n          {(activity ?? []).map((a) => (\n            <li key={a.id} className=\"flex items-start gap-3 px-5 py-3.5\">\n              <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${DOT[a.action] ?? 'bg-muted'}`} aria-hidden=\"true\" />\n              <div className=\"min-w-0 flex-1\">\n                <p className=\"text-sm text-navy\">{describe(a)}</p>\n                {a.details && <p className=\"truncate text-xs text-muted\">{a.details}</p>}\n              </div>\n              <span className=\"shrink-0 text-xs text-muted\" title={a.created_at}>{timeAgo(a.created_at)}</span>\n            </li>\n          ))}\n        </ul>\n      )}\n    </div>\n  );\n}\n\nexport default function AdminPage() {\n  return (\n    <RequireAuth>\n      <AdminInner />\n    </RequireAuth>\n  );\n}\n");

// ---------- api calls ----------
edit('lib/api.ts', 'account api calls', "  getStaff: () => request<any[]>('/staff'),", `  getUsers: () => request<any[]>('/users'),
  setUserRole: (id: number, role: string) =>
    request<any>(\`/users/\${id}/role\`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  updateMe: (full_name: string) =>
    request<any>('/users/me', { method: 'PATCH', body: JSON.stringify({ full_name }) }),
  changePassword: (current_password: string, new_password: string) =>
    request<{ message: string }>('/users/me/password', {
      method: 'POST',
      body: JSON.stringify({ current_password, new_password }),
    }),
  getActivity: (limit = 50) => request<any[]>(\`/activity?limit=\${limit}\`),
  getStaff: () => request<any[]>('/staff'),`, 'getActivity');

// ---------- auth context: refreshUser (so a new name shows up in the header at once) ----------
const AC = 'lib/auth-context.tsx';
edit(AC, 'type', '  logout: () => void;\n}', '  logout: () => void;\n  refreshUser: () => Promise<void>;\n}', 'refreshUser: () => Promise<void>');
edit(AC, 'function', '  function logout() {', `  async function refreshUser() {
    try {
      setUser(await api.me());
    } catch {
      /* keep the current user */
    }
  }

  function logout() {`, 'async function refreshUser');
edit(AC, 'provider value', 'value={{ user, token, loading, login, register, logout }}', 'value={{ user, token, loading, login, register, logout, refreshUser }}', 'logout, refreshUser');

// the backend sends the person's name as "full_name", but the whole client reads "user.name":
// copy it over once, here, so the header, avatars and Settings all show the real name (it was blank before)
edit(AC, 'name mapping', '  const [user, setUser] = useState<User | null>(null);', `  const [user, setUserRaw] = useState<User | null>(null);
  const setUser = (u: (User & { full_name?: string }) | null) =>
    setUserRaw(u ? { ...u, name: u.name ?? u.full_name ?? '' } : null);`, 'setUserRaw');

// ---------- header + mobile menu links ----------
const linkClass = 'text-sm font-medium text-muted hover:text-navy transition-colors px-3 py-1.5 rounded-md hover:bg-navy/5';
editRe('components/Header.tsx', 'Settings/Admin links', /(href="\/dashboard"[\s\S]*?>\s*Dashboard\s*<\/Link>)/, `$1
              <Link href="/settings" className="${linkClass}">
                Settings
              </Link>
              {user.role === 'admin' && (
                <Link href="/admin" className="${linkClass}">
                  Admin
                </Link>
              )}`, 'href="/settings"');
if (exists('components/MobileNav.tsx')) {
  edit('components/MobileNav.tsx', 'Settings/Admin links', '+ New ticket</Link>', `+ New ticket</Link>
            <Link href="/settings" className={item} onClick={() => setOpen(false)}>Settings</Link>
            {role === 'admin' && <Link href="/admin" className={item} onClick={() => setOpen(false)}>Admin</Link>}`, 'href="/settings"');
}

if (created.length) write(MANIFEST, JSON.stringify(created, null, 2));
console.log('\nPhase 2 client done.');
if (warnings.length) { console.log('\nCheck these (skipped parts):'); warnings.forEach((w) => console.log(' - ' + w)); }
console.log('\nNext: refresh. Open /settings (everyone) and /admin (admin only). The backend must have Phase 2 too (apply-phase2-backend.mjs + npm run migration:run).');
console.log('Undo anytime:  node apply-phase2-client.mjs --revert');
