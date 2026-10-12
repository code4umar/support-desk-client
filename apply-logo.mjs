#!/usr/bin/env node
// Puts the Coding Pixel logo icon in the top corner (on phones: on its own line above the heading) of the login panel (above "Welcome back").
// 1) Save the logo image inside the  public  folder (e.g. public/coding-pixel-logo.png)
// 2) Run from the client repo root:   node apply-logo.mjs          Undo:  node apply-logo.mjs --revert
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const FILE = 'app/login/page.tsx';
const BACKUP = path.join(ROOT, '.logo-backup', FILE);
const abs = (p) => path.join(ROOT, p);

if (process.argv.includes('--revert')) {
  if (!fs.existsSync(BACKUP)) { console.error('Nothing to revert.'); process.exit(1); }
  fs.copyFileSync(BACKUP, abs(FILE));
  console.log('Logo removed from the login page (your image file in public/ was left untouched).');
  process.exit(0);
}

if (!fs.existsSync(abs(FILE)) || !fs.existsSync(abs('public'))) {
  console.error('Run this from the client repo root (the folder with package.json, app/ and public/).');
  process.exit(1);
}

// find the logo image in public/
const rank = (f) => ['svg', 'png', 'webp', 'jpg', 'jpeg'].indexOf(f.split('.').pop().toLowerCase());
const logo = fs.readdirSync(abs('public')).filter((f) => /coding.?pixel.*\.(png|svg|webp|jpe?g)$/i.test(f)).sort((a, b) => rank(a) - rank(b))[0];
if (!logo) {
  console.error(`No logo found in the public folder.

  1. Open https://codingpixel.com and save the logo image (right-click the logo > "Save image as...").
  2. Put the file in:  ${abs('public')}
     and name it e.g.  coding-pixel-logo.png   (the name must contain "coding" and "pixel")
  3. Run this script again.`);
  process.exit(1);
}

let s = fs.readFileSync(abs(FILE), 'utf8');

const block = (anchor) => `${anchor}
              <div className="mb-6 md:absolute md:left-10 md:top-6 md:mb-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/${logo}"
                  alt="Coding Pixel"
                  className="h-12 w-auto drop-shadow-[0_0_14px_rgba(46,230,214,0.35)]"
                />
              </div>`;

// already added before? replace that block (so re-running updates the image / style)
const existing = /<div className="(?:absolute left-8 top-[67] sm:left-10|mb-6 md:absolute[^"]*)">\s*\{\/\* eslint-disable-next-line @next\/next\/no-img-element \*\/\}\s*<img[\s\S]*?alt="Coding Pixel"[\s\S]*?\/>\s*<\/div>/;
const anchor = '<div className="relative flex flex-1 flex-col justify-center px-8 py-10 sm:px-10">';
let next;
if (existing.test(s)) {
  next = s.replace(existing, block('').trimStart());
} else if (s.includes(anchor)) {
  next = s.replace(anchor, block(anchor));
} else {
  console.error('Could not find the "Welcome back" panel in app/login/page.tsx (the file looks different from expected). Send me that file.');
  process.exit(1);
}
if (next === s) { console.log('Logo is already on the login page. Nothing to do.'); process.exit(0); }

fs.mkdirSync(path.dirname(BACKUP), { recursive: true });
if (!fs.existsSync(BACKUP)) fs.copyFileSync(abs(FILE), BACKUP);
fs.writeFileSync(abs(FILE), next);

console.log(`Done. Logo "/${logo}" added to the top-left corner of the login panel (above "Welcome back").`);
console.log('Refresh the login page (Ctrl+Shift+R).');
console.log('Undo anytime:  node apply-logo.mjs --revert');
