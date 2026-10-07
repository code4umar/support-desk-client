#!/usr/bin/env node
// Deskly theme installer: Coding Pixel inspired light/dark theme + header toggle.
// Run from the client repo root (where package.json is):   node apply-theme.mjs
// Undo everything:                                         node apply-theme.mjs --revert
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const BACKUP = path.join(ROOT, '.theme-backup');
const exists = (p) => fs.existsSync(path.join(ROOT, p));
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const write = (p, s) => { fs.mkdirSync(path.dirname(path.join(ROOT, p)), { recursive: true }); fs.writeFileSync(path.join(ROOT, p), s); };

if (!exists('package.json') || !exists('app')) {
  console.error('Run this from the client repo root (the folder with package.json and app/).');
  process.exit(1);
}

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const rel = path.posix.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(rel));
    else if (rel.endsWith('.tsx')) out.push(rel);
  }
  return out;
}

// ---------- revert ----------
if (process.argv.includes('--revert')) {
  if (!fs.existsSync(BACKUP)) { console.error('No .theme-backup folder found, nothing to revert.'); process.exit(1); }
  const files = [];
  (function w(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); e.isDirectory() ? w(p) : files.push(p); } })(BACKUP);
  for (const f of files) { const rel = path.relative(BACKUP, f); fs.mkdirSync(path.dirname(path.join(ROOT, rel)), { recursive: true }); fs.copyFileSync(f, path.join(ROOT, rel)); }
  if (exists('components/ThemeToggle.tsx')) fs.unlinkSync(path.join(ROOT, 'components/ThemeToggle.tsx'));
  console.log(`Reverted ${files.length} files. You can delete the .theme-backup folder now.`);
  process.exit(0);
}

// ---------- backup ----------
const touched = new Set();
function backup(rel) {
  if (touched.has(rel)) return;
  touched.add(rel);
  const dest = path.join(BACKUP, rel);
  if (fs.existsSync(dest)) return; // keep the very first backup
  if (exists(rel)) { fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.copyFileSync(path.join(ROOT, rel), dest); }
}
function save(rel, s) { backup(rel); write(rel, s); }

const warnings = [];
const B = '(?<![\\w-])';
const R = (pat, rep) => [new RegExp(pat, 'g'), rep];

