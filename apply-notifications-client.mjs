#!/usr/bin/env node
// Deskly CLIENT: admin notification bell.  Run from the client repo root:  node apply-notifications-client.mjs
// (run apply-theme.mjs first)         Undo:  node apply-notifications-client.mjs --revert

import fs from 'node:fs';
import path from 'node:path';
const ROOT = process.cwd();
const BACKUP = path.join(ROOT, '.notif-backup');
const exists = (p) => fs.existsSync(path.join(ROOT, p));
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const write = (p, s) => { fs.mkdirSync(path.dirname(path.join(ROOT, p)), { recursive: true }); fs.writeFileSync(path.join(ROOT, p), s); };
const created = [];
const touched = new Set();
const warnings = [];
function backup(rel) {
  if (touched.has(rel)) return; touched.add(rel);
  const dest = path.join(BACKUP, rel);
  if (fs.existsSync(dest)) return;
  if (exists(rel)) { fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.copyFileSync(path.join(ROOT, rel), dest); }
}
function save(rel, s) { backup(rel); write(rel, s); }
// create a new file (never overwrites a file that already has different content without backing it up)
function createFile(rel, content) {
  const had = exists(rel);
  if (had && read(rel) === content) return;
  if (!had) created.push(rel);
  save(rel, content);
}
// replace `from` by `to` once; skip if already applied; warn if the anchor is missing
function edit(rel, label, from, to, doneMarker) {
  if (!exists(rel)) { warnings.push(`${rel} not found (${label})`); return; }
  let s = read(rel);
  if (doneMarker && s.includes(doneMarker)) return;
  if (!s.includes(from)) { warnings.push(`${rel}: could not find the place to edit (${label}). See the notes at the end of the instructions.`); return; }
  save(rel, s.replace(from, to));
}
function revert() {
  if (!fs.existsSync(BACKUP) && !fs.existsSync(path.join(ROOT, '.notif-created.json'))) { console.error('Nothing to revert.'); process.exit(1); }
  let n = 0;
  (function w(d) { if (!fs.existsSync(d)) return; for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) w(p); else { const rel = path.relative(BACKUP, p); fs.mkdirSync(path.dirname(path.join(ROOT, rel)), { recursive: true }); fs.copyFileSync(p, path.join(ROOT, rel)); n++; } } })(BACKUP);
  if (fs.existsSync(path.join(ROOT, '.notif-created.json'))) {
    for (const rel of JSON.parse(read('.notif-created.json'))) { if (exists(rel)) { fs.unlinkSync(path.join(ROOT, rel)); n++; } }
    fs.unlinkSync(path.join(ROOT, '.notif-created.json'));
  }
  console.log(`Reverted (${n} files). You can delete the .notif-backup folder now.`);
  process.exit(0);
}
if (process.argv.includes('--revert')) revert();
function finish(nextSteps) {
  if (created.length) write('.notif-created.json', JSON.stringify(created, null, 2));
  console.log(`\nDone. ${touched.size} files written (originals backed up in .notif-backup/).`);
  if (warnings.length) { console.log('\nCheck these:'); warnings.forEach((w) => console.log(' - ' + w)); }
  console.log('\n' + nextSteps);
  console.log('Undo anytime:  node ' + path.basename(process.argv[1]) + ' --revert');
}

if (!exists('package.json') || !exists('app') || !exists('lib/api.ts')) {
  console.error('Run this from the client repo root (the folder with package.json, app/ and lib/).'); process.exit(1);
}
if (!exists('app/globals.css') || !read('app/globals.css').includes('--color-brand')) {
  console.error('Run  node apply-theme.mjs  first (the bell uses the theme colours).'); process.exit(1);
}

