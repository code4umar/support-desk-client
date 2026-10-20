#!/usr/bin/env node
// Deskly Phase 1 (looks):  avatars, animated numbers, status donut chart, mobile menu,
// favicon + share image, keyboard focus rings and soft page/press animations.
// Run from the client repo root:   node apply-phase1.mjs          Undo:  node apply-phase1.mjs --revert
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const BACKUP = path.join(ROOT, '.phase1-backup');
const MANIFEST = '.phase1-created.json';
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
  console.log(n ? `Phase 1 removed (${n} files restored/deleted).` : 'Nothing to revert.');
  process.exit(0);
}
if (!exists('package.json') || !exists('app/layout.tsx') || !exists('components/Header.tsx')) {
  console.error('Run this from the client repo root (the folder with package.json, app/ and components/).'); process.exit(1);
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

// ---------- new files ----------
createFile("components/Avatar.tsx", "// Round badge with the person's initials; the colour is picked from the name so it stays the same everywhere.\nconst PALETTE = ['#2ee6d6', '#7c5cff', '#ff9d6c', '#38bdf8', '#f472b6', '#a3e635', '#fbbf24', '#34d399'];\n\nfunction hash(s: string) {\n  let h = 0;\n  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;\n  return h;\n}\n\nexport function initials(name?: string | null) {\n  const parts = (name ?? '').trim().split(/\\s+/).filter(Boolean);\n  if (parts.length === 0) return '?';\n  const first = parts[0][0] ?? '';\n  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';\n  return (first + last).toUpperCase();\n}\n\nexport default function Avatar({ name, size = 32 }: { name?: string | null; size?: number }) {\n  return (\n    <span\n      aria-hidden=\"true\"\n      className=\"inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold\"\n      style={{\n        width: size,\n        height: size,\n        fontSize: Math.round(size * 0.4),\n        background: PALETTE[hash(name ?? '') % PALETTE.length],\n        color: '#0f1726',\n      }}\n    >\n      {initials(name)}\n    </span>\n  );\n}\n");
createFile("components/AnimatedNumber.tsx", "'use client';\nimport { useEffect, useRef, useState } from 'react';\n\n// Counts up from the previous value to the new one (skipped for people who prefer reduced motion).\nexport default function AnimatedNumber({ value, duration = 700 }: { value: number; duration?: number }) {\n  const [shown, setShown] = useState(0);\n  const from = useRef(0);\n\n  useEffect(() => {\n    const start = from.current;\n    const end = value;\n    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;\n    let raf = 0;\n\n    if (reduce || start === end) {\n      from.current = end;\n      raf = requestAnimationFrame(() => setShown(end));\n      return () => cancelAnimationFrame(raf);\n    }\n\n    const t0 = performance.now();\n    const tick = (now: number) => {\n      const p = Math.min(1, (now - t0) / duration);\n      const eased = 1 - Math.pow(1 - p, 3);\n      setShown(Math.round(start + (end - start) * eased));\n      if (p < 1) raf = requestAnimationFrame(tick);\n      else from.current = end;\n    };\n    raf = requestAnimationFrame(tick);\n    return () => cancelAnimationFrame(raf);\n  }, [value, duration]);\n\n  return <>{shown}</>;\n}\n");
createFile("components/DonutChart.tsx", "export type DonutSlice = { label: string; value: number; color: string };\n\n// Simple SVG donut + legend (no chart library needed).\nexport default function DonutChart({ title, slices }: { title: string; slices: DonutSlice[] }) {\n  const total = slices.reduce((sum, s) => sum + s.value, 0);\n  const R = 52;\n  const C = 2 * Math.PI * R;\n\n  const arcs = slices.map((s, i) => {\n    const before = slices.slice(0, i).reduce((sum, x) => sum + x.value, 0);\n    const len = total > 0 ? (s.value / total) * C : 0;\n    const offset = total > 0 ? (before / total) * C : 0;\n    return { ...s, len, offset };\n  });\n\n  return (\n    <div className=\"rounded-xl border border-line bg-navy/[0.03] p-5\">\n      <h2 className=\"mb-4 text-sm font-semibold text-navy\">{title}</h2>\n      <div className=\"flex flex-col items-center gap-6 sm:flex-row sm:gap-10\">\n        <div className=\"relative h-40 w-40 shrink-0\">\n          <svg\n            viewBox=\"0 0 140 140\"\n            className=\"h-full w-full -rotate-90\"\n            role=\"img\"\n            aria-label={`${title}: ${slices.map((s) => `${s.label} ${s.value}`).join(', ')}`}\n          >\n            <circle cx=\"70\" cy=\"70\" r={R} fill=\"none\" stroke=\"currentColor\" strokeWidth=\"16\" className=\"text-navy/10\" />\n            {arcs.map((a) =>\n              a.len > 0 ? (\n                <circle\n                  key={a.label}\n                  cx=\"70\"\n                  cy=\"70\"\n                  r={R}\n                  fill=\"none\"\n                  stroke={a.color}\n                  strokeWidth=\"16\"\n                  strokeDasharray={`${a.len} ${C - a.len}`}\n                  strokeDashoffset={-a.offset}\n                  style={{ transition: 'stroke-dasharray .6s ease' }}\n                />\n              ) : null,\n            )}\n          </svg>\n          <div className=\"absolute inset-0 flex flex-col items-center justify-center\">\n            <span className=\"text-3xl font-bold text-navy\">{total}</span>\n            <span className=\"text-xs text-muted\">tickets</span>\n          </div>\n        </div>\n\n        <ul className=\"grid w-full gap-2 text-sm\">\n          {arcs.map((a) => (\n            <li key={a.label} className=\"flex items-center justify-between gap-3\">\n              <span className=\"flex items-center gap-2 text-navy\">\n                <span className=\"h-2.5 w-2.5 rounded-full\" style={{ background: a.color }} />\n                {a.label}\n              </span>\n              <span className=\"text-muted\">\n                {a.value}\n                {total > 0 && <span> \u00b7 {Math.round((a.value / total) * 100)}%</span>}\n              </span>\n            </li>\n          ))}\n        </ul>\n      </div>\n    </div>\n  );\n}\n");
createFile("components/MobileNav.tsx", "'use client';\nimport { useEffect, useRef, useState } from 'react';\nimport Link from 'next/link';\nimport Avatar from './Avatar';\n\n// Hamburger menu for phones (the desktop links in the header are hidden below 640px).\nexport default function MobileNav({ name, role, onLogout }: { name: string; role: string; onLogout: () => void }) {\n  const [open, setOpen] = useState(false);\n  const box = useRef<HTMLDivElement>(null);\n\n  useEffect(() => {\n    if (!open) return;\n    const onDown = (e: MouseEvent) => {\n      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);\n    };\n    const onKey = (e: KeyboardEvent) => {\n      if (e.key === 'Escape') setOpen(false);\n    };\n    document.addEventListener('mousedown', onDown);\n    document.addEventListener('keydown', onKey);\n    return () => {\n      document.removeEventListener('mousedown', onDown);\n      document.removeEventListener('keydown', onKey);\n    };\n  }, [open]);\n\n  const item = 'block rounded-lg px-3 py-2.5 text-sm font-medium text-navy hover:bg-navy/5';\n\n  return (\n    <div ref={box} className=\"relative sm:hidden\">\n      <button\n        type=\"button\"\n        onClick={() => setOpen((o) => !o)}\n        aria-label=\"Menu\"\n        aria-expanded={open}\n        className=\"flex h-10 w-10 items-center justify-center rounded-xl border border-brand-dark/50 bg-surface text-brand-dark shadow-sm\"\n      >\n        <svg className=\"h-5 w-5\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\" strokeWidth={2} strokeLinecap=\"round\">\n          {open ? <path d=\"M6 6l12 12M18 6L6 18\" /> : <path d=\"M4 7h16M4 12h16M4 17h16\" />}\n        </svg>\n      </button>\n\n      {open && (\n        <div className=\"absolute right-0 top-12 z-50 w-60 overflow-hidden rounded-xl border border-line bg-surface p-2 shadow-2xl\">\n          <div className=\"flex items-center gap-3 border-b border-line px-3 pb-3 pt-2\">\n            <Avatar name={name} size={36} />\n            <div className=\"min-w-0\">\n              <p className=\"truncate text-sm font-semibold text-navy\">{name}</p>\n              <p className=\"text-xs font-semibold uppercase tracking-wide text-brand-dark\">{role}</p>\n            </div>\n          </div>\n          <nav className=\"py-2\">\n            <Link href=\"/tickets\" className={item} onClick={() => setOpen(false)}>Tickets</Link>\n            <Link href=\"/dashboard\" className={item} onClick={() => setOpen(false)}>Dashboard</Link>\n            <Link href=\"/tickets/new\" className={item} onClick={() => setOpen(false)}>+ New ticket</Link>\n          </nav>\n          <button\n            type=\"button\"\n            onClick={() => { setOpen(false); onLogout(); }}\n            className={`${item} w-full border-t border-line text-left text-red-600 dark:text-red-400`}\n          >\n            Sign out\n          </button>\n        </div>\n      )}\n    </div>\n  );\n}\n");
createFile("app/icon.svg", "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><defs><linearGradient id=\"g\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#2ee6d6\"/><stop offset=\"1\" stop-color=\"#0fb5aa\"/></linearGradient></defs><rect width=\"64\" height=\"64\" rx=\"16\" fill=\"url(#g)\"/><circle cx=\"32\" cy=\"32\" r=\"16\" fill=\"none\" stroke=\"#0f1726\" stroke-width=\"4\"/><path d=\"M24 32.5l6 6 11-12\" fill=\"none\" stroke=\"#0f1726\" stroke-width=\"4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>\n");
createFile("app/opengraph-image.tsx", "import { ImageResponse } from 'next/og';\n\n// Preview picture shown when the Deskly link is shared (WhatsApp, LinkedIn, Slack...).\nexport const alt = 'Deskly: every request, resolved';\nexport const size = { width: 1200, height: 630 };\nexport const contentType = 'image/png';\n\nexport default function OpengraphImage() {\n  return new ImageResponse(\n    (\n      <div\n        style={{\n          width: '100%',\n          height: '100%',\n          display: 'flex',\n          flexDirection: 'column',\n          justifyContent: 'center',\n          padding: '0 90px',\n          background: 'linear-gradient(135deg, #10245a 0%, #0a1433 55%, #060b1f 100%)',\n          color: '#ffffff',\n        }}\n      >\n        <div style={{ display: 'flex', alignItems: 'center' }}>\n          <svg width=\"170\" height=\"119\" viewBox=\"0 0 661 462\">\n            <path fill=\"#f1f5fb\" d=\"M294,92 L49,138 L6,242 L157,444 L201,358 L103,223 L269,181Z M508,18 L462,103 L560,237 L392,281 L368,369 L614,323 L655,216Z\" />\n            <path fill=\"#2ee6d6\" d=\"M456,6 L376,11 L207,456 L291,447Z\" />\n          </svg>\n          <div style={{ display: 'flex', fontSize: 110, fontWeight: 800, marginLeft: 40 }}>\n            <span>Desk</span><span style={{ color: '#2ee6d6', marginLeft: -8 }}>ly</span>\n          </div>\n        </div>\n        <div style={{ display: 'flex', fontSize: 42, marginTop: 30, color: '#9fb0c8' }}>\n          Every request, resolved.\n        </div>\n      </div>\n    ),\n    { ...size },\n  );\n}\n");

// ---------- Header: avatar, mobile menu, hide desktop links on phones ----------
const H = 'components/Header.tsx';
edit(H, 'imports', "import NotificationBell from './NotificationBell';", "import NotificationBell from './NotificationBell';\nimport Avatar from './Avatar';\nimport MobileNav from './MobileNav';", "import MobileNav");
edit(H, 'desktop nav hidden on phones', '<nav className="flex items-center gap-1">', '<nav className="hidden items-center gap-1 sm:flex">', 'hidden items-center gap-1 sm:flex');
edit(H, 'avatar', '<span className="h-2 w-2 rounded-full bg-brand" />', '<Avatar name={user.name} size={24} />', '<Avatar name={user.name}');
editRe(H, 'mobile menu button', /(<ThemeToggle \/>)(\s*)(<div className="hidden sm:flex items-center gap-2 rounded-full)/, '$1\n            <MobileNav name={user.name} role={user.role} onLogout={logout} />\n\n            $3', '<MobileNav name=');
editRe(H, 'sign out hidden on phones', /(onClick=\{logout\}\s*className=")(text-sm font-medium text-muted)/, '$1hidden sm:block $2', 'hidden sm:block text-sm font-medium text-muted');

// ---------- Dashboard: animated numbers + donut ----------
const D = 'app/dashboard/page.tsx';
edit(D, 'imports', "import RoleWelcome from '@/components/RoleWelcome';", "import RoleWelcome from '@/components/RoleWelcome';\nimport AnimatedNumber from '@/components/AnimatedNumber';\nimport DonutChart from '@/components/DonutChart';", "import DonutChart");
edit(D, 'animated numbers', "<div className={`mt-1 text-3xl font-bold ${tone ?? 'text-navy'}`}>{value}</div>", "<div className={`mt-1 text-3xl font-bold ${tone ?? 'text-navy'}`}>{typeof value === 'number' ? <AnimatedNumber value={value} /> : value}</div>", '<AnimatedNumber value={value} />');
edit(D, 'donut chart', '<TrendChart tickets={tickets} />', `<TrendChart tickets={tickets} />
      <DonutChart
        title="Status overview"
        slices={[
          { label: 'Open', value: stats.byStatus.open, color: '#2ee6d6' },
          { label: 'In progress', value: stats.byStatus.in_progress, color: '#f59e0b' },
          { label: 'Resolved', value: stats.byStatus.resolved, color: '#22c55e' },
          { label: 'Closed', value: stats.byStatus.closed, color: '#94a3b8' },
        ]}
      />`, '<DonutChart');

// ---------- layout: title template + share preview ----------
edit('app/layout.tsx', 'metadata', `export const metadata: Metadata = {
  title: "Deskly",
  description: "Support Desk client",
};`, `export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://trydeskly.vercel.app"),
  title: { default: "Deskly", template: "%s · Deskly" },
  description: "Deskly: a support desk where every request gets resolved.",
  openGraph: {
    title: "Deskly",
    description: "A support desk where every request gets resolved.",
    siteName: "Deskly",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Deskly", description: "Every request, resolved." },
};`, 'metadataBase');

// ---------- globals.css: focus rings, press feedback, page fade ----------
if (exists('app/globals.css') && !read('app/globals.css').includes('/* ---- polish:')) {
  backup('app/globals.css');
  write('app/globals.css', read('app/globals.css').trimEnd() + `

/* ---- polish: keyboard focus, press feedback, soft page fade ---- */
:focus-visible { outline: 2px solid var(--accent-dark); outline-offset: 2px; border-radius: 6px; }
button:not(:disabled):active { transform: scale(.985); }
@keyframes page-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
main > * { animation: page-fade .35s ease-out both; }
@media (prefers-reduced-motion: reduce) { main > * { animation: none; } }
`);
}

if (created.length) write(MANIFEST, JSON.stringify(created, null, 2));
console.log('\nPhase 1 done.');
if (warnings.length) { console.log('\nCheck these (skipped parts):'); warnings.forEach((w) => console.log(' - ' + w)); }
console.log('\nNext: npm run dev (or just refresh). Tip: you can delete app/favicon.ico so the new Deskly icon is used everywhere.');
console.log('Undo anytime:  node apply-phase1.mjs --revert');