// ---------- class mapping (dark teal/zinc  ->  theme tokens) ----------
const classRules = [
  R('(fixed inset-0 z-\\[100\\][^"]*?)bg-black/60', '$1bg-black/50'),
  R('from-teal-950 via-zinc-900 to-black', 'from-surface via-surface to-brand/25'),
  R('from-white to-zinc-400', 'from-navy to-muted'),
  R(B + 'bg-zinc-950', 'bg-surface'),
  R(B + 'bg-black(?![\\w/])', 'bg-surface'),
  R(B + 'text-white', 'text-navy'),
  R(B + 'text-black', 'text-on-brand'),
  R(B + 'text-zinc-(200|300)', 'text-navy'),
  R(B + 'text-zinc-(400|500|600)', 'text-muted'),
  R(B + 'hover:text-teal-300', 'hover:text-navy'),
  R(B + 'text-teal-(300|400)', 'text-brand-dark'),
  R(B + '(?<!dark:)text-amber-400', 'text-amber-700'),
  R(B + '(?<!dark:)text-green-400', 'text-green-700'),
  R(B + '(?<!dark:)text-indigo-300', 'text-indigo-700'),
  R(B + '(?<!dark:)text-sky-400', 'text-sky-700'),
  R(B + '(?<!dark:)text-red-400', 'text-red-600'),
  R(B + 'bg-teal-400/25', 'bg-brand/40'),
  R(B + 'bg-teal-400/80', 'bg-brand/80'),
  R(B + 'bg-teal-500/\\[0\\.04\\]', 'bg-brand/10'),
  R(B + 'bg-teal-500/(10|15)', 'bg-brand/15'),
  R(B + 'bg-teal-500/20', 'bg-brand/25'),
  R(B + 'hover:bg-teal-400', 'hover:bg-brand-dark'),
  R(B + 'group-hover:bg-teal-300', 'group-hover:bg-brand-dark'),
  R(B + 'bg-teal-(400|500)(?![\\w/])', 'bg-brand'),
  R(B + 'border-teal-(400|500)/(20|30|50|60)', 'border-brand-dark/$2'),
  R(B + 'border-teal-400(?![\\w/])', 'border-brand-dark'),
  R(B + 'ring-teal-400/50', 'ring-brand/50'),
  R(B + 'accent-teal-500', 'accent-brand-dark'),
  R(B + 'shadow-teal-500/10', 'shadow-brand-dark/15'),
  R(B + 'shadow-teal-500/30', 'shadow-brand-dark/30'),
  R(B + 'from-teal-400', 'from-brand'),
  R(B + 'to-teal-600', 'to-brand-dark'),
  R(B + 'border-white/(5|10|15|20)', 'border-line'),
  R(B + 'divide-white/5', 'divide-line'),
  R(B + 'bg-white/(5|10)(?![\\w\\[])', 'bg-navy/$1'),
  R(B + 'bg-white/\\[0\\.03\\]', 'bg-navy/[0.03]'),
  R(B + 'border-zinc-500/30', 'border-navy/20'),
  R(B + 'bg-zinc-500/10', 'bg-navy/5'),
  R(B + 'bg-black/(20|30|40)', 'bg-surface'),
  R(B + 'bg-black/70', 'bg-surface/90'),
  R(B + 'bg-black/60', 'bg-surface/85'),
  R(B + 'shadow-black/20', 'shadow-navy/10'),
  R(B + 'shadow-black/50', 'shadow-navy/20'),
  R(' \\[color-scheme:dark\\]', ''),
  R('\\[color-scheme:dark\\] ', ''),
  // detail-page loading card (old orange hex colours) -> theme tokens
  R('bg-\\[#0e151d\\]/95', 'bg-surface/95'),
  R('bg-\\[#e58a3c\\]/20', 'bg-brand/30'),
  R('from-\\[#f5b942\\] to-\\[#e58a3c\\]', 'from-brand to-brand-dark'),
  R('text-\\[#101820\\]', 'text-on-brand'),
  R('text-\\[#8b95a1\\]', 'text-muted'),
];
// second pass: brighter variant for dark mode (only for plain, non-variant tokens)
const darkPairs = [
  ['text-amber-700', 'dark:text-amber-400'], ['text-green-700', 'dark:text-green-400'],
  ['text-indigo-700', 'dark:text-indigo-300'], ['text-sky-700', 'dark:text-sky-400'],
  ['text-red-600', 'dark:text-red-400'],
].map(([a, b]) => [new RegExp('(?<![\\w:-])' + a + '(?![\\w/-])(?! dark:)', 'g'), a + ' ' + b]);

// login / register keep a dark navy card: orange palette -> turquoise
const hexMap = [
  ['#e58a3c88', '#1fe5d888'], ['#e58a3c', '#1fe5d8'], ['#f7f76a66', '#7df5ec66'], ['#f5b942', '#7df5ec'],
  ['#0e151d', '#162540'], ['#141d27', '#1b2c4d'], ['#101820', '#162540'], ['#8b95a1', '#9fb0c8'],
  ['rgba(229,138,60,0.10)', 'rgba(31,229,216,0.12)'],
];

const authFiles = new Set(['app/login/page.tsx', 'app/register/page.tsx']);
const files = [...walk('app'), ...walk('components')].filter((f) => !f.endsWith('ThemeToggle.tsx'));
let changed = 0;

for (const rel of files) {
  const orig = read(rel);
  let s = orig;
  if (authFiles.has(rel)) {
    for (const [a, b] of hexMap) s = s.split(a).join(b);
  } else {
    for (const [re, rep] of classRules) s = s.replace(re, rep);
    for (const [re, rep] of darkPairs) s = s.replace(re, rep);
  }
  if (s !== orig) { save(rel, s); changed++; }
}