createFile('components/NotificationBell.tsx', "'use client';\nimport { useCallback, useEffect, useRef, useState } from 'react';\nimport { useRouter } from 'next/navigation';\nimport { api } from '@/lib/api';\nimport { useAuth } from '@/lib/auth-context';\nimport { useToast } from '@/components/Toast';\nimport { timeAgo } from '@/lib/time';\n\ntype Notif = {\n  id: number;\n  type: string;\n  message: string;\n  ticket_id: number | null;\n  read_at: string | null;\n  created_at: string;\n};\n\nconst POLL_MS = 20000;\n\nconst TYPE_LABEL: Record<string, string> = {\n  ticket_created: 'New ticket',\n  user_login: 'Login',\n};\n\n// Bell with an unread badge. Only admins receive notifications, so for every\n// other role this renders nothing. It checks the API every 20s while the tab is\n// visible, and shows a toast when something new arrives.\nexport default function NotificationBell() {\n  const { user } = useAuth();\n  const router = useRouter();\n  const { show } = useToast();\n  const isAdmin = user?.role === 'admin';\n\n  const [open, setOpen] = useState(false);\n  const [items, setItems] = useState<Notif[]>([]);\n  const [unread, setUnread] = useState(0);\n  const lastId = useRef<number | null>(null);\n  const box = useRef<HTMLDivElement>(null);\n\n  const load = useCallback(async () => {\n    try {\n      const res = await api.getNotifications();\n      const list: Notif[] = res.items ?? [];\n      setItems(list);\n      setUnread(res.unread ?? 0);\n\n      const maxId = list.reduce((m, n) => Math.max(m, n.id), 0);\n      if (lastId.current === null) {\n        lastId.current = maxId; // first load: don't toast old ones\n      } else if (maxId > lastId.current) {\n        const prev = lastId.current;\n        lastId.current = maxId;\n        const fresh = list.filter((n) => n.id > prev && !n.read_at);\n        if (fresh.length === 1) show(fresh[0].message);\n        else if (fresh.length > 1) show(`${fresh.length} new notifications`);\n      }\n    } catch {\n      /* stay quiet, try again on the next poll */\n    }\n  }, [show]);\n\n  useEffect(() => {\n    if (!isAdmin) return;\n    const first = setTimeout(load, 0);\n    const tick = () => {\n      if (!document.hidden) load();\n    };\n    const timer = setInterval(tick, POLL_MS);\n    document.addEventListener('visibilitychange', tick);\n    return () => {\n      clearTimeout(first);\n      clearInterval(timer);\n      document.removeEventListener('visibilitychange', tick);\n    };\n  }, [isAdmin, load]);\n\n  // close on outside click / Escape\n  useEffect(() => {\n    if (!open) return;\n    const onDown = (e: MouseEvent) => {\n      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);\n    };\n    const onKey = (e: KeyboardEvent) => {\n      if (e.key === 'Escape') setOpen(false);\n    };\n    document.addEventListener('mousedown', onDown);\n    document.addEventListener('keydown', onKey);\n    return () => {\n      document.removeEventListener('mousedown', onDown);\n      document.removeEventListener('keydown', onKey);\n    };\n  }, [open]);\n\n  if (!isAdmin) return null;\n\n  function openItem(n: Notif) {\n    setOpen(false);\n    if (!n.read_at) {\n      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)));\n      setUnread((u) => Math.max(0, u - 1));\n      api.markNotificationRead(n.id).catch(() => load());\n    }\n    if (n.ticket_id) router.push(`/tickets/${n.ticket_id}`);\n  }\n\n  function markAll() {\n    const now = new Date().toISOString();\n    setItems((prev) => prev.map((x) => (x.read_at ? x : { ...x, read_at: now })));\n    setUnread(0);\n    api.markAllNotificationsRead().catch(() => load());\n  }\n\n  return (\n    <div ref={box} className=\"relative\">\n      <button\n        type=\"button\"\n        onClick={() => {\n          setOpen((o) => !o);\n          if (!open) load();\n        }}\n        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}\n        aria-expanded={open}\n        title=\"Notifications\"\n        className=\"relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-dark/50 bg-surface text-brand-dark shadow-sm transition-all hover:border-brand hover:bg-brand/15 hover:shadow-md\"\n      >\n        <svg className=\"h-5 w-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\" strokeWidth={2}>\n          <path\n            strokeLinecap=\"round\"\n            strokeLinejoin=\"round\"\n            d=\"M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0\"\n          />\n        </svg>\n        {unread > 0 && (\n          <span className=\"absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold leading-none text-white shadow\">\n            {unread > 9 ? '9+' : unread}\n          </span>\n        )}\n      </button>\n\n      {open && (\n        <div className=\"absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-xl border border-line bg-surface shadow-2xl sm:w-96\">\n          <div className=\"flex items-center justify-between border-b border-line px-4 py-3\">\n            <h2 className=\"text-sm font-semibold text-navy\">Notifications</h2>\n            <button\n              type=\"button\"\n              onClick={markAll}\n              disabled={unread === 0}\n              className=\"text-xs font-medium text-brand-dark hover:underline disabled:opacity-40 disabled:no-underline\"\n            >\n              Mark all read\n            </button>\n          </div>\n\n          {items.length === 0 ? (\n            <p className=\"px-4 py-10 text-center text-sm text-muted\">No notifications yet</p>\n          ) : (\n            <ul className=\"max-h-96 divide-y divide-line overflow-y-auto\">\n              {items.map((n) => (\n                <li key={n.id}>\n                  <button\n                    type=\"button\"\n                    onClick={() => openItem(n)}\n                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-navy/5 ${\n                      n.read_at ? '' : 'bg-brand/10'\n                    }`}\n                  >\n                    <span\n                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read_at ? 'bg-transparent' : 'bg-brand'}`}\n                      aria-hidden=\"true\"\n                    />\n                    <span className=\"min-w-0 flex-1\">\n                      <span className=\"mb-0.5 block text-[10px] font-semibold uppercase tracking-wide text-brand-dark\">\n                        {TYPE_LABEL[n.type] ?? 'Update'}\n                      </span>\n                      <span className={`block text-sm ${n.read_at ? 'text-muted' : 'text-navy'}`}>{n.message}</span>\n                      <span className=\"mt-0.5 block text-xs text-muted\">{timeAgo(n.created_at)}</span>\n                    </span>\n                  </button>\n                </li>\n              ))}\n            </ul>\n          )}\n        </div>\n      )}\n    </div>\n  );\n}\n");
createFile('__tests__/notifications.test.tsx', "import { render, screen, fireEvent, waitFor } from '@testing-library/react';\nimport '@testing-library/jest-dom';\nimport NotificationBell from '@/components/NotificationBell';\n\nconst push = jest.fn();\nlet mockRole: string | undefined = 'admin';\n\njest.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));\njest.mock('@/lib/auth-context', () => ({\n  useAuth: () => ({ user: mockRole ? { id: 1, role: mockRole, name: 'X' } : null }),\n}));\njest.mock('@/components/Toast', () => ({ useToast: () => ({ show: jest.fn() }) }));\njest.mock('@/lib/api', () => ({\n  api: {\n    getNotifications: jest.fn(),\n    markNotificationRead: jest.fn(() => Promise.resolve({})),\n    markAllNotificationsRead: jest.fn(() => Promise.resolve({ updated: 2 })),\n  },\n}));\nimport { api } from '@/lib/api';\n\nconst sample = {\n  unread: 2,\n  items: [\n    { id: 2, type: 'ticket_created', message: 'New ticket #7: Printer broken (by a@x.com)', ticket_id: 7, read_at: null, created_at: new Date().toISOString() },\n    { id: 1, type: 'user_login', message: 'Ali (customer) logged in', ticket_id: null, read_at: null, created_at: new Date().toISOString() },\n  ],\n};\n\nbeforeEach(() => {\n  jest.clearAllMocks();\n  mockRole = 'admin';\n  (api.getNotifications as jest.Mock).mockResolvedValue(sample);\n});\n\ndescribe('NotificationBell', () => {\n  test('shows the unread count badge for an admin', async () => {\n    render(<NotificationBell />);\n    expect(await screen.findByText('2')).toBeInTheDocument();\n  });\n\n  test('renders nothing (and never calls the API) for non-admins', () => {\n    mockRole = 'customer';\n    const { container } = render(<NotificationBell />);\n    expect(container).toBeEmptyDOMElement();\n    expect(api.getNotifications).not.toHaveBeenCalled();\n  });\n\n  test('opens the list and clicking a ticket notification marks it read and navigates', async () => {\n    render(<NotificationBell />);\n    await screen.findByText('2');\n    fireEvent.click(screen.getByRole('button', { name: /notifications/i }));\n    fireEvent.click(await screen.findByText(/Printer broken/));\n    expect(api.markNotificationRead).toHaveBeenCalledWith(2);\n    expect(push).toHaveBeenCalledWith('/tickets/7');\n  });\n\n  test('\"Mark all read\" clears the badge', async () => {\n    render(<NotificationBell />);\n    await screen.findByText('2');\n    fireEvent.click(screen.getByRole('button', { name: /notifications/i }));\n    fireEvent.click(await screen.findByText('Mark all read'));\n    expect(api.markAllNotificationsRead).toHaveBeenCalled();\n    await waitFor(() => expect(screen.queryByText('2')).not.toBeInTheDocument());\n  });\n});\n");

