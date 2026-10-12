#!/usr/bin/env node
// Deskly intro animation: the logo pops in, assembles, then expands to reveal the app (like codingpixel.com).
// Run from the client repo root:   node apply-splash.mjs          Undo:  node apply-splash.mjs --revert
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const BACKUP = path.join(ROOT, '.splash-backup');
const MANIFEST = '.splash-created.json';
const abs = (p) => path.join(ROOT, p);
const exists = (p) => fs.existsSync(abs(p));
const read = (p) => fs.readFileSync(abs(p), 'utf8');
const write = (p, s) => { fs.mkdirSync(path.dirname(abs(p)), { recursive: true }); fs.writeFileSync(abs(p), s); };
const backup = (p) => { const d = path.join(BACKUP, p); if (exists(p) && !fs.existsSync(d)) { fs.mkdirSync(path.dirname(d), { recursive: true }); fs.copyFileSync(abs(p), d); } };

if (process.argv.includes('--revert')) {
  let n = 0;
  if (fs.existsSync(BACKUP)) (function w(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) w(p); else { const rel = path.relative(BACKUP, p); fs.copyFileSync(p, abs(rel)); n++; } } })(BACKUP);
  if (exists(MANIFEST)) { for (const rel of JSON.parse(read(MANIFEST))) if (exists(rel)) { fs.unlinkSync(abs(rel)); n++; } fs.unlinkSync(abs(MANIFEST)); }
  console.log(n ? `Intro animation removed (${n} files restored/deleted).` : 'Nothing to revert.');
  process.exit(0);
}

if (!exists('package.json') || !exists('app/layout.tsx') || !exists('app/globals.css')) {
  console.error('Run this from the client repo root (the folder with package.json and app/).'); process.exit(1);
}

const warnings = [];
const created = [];

// ---------- 1) component (pure markup, no JS needed) ----------
const COMPONENT = `// Intro animation shown on every full page load (open / refresh), like codingpixel.com.
// Pure CSS (see globals.css, "deskly-splash"): the logo assembles, then expands and fades to reveal the app.
// It hides itself when the animation ends, and is skipped for people who prefer reduced motion.
export default function SplashScreen() {
  return (
    <div className="deskly-splash" aria-hidden="true">
      <svg className="deskly-splash-logo" viewBox="0 0 661 462" fill="none">
        <path className="sp-left" d="M294,92 L49,138 L6,242 L157,444 L201,358 L103,223 L269,181Z" />
        <path className="sp-right" d="M508,18 L462,103 L560,237 L392,281 L368,369 L614,323 L655,216Z" />
        <path className="sp-slash" d="M456,6 L376,11 L207,456 L291,447Z" />
      </svg>
    </div>
  );
}
`;
if (!exists('components/SplashScreen.tsx')) created.push('components/SplashScreen.tsx');
if (!exists('components/SplashScreen.tsx') || read('components/SplashScreen.tsx') !== COMPONENT) { backup('components/SplashScreen.tsx'); write('components/SplashScreen.tsx', COMPONENT); }

// ---------- 2) styles ----------
const CSS = `
/* ---- deskly-splash: logo assembles, then expands to reveal the app ---- */
.deskly-splash {
  position: fixed; inset: 0; z-index: 9999;
  display: flex; align-items: center; justify-content: center;
  background: var(--background);
  animation: splash-bg 2.2s ease-in forwards;
}
.deskly-splash-logo {
  width: clamp(110px, 14vw, 170px); height: auto; overflow: visible;
  animation: splash-zoom 2.2s linear forwards;
  will-change: transform, opacity;
}
.deskly-splash-logo path { opacity: 0; animation-duration: .7s; animation-fill-mode: both; animation-timing-function: cubic-bezier(.2,.8,.2,1); }
.sp-left  { fill: var(--text);   animation-name: sp-from-left;  animation-delay: .20s; }
.sp-right { fill: var(--text);   animation-name: sp-from-right; animation-delay: .30s; }
.sp-slash { fill: var(--accent); animation-name: sp-drop;       animation-delay: .05s; }
@keyframes sp-from-left  { from { opacity: 0; transform: translateX(-170px); } to { opacity: 1; transform: none; } }
@keyframes sp-from-right { from { opacity: 0; transform: translateX(170px); }  to { opacity: 1; transform: none; } }
@keyframes sp-drop       { from { opacity: 0; transform: translateY(-150px); } to { opacity: 1; transform: none; } }
/* hold the finished logo, then zoom through it */
@keyframes splash-zoom {
  0%, 56% { transform: scale(1); opacity: 1; animation-timing-function: cubic-bezier(.7, 0, .85, .2); }
  88%     { opacity: 1; }
  100%    { transform: scale(26); opacity: 0; }
}
@keyframes splash-bg {
  0%, 70% { opacity: 1; visibility: visible; }
  100%    { opacity: 0; visibility: hidden; }
}
/* people who prefer reduced motion: no movement, just the logo for a moment, then a soft fade */
@keyframes splash-bg-calm { 0%, 65% { opacity: 1; visibility: visible; } 100% { opacity: 0; visibility: hidden; } }
@media (prefers-reduced-motion: reduce) {
  .deskly-splash { animation: splash-bg-calm 1.1s ease-in forwards; }
  .deskly-splash-logo { animation: none; }
  .deskly-splash-logo path { animation: none; opacity: 1; }
}
/* ---- end deskly-splash ---- */
`;
let css = read('app/globals.css');
{
  const OLD_BLOCK = /\n?\/\* ---- deskly-splash:[\s\S]*?(?:\/\* ---- end deskly-splash ---- \*\/|@media \(prefers-reduced-motion: reduce\) \{ \.deskly-splash \{ display: none; \} \})\n?/;
  const next = css.replace(OLD_BLOCK, '\n').trimEnd() + '\n' + CSS;
  if (next !== css) { backup('app/globals.css'); write('app/globals.css', next); }
}

// ---------- 3) layout: render it first inside <body> ----------
let layout = read('app/layout.tsx');
if (!layout.includes('SplashScreen')) {
  const l0 = layout;
  layout = layout.replace(/(import Header from ["']@\/components\/Header["'];)/, '$1\nimport SplashScreen from "@/components/SplashScreen";');
  layout = layout.replace(/<body([^>]*)>/, '<body$1>\n        <SplashScreen />');
  if (!layout.includes('<SplashScreen />') || !layout.includes('import SplashScreen')) warnings.push('app/layout.tsx looks different from expected. Add  import SplashScreen from "@/components/SplashScreen";  and  <SplashScreen />  as the first thing inside <body> yourself.');
  else { backup('app/layout.tsx'); write('app/layout.tsx', layout); }
}

if (created.length) write(MANIFEST, JSON.stringify(created, null, 2));
console.log('\nDone. Intro animation added (about 2 seconds on every full page load / refresh).');
if (warnings.length) { console.log('\nCheck these:'); warnings.forEach((w) => console.log(' - ' + w)); }
console.log('\nNext: refresh the browser (Ctrl+Shift+R). If the dev server is running it updates by itself.');
console.log('Undo anytime:  node apply-splash.mjs --revert');