// ---------- ThemeToggle component ----------
const TOGGLE = "'use client';\n\n// Light/dark switch. The theme lives on <html data-theme=\"...\"> (set before paint by the\n// inline script in layout.tsx) and is saved in localStorage, so no React state is needed.\nexport default function ThemeToggle() {\n  function toggle() {\n    const root = document.documentElement;\n    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';\n    root.dataset.theme = next;\n    try {\n      localStorage.setItem('theme', next);\n    } catch {\n      /* private mode: choice just won't persist */\n    }\n  }\n\n  return (\n    <button\n      type=\"button\"\n      onClick={toggle}\n      aria-label=\"Toggle light/dark theme\"\n      title=\"Toggle theme\"\n      className=\"flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-dark/50 bg-surface text-brand-dark shadow-sm transition-all hover:border-brand hover:bg-brand/15 hover:shadow-md\"\n    >\n      {/* sun: shown in dark mode (click to go light) */}\n      <svg className=\"hidden h-5 w-5 dark:block\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\" strokeWidth={2}>\n        <circle cx=\"12\" cy=\"12\" r=\"4\" />\n        <path strokeLinecap=\"round\" d=\"M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4\" />\n      </svg>\n      {/* moon: shown in light mode (click to go dark) */}\n      <svg className=\"block h-5 w-5 dark:hidden\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\" strokeWidth={2}>\n        <path strokeLinecap=\"round\" strokeLinejoin=\"round\" d=\"M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z\" />\n      </svg>\n    </button>\n  );\n}\n";
save('components/ThemeToggle.tsx', TOGGLE);