edit('lib/api.ts', 'notification API calls', "  getTags: () => request<any[]>('/tags'),",
  `  getNotifications: (limit = 20) =>
    request<{ unread: number; items: any[] }>(\`/notifications?limit=\${limit}\`),
  markNotificationRead: (id: number) =>
    request<any>(\`/notifications/\${id}/read\`, { method: 'PATCH' }),
  markAllNotificationsRead: () =>
    request<{ updated: number }>('/notifications/read-all', { method: 'PATCH' }),

  getTags: () => request<any[]>('/tags'),`, 'getNotifications');

if (exists('components/Header.tsx')) {
  let h = read('components/Header.tsx');
  if (!h.includes('NotificationBell')) {
    if (!h.includes('<ThemeToggle />')) warnings.push('components/Header.tsx has no <ThemeToggle /> (run apply-theme.mjs first), add <NotificationBell /> to the header yourself.');
    else {
      h = h.replace(/(import ThemeToggle from '\.\/ThemeToggle';)/, "$1\nimport NotificationBell from './NotificationBell';");
      h = h.replace(/(\s*)<ThemeToggle \/>/, '$1<NotificationBell />$1<ThemeToggle />');
      save('components/Header.tsx', h);
    }
  }
} else warnings.push('components/Header.tsx not found');

finish('Next: stop the dev server (Ctrl+C), run  npm run dev  and refresh. The bell shows for ADMIN users only.\nThe backend must have the notifications update too (apply-notifications-backend.mjs).');
