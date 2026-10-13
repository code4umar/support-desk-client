#!/usr/bin/env node
// New login artwork: a big glowing </> mark with orbit rings, glass icons and a "Deskly" wordmark. No tickets.
// Run from the client repo root:   node apply-login-art.mjs
//   optional:  node apply-login-art.mjs --hide-ticket-card    (also hides the small "Ticket #38 resolved" card)
// Undo:        node apply-login-art.mjs --revert
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const FILE = 'app/login/page.tsx';
const ART = 'public/login-art.svg';
const BACKUP = path.join(ROOT, '.art-backup');
const abs = (p) => path.join(ROOT, p);

if (process.argv.includes('--revert')) {
  const b = path.join(BACKUP, FILE);
  if (!fs.existsSync(b)) { console.error('Nothing to revert.'); process.exit(1); }
  fs.copyFileSync(b, abs(FILE));
  if (fs.existsSync(abs(ART))) fs.unlinkSync(abs(ART));
  console.log('Old login picture restored (login-art.svg removed).');
  process.exit(0);
}
if (!fs.existsSync(abs(FILE)) || !fs.existsSync(abs('public'))) {
  console.error('Run this from the client repo root (the folder with package.json, app/ and public/).'); process.exit(1);
}

const SVG = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 720 1160\" preserveAspectRatio=\"xMidYMid slice\">\n  <defs>\n    <linearGradient id=\"bg\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\">\n      <stop offset=\"0\" stop-color=\"#10245a\"/><stop offset=\".55\" stop-color=\"#0a1433\"/><stop offset=\"1\" stop-color=\"#060b1f\"/>\n    </linearGradient>\n    <radialGradient id=\"gTeal\" cx=\".5\" cy=\".5\" r=\".5\"><stop offset=\"0\" stop-color=\"#1fe5d8\" stop-opacity=\".55\"/><stop offset=\"1\" stop-color=\"#1fe5d8\" stop-opacity=\"0\"/></radialGradient>\n    <radialGradient id=\"gViolet\" cx=\".5\" cy=\".5\" r=\".5\"><stop offset=\"0\" stop-color=\"#7c5cff\" stop-opacity=\".5\"/><stop offset=\"1\" stop-color=\"#7c5cff\" stop-opacity=\"0\"/></radialGradient>\n    <radialGradient id=\"gWarm\" cx=\".5\" cy=\".5\" r=\".5\"><stop offset=\"0\" stop-color=\"#ff9d6c\" stop-opacity=\".30\"/><stop offset=\"1\" stop-color=\"#ff9d6c\" stop-opacity=\"0\"/></radialGradient>\n    <linearGradient id=\"brk\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#ffffff\"/><stop offset=\"1\" stop-color=\"#9fbcff\"/></linearGradient>\n    <linearGradient id=\"slash\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#8bfff4\"/><stop offset=\".55\" stop-color=\"#1fe5d8\"/><stop offset=\"1\" stop-color=\"#18a9ff\"/></linearGradient>\n    <linearGradient id=\"orbit\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"0\"><stop offset=\"0\" stop-color=\"#7c5cff\" stop-opacity=\"0\"/><stop offset=\".5\" stop-color=\"#9fb6ff\" stop-opacity=\".7\"/><stop offset=\"1\" stop-color=\"#1fe5d8\" stop-opacity=\"0\"/></linearGradient>\n    <linearGradient id=\"fadeDown\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\".62\" stop-color=\"#060b1f\" stop-opacity=\"0\"/><stop offset=\"1\" stop-color=\"#060b1f\" stop-opacity=\".92\"/></linearGradient>\n    <filter id=\"blur60\" x=\"-50%\" y=\"-50%\" width=\"200%\" height=\"200%\"><feGaussianBlur stdDeviation=\"60\"/></filter>\n    <filter id=\"glow\" x=\"-40%\" y=\"-40%\" width=\"180%\" height=\"180%\"><feGaussianBlur stdDeviation=\"16\" result=\"b\"/><feMerge><feMergeNode in=\"b\"/><feMergeNode in=\"SourceGraphic\"/></feMerge></filter>\n    <filter id=\"soft\" x=\"-40%\" y=\"-40%\" width=\"180%\" height=\"180%\"><feGaussianBlur stdDeviation=\"9\"/></filter>\n    <pattern id=\"dots\" width=\"30\" height=\"30\" patternUnits=\"userSpaceOnUse\"><circle cx=\"3\" cy=\"3\" r=\"1.5\" fill=\"#a9bcff\" opacity=\".42\"/></pattern>\n    <radialGradient id=\"dotFadeG\" cx=\".5\" cy=\".46\" r=\".62\"><stop offset=\"0\" stop-color=\"#fff\"/><stop offset=\"1\" stop-color=\"#000\"/></radialGradient>\n    <mask id=\"dotMask\"><rect width=\"720\" height=\"1160\" fill=\"url(#dotFadeG)\"/></mask>\n  </defs>\n\n  <rect width=\"720\" height=\"1160\" fill=\"url(#bg)\"/>\n\n  <!-- colour fields -->\n  <g filter=\"url(#blur60)\">\n    <circle cx=\"520\" cy=\"330\" r=\"300\" fill=\"url(#gTeal)\"/>\n    <circle cx=\"140\" cy=\"800\" r=\"340\" fill=\"url(#gViolet)\"/>\n    <circle cx=\"610\" cy=\"980\" r=\"260\" fill=\"url(#gWarm)\"/>\n  </g>\n\n  <!-- fine dot grid, fading out from the centre -->\n  <rect width=\"720\" height=\"1160\" fill=\"url(#dots)\" mask=\"url(#dotMask)\"/>\n\n  <!-- orbits -->\n  <g transform=\"translate(360 540) rotate(-24)\" fill=\"none\">\n    <ellipse rx=\"338\" ry=\"128\" stroke=\"url(#orbit)\" stroke-width=\"1.6\"/>\n    <ellipse rx=\"262\" ry=\"96\"  stroke=\"#9fb6ff\" stroke-opacity=\".28\" stroke-width=\"1.2\" stroke-dasharray=\"3 9\"/>\n    <ellipse rx=\"410\" ry=\"170\" stroke=\"#7c5cff\" stroke-opacity=\".18\" stroke-width=\"1.2\"/>\n    <circle cx=\"338\" cy=\"0\" r=\"7\" fill=\"#1fe5d8\" filter=\"url(#glow)\"/>\n    <circle cx=\"-262\" cy=\"0\" r=\"5\" fill=\"#ffb27d\" filter=\"url(#glow)\"/>\n    <circle cx=\"120\" cy=\"-122\" r=\"4\" fill=\"#fff\" opacity=\".9\"/>\n    <circle cx=\"-200\" cy=\"62\" r=\"3.5\" fill=\"#9fb6ff\"/>\n  </g>\n\n  <!-- the mark: depth layers, then the bracket pair and the glowing slash -->\n  <g transform=\"translate(360 540) scale(.84) translate(-330.5 -231)\">\n    <g fill=\"none\" stroke=\"#7c5cff\" stroke-opacity=\".55\" stroke-width=\"3\" transform=\"translate(-34 30)\">\n      <path d=\"M294,92 L49,138 L6,242 L157,444 L201,358 L103,223 L269,181Z\"/>\n      <path d=\"M508,18 L462,103 L560,237 L392,281 L368,369 L614,323 L655,216Z\"/>\n    </g>\n    <g fill=\"none\" stroke=\"#1fe5d8\" stroke-opacity=\".4\" stroke-width=\"3\" transform=\"translate(30 -26)\">\n      <path d=\"M294,92 L49,138 L6,242 L157,444 L201,358 L103,223 L269,181Z\"/>\n      <path d=\"M508,18 L462,103 L560,237 L392,281 L368,369 L614,323 L655,216Z\"/>\n    </g>\n    <g filter=\"url(#soft)\" opacity=\".5\" transform=\"translate(0 26)\" fill=\"#000\">\n      <path d=\"M294,92 L49,138 L6,242 L157,444 L201,358 L103,223 L269,181Z\"/>\n      <path d=\"M508,18 L462,103 L560,237 L392,281 L368,369 L614,323 L655,216Z\"/>\n    </g>\n    <path fill=\"url(#brk)\" d=\"M294,92 L49,138 L6,242 L157,444 L201,358 L103,223 L269,181Z\"/>\n    <path fill=\"url(#brk)\" d=\"M508,18 L462,103 L560,237 L392,281 L368,369 L614,323 L655,216Z\"/>\n    <path fill=\"url(#slash)\" filter=\"url(#glow)\" d=\"M456,6 L376,11 L207,456 L291,447Z\"/>\n  </g>\n\n  <!-- floating glass icons (support, resolved, fast) -->\n  <g stroke=\"#e8f0ff\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\">\n    <g transform=\"translate(86 262)\">\n      <rect width=\"72\" height=\"72\" rx=\"22\" fill=\"#ffffff\" fill-opacity=\".08\" stroke-opacity=\".28\"/>\n      <path d=\"M22 26h28a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H36l-8 7v-7h-6a4 4 0 0 1-4-4V30a4 4 0 0 1 4-4z\"/>\n    </g>\n    <g transform=\"translate(570 760)\">\n      <rect width=\"72\" height=\"72\" rx=\"22\" fill=\"#ffffff\" fill-opacity=\".08\" stroke-opacity=\".28\"/>\n      <circle cx=\"36\" cy=\"36\" r=\"14\" stroke=\"#2ee6d6\"/><path d=\"M29 36.5l5 5 9-10\" stroke=\"#2ee6d6\"/>\n    </g>\n    <g transform=\"translate(112 842)\">\n      <rect width=\"64\" height=\"64\" rx=\"20\" fill=\"#ffffff\" fill-opacity=\".08\" stroke-opacity=\".28\"/>\n      <path d=\"M35 17L22 36h9l-2 12 13-19h-9z\" stroke=\"#ffb27d\"/>\n    </g>\n  </g>\n\n  <!-- sparkles -->\n  <g fill=\"#fff\">\n    <path d=\"M600 230l4 11 11 4-11 4-4 11-4-11-11-4 11-4z\" opacity=\".85\"/>\n    <path d=\"M70 600l3 8 8 3-8 3-3 8-3-8-8-3 8-3z\" opacity=\".6\"/>\n    <circle cx=\"640\" cy=\"520\" r=\"2.5\" opacity=\".7\"/><circle cx=\"210\" cy=\"140\" r=\"2\" opacity=\".6\"/><circle cx=\"520\" cy=\"1000\" r=\"2\" opacity=\".5\"/>\n  </g>\n\n  <rect width=\"720\" height=\"1160\" fill=\"url(#fadeDown)\"/>\n</svg>\n";
const warnings = [];
let s = fs.readFileSync(abs(FILE), 'utf8');
const orig = s;