// ---------- Header: add the toggle button ----------
if (exists('components/Header.tsx')) {
  let h = read('components/Header.tsx');
  const before = h;
  if (!h.includes('ThemeToggle')) {
    h = h.replace(/(import Link from 'next\/link';)/, "$1\nimport ThemeToggle from './ThemeToggle';");
    h = h.replace(/(\s*)(<div className="hidden sm:flex items-center gap-2 rounded-full)/, '$1<ThemeToggle />\n$1$2');
    h = h.replace(/(<div className="flex items-center gap-2">\s*)(<Link\s+href="\/login")/, '$1<ThemeToggle />\n            $2');
    if ((h.match(/<ThemeToggle \/>/g) || []).length < 2) warnings.push('Header.tsx: could not place the toggle automatically in both places. Add <ThemeToggle /> yourself next to the user badge and next to the Login link.');
    if (h !== before) save('components/Header.tsx', h);
  }
} else warnings.push('components/Header.tsx not found: add <ThemeToggle /> to your header yourself.');

// ---------- layout: font + no-flash theme script ----------
if (exists('app/layout.tsx')) {
  let l = read('app/layout.tsx');
  const before = l;
  if (!l.includes('data-theme') && !l.includes('dataset.theme')) {
    if (!l.includes('Outfit')) {
      l = l.replace(/(import type \{ Metadata \} from "next";)/, '$1\nimport { Outfit } from "next/font/google";');
      l = l.replace(/(export const metadata)/, 'const outfit = Outfit({\n  subsets: ["latin"],\n  variable: "--font-body",\n  weight: ["400", "500", "600", "700"],\n});\n\n$1');
    }
    const script = `<html lang="en" className={outfit.variable} suppressHydrationWarning>
      <head>
        {/* set theme before first paint: saved choice, else the OS preference */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('theme');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t}catch(e){}",
          }}
        />
      </head>`;
    l = l.replace(/<html lang="en"[^>]*>/, script);
    if (!l.includes('dataset.theme')) warnings.push('app/layout.tsx: could not edit automatically (unusual layout). The theme toggle will still switch, but the saved choice will not load before paint.');
    if (l !== before) save('app/layout.tsx', l);
  }
}

// ---------- globals.css: tokens ----------
if (exists('app/globals.css')) {
  let c = read('app/globals.css');
  const before = c;
  if (!c.includes('--color-brand')) {
    if (!c.includes('@custom-variant dark')) {
      c = c.replace('@import "tailwindcss";', '@import "tailwindcss";\n\n/* dark: variant follows data-theme on <html> (toggle in header), not the OS */\n@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));');
    }
    const root = `/* Coding Pixel inspired theme: light grey-blue, navy text, turquoise accent */
:root {
  --background: #e9edef;
  --foreground: #213558;
  --bg: #e9edef;
  --card: #ffffff;
  --border: #d3dbe2;
  --text: #213558;
  --muted: #4a5f80;
  --accent: #1fe5d8;
  --accent-dark: #0fb5aa;
  --on-accent: #213558;
  color-scheme: light;
}

/* Dark theme: deep navy surfaces, same turquoise accent */
:root[data-theme="dark"] {
  --background: #121a2b;
  --foreground: #f1f5fb;
  --bg: #121a2b;
  --card: #1a2438;
  --border: #2b3752;
  --text: #f1f5fb;
  --muted: #94a3bd;
  --accent: #2ee6d6;
  --accent-dark: #5eeee2;
  --on-accent: #0f1726;
  color-scheme: dark;
}
`;
    const theme = `@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-surface: var(--card);
  --color-line: var(--border);
  --color-navy: var(--text);
  --color-muted: var(--muted);
  --color-brand: var(--accent);
  --color-brand-dark: var(--accent-dark);
  --color-on-brand: var(--on-accent);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
`;
    c = c.replace(/:root \{[\s\S]*?\n\}\n/, root);
    c = c.replace(/@theme inline \{[\s\S]*?\n\}\n/, theme);
    c = c.replace('font-family: Arial, Helvetica, sans-serif;', 'font-family: var(--font-body), Arial, Helvetica, sans-serif;');
    const swaps = [
      ['rgba(20,217,181,.35)', 'rgba(15,181,170,.30)'], ['rgba(20,217,181,.6)', 'rgba(15,181,170,.45)'], ['rgba(20,217,181,.2)', 'rgba(31,229,216,.35)'],
      ['.prio-low     { color: #7dd3fc; border-color: #7dd3fc55; background: #7dd3fc14; }', '.prio-low     { color: #0369a1; border-color: #0369a155; background: #0369a114; }'],
      ['.prio-normal  { color: #a5b4fc; border-color: #a5b4fc55; background: #a5b4fc14; }', '.prio-normal  { color: #4338ca; border-color: #4338ca55; background: #4338ca14; }'],
      ['.prio-high    { color: #fbbf24; border-color: #fbbf2455; background: #fbbf2414; }', '.prio-high    { color: #b45309; border-color: #b4530955; background: #b4530914; }'],
      ['.prio-urgent  { color: #f87171; border-color: #f8717155; background: #f8717114; }', '.prio-urgent  { color: #b91c1c; border-color: #b91c1c55; background: #b91c1c14; }'],
      ['.status-open        { color: var(--accent); }', '.status-open        { color: var(--accent-dark); }'],
      ['.status-in_progress { color: #fbbf24; }', '.status-in_progress { color: #b45309; }'],
      ['.status-resolved    { color: #4ade80; }', '.status-resolved    { color: #15803d; }'],
      ['background: linear-gradient(135deg, #14d9b5, #0aa48a); color: #041512; border: none;', 'background: var(--accent); color: var(--on-accent); border: none;'],
      ['transition: border-color .15s, box-shadow .15s; color-scheme: dark;\n}', 'transition: border-color .15s, box-shadow .15s; }'],
      ['select.field option { background: #111318; color: #f2f4f8; }', 'select.field option { background: var(--card); color: var(--text); }'],
    ];
    for (const [a, b] of swaps) c = c.split(a).join(b);
    c = c.replace(/\/\* Dark dropdowns everywhere[\s\S]*$/, '/* Dropdowns follow the active theme */\nselect option { background-color: var(--card); color: var(--text); }\n');
    c = c.trimEnd() + `

/* status/priority colours: brighter on dark */
:root[data-theme="dark"] .prio-low    { color: #7dd3fc; border-color: #7dd3fc55; background: #7dd3fc14; }
:root[data-theme="dark"] .prio-normal { color: #a5b4fc; border-color: #a5b4fc55; background: #a5b4fc14; }
:root[data-theme="dark"] .prio-high   { color: #fbbf24; border-color: #fbbf2455; background: #fbbf2414; }
:root[data-theme="dark"] .prio-urgent { color: #f87171; border-color: #f8717155; background: #f8717114; }
:root[data-theme="dark"] .status-in_progress { color: #fbbf24; }
:root[data-theme="dark"] .status-resolved    { color: #4ade80; }
`;
    if (!c.includes('--color-brand')) warnings.push('app/globals.css: unusual structure, theme tokens were not added. Send me this file.');
    if (c !== before) save('app/globals.css', c);
  }
} else warnings.push('app/globals.css not found.');

console.log(`\nTheme applied. ${touched.size} files written (backup of originals in .theme-backup/).`);
console.log(`Class colours updated in ${changed} files, toggle added to the header.`);
if (warnings.length) { console.log('\nCheck these:'); warnings.forEach((w) => console.log(' - ' + w)); }
console.log('\nNext: stop the dev server (Ctrl+C), run  npm run dev  and hard refresh the browser (Ctrl+Shift+R).');
console.log('Undo anytime:  node apply-theme.mjs --revert');
