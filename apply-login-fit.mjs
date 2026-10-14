#!/usr/bin/env node
// Makes the login page fit the screen exactly (no extra scrolling).
// Cause: the page assumed a 56px header, but the real layout is header 64px + 16px padding on each side of <main>,
// so it was always about 40px taller than the window.
// Run from the client repo root:   node apply-login-fit.mjs        Undo:  node apply-login-fit.mjs --revert
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const FILE = 'app/login/page.tsx';
const BACKUP = path.join(ROOT, '.fit-backup', FILE);
const abs = (p) => path.join(ROOT, p);

if (process.argv.includes('--revert')) {
  if (!fs.existsSync(BACKUP)) { console.error('Nothing to revert.'); process.exit(1); }
  fs.copyFileSync(BACKUP, abs(FILE));
  console.log('Login page sizes restored.');
  process.exit(0);
}
if (!fs.existsSync(abs(FILE))) { console.error('Run this from the client repo root (the folder with package.json and app/).'); process.exit(1); }

let s = fs.readFileSync(abs(FILE), 'utf8');
const orig = s;
const warnings = [];

// 1) outer wrapper: header (65px incl. its border) + <main> padding (32px) = 97px, and only a little vertical padding
const wrapOld = 'min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-6';
const wrapNew = 'min-h-[calc(100dvh-97px)] items-center justify-center px-4 py-4';
if (s.includes(wrapOld)) s = s.replace(wrapOld, wrapNew);
else if (s.includes('min-h-[calc(100dvh-6rem)] items-center justify-center px-4 py-4')) s = s.replace('min-h-[calc(100dvh-6rem)] items-center justify-center px-4 py-4', wrapNew);
else if (!s.includes(wrapNew)) warnings.push('Could not find the outer wrapper sizes (the file looks different). Send me app/login/page.tsx.');

// 2) the card itself: fills the window minus header/padding, never taller than 760px, never too short for the form
const cardOld = 'h-[calc(100vh-8rem)] min-h-[560px]';
const cardNew = 'h-[calc(100dvh-129px)] min-h-[460px] max-h-[760px]';
if (s.includes(cardOld)) s = s.replace(cardOld, cardNew);
else if (s.includes('h-[calc(100dvh-129px)] min-h-[510px] max-h-[760px]')) s = s.replace('h-[calc(100dvh-129px)] min-h-[510px] max-h-[760px]', cardNew);
else if (s.includes('h-[calc(100dvh-8rem)] min-h-[520px] max-h-[760px]')) s = s.replace('h-[calc(100dvh-8rem)] min-h-[520px] max-h-[760px]', cardNew);
else if (!s.includes(cardNew)) warnings.push('Could not find the card height classes (the file looks different). Send me app/login/page.tsx.');

// 3) short windows (under 640px tall): less padding above/below the form so it still fits without scrolling
const padOld = 'relative flex flex-1 flex-col justify-center px-8 py-10 sm:px-10';
const padNew = 'relative flex flex-1 flex-col justify-center px-8 py-10 sm:px-10 [@media(max-height:640px)]:py-5';
if (s.includes(padOld) && !s.includes(padNew)) s = s.replace(padOld, padNew);
else if (!s.includes(padNew)) warnings.push('Could not find the form panel padding (optional, only affects very short windows).');

// 4) the "N resolved this week" counter: compact one-line pill (it was a tall box touching "Welcome back");
//    hidden only on very short windows where there is no room for it
const counterRules = [
  ['className="rise absolute right-5 top-5 z-10 hidden md:block"', 'className="rise absolute right-4 top-4 z-10 hidden md:block [@media(max-height:640px)]:hidden"'],
  ['<div className="rounded-xl border border-white/15 bg-white/10 px-3.5 py-2 text-right backdrop-blur-md">', '<div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 backdrop-blur-md">'],
  ['text-2xl font-bold leading-none tabular-nums text-white', 'text-base font-bold leading-none tabular-nums text-white'],
  ['<p className="mt-1 text-[10px] text-white/60">resolved this week</p>', '<p className="text-[11px] leading-none text-white/60">resolved this week</p>'],
];
if (s.includes('Live counter') && !s.includes('right-4 top-4 z-10 hidden md:block')) {
  let hit = 0;
  for (const [a, b] of counterRules) if (s.includes(a)) { s = s.replace(a, b); hit++; }
  if (hit < counterRules.length) warnings.push('The "resolved this week" counter looks different from expected; it was only partly resized.');
}

if (s !== orig) {
  if (!fs.existsSync(BACKUP)) { fs.mkdirSync(path.dirname(BACKUP), { recursive: true }); fs.writeFileSync(BACKUP, orig); }
  fs.writeFileSync(abs(FILE), s);
  console.log('\nDone. The login page now fits the window (no extra scroll).');
} else console.log('\nNothing to change (already fitted).');
if (warnings.length) { console.log('\nCheck these:'); warnings.forEach((w) => console.log(' - ' + w)); }
console.log('\nRefresh the login page (Ctrl+Shift+R).   Undo anytime:  node apply-login-fit.mjs --revert');