// 1) point the left panel at the new picture
const imgRe = /const LOGIN_IMAGE\s*=\s*(['"`])[^'"`]*\1;/;
if (imgRe.test(s)) s = s.replace(imgRe, "const LOGIN_IMAGE = '/login-art.svg';");
else warnings.push("Could not find  const LOGIN_IMAGE = '...';  in app/login/page.tsx. Change the image path there to '/login-art.svg' yourself.");

// 2) "Deskly" wordmark under the mark
if (!s.includes('deskly-brand-text')) {
  const anchor = '{/* Floating ticket card */}';
  const brand = `{/* deskly-brand-text: wordmark under the artwork */}
            <div className="rise pointer-events-none absolute inset-x-0 bottom-32 px-8 text-center" style={{ animationDelay: '0.25s' }}>
              <p className={\`\${heading.className} text-4xl font-bold tracking-tight text-white\`}>
                Desk<span className="text-[#2ee6d6]">ly</span>
              </p>
              <p className="mt-2 text-sm text-white/65">Every request, resolved.</p>
            </div>

            `;
  if (s.includes(anchor) && s.includes('heading.className')) s = s.replace(anchor, brand + anchor);
  else warnings.push('Could not place the "Deskly" wordmark (the page looks different). The picture itself was still changed.');
}

// 3) optional: hide the small live "Ticket #N resolved" card (flip HIDE_TICKET_CARD to false to bring it back)
if (process.argv.includes('--hide-ticket-card') && !s.includes('HIDE_TICKET_CARD')) {
  if (s.includes('{stats?.latestResolved && (') && imgRe.test(s)) {
    s = s.replace('{stats?.latestResolved && (', '{stats?.latestResolved && !HIDE_TICKET_CARD && (');
    s = s.replace(imgRe, (m) => m + "\nconst HIDE_TICKET_CARD = true as boolean; // set to false to show the \"Ticket #N resolved\" card again");
  } else warnings.push('Ticket card block not found, nothing hidden.');
}

if (s !== orig) {
  const b = path.join(BACKUP, FILE);
  if (!fs.existsSync(b)) { fs.mkdirSync(path.dirname(b), { recursive: true }); fs.writeFileSync(b, orig); }
  fs.writeFileSync(abs(FILE), s);
}
fs.writeFileSync(abs(ART), SVG);

console.log('\nDone. New login picture added (public/login-art.svg, about 6 KB).');
if (warnings.length) { console.log('\nCheck these:'); warnings.forEach((w) => console.log(' - ' + w)); }
console.log('\nRefresh the login page (Ctrl+Shift+R).');
console.log('Tip: public/Image.svg (4 MB) is no longer used. You can delete it to make the project lighter.');
console.log('Undo anytime:  node apply-login-art.mjs --revert');
