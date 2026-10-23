#!/usr/bin/env node
// Deskly CLIENT Phase 3: live SLA countdown on the ticket page, @mention chips + highlighting in comments,
// and the notification bell for agents (they receive the mentions).
// Run from the client repo root:   node apply-phase3-client.mjs          Undo:  node apply-phase3-client.mjs --revert

import fs from 'node:fs';
import path from 'node:path';
const ROOT = process.cwd();
const BACKUP = path.join(ROOT, '.phase3-backup');
const MANIFEST = '.phase3-created.json';
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
  console.log(n ? `Phase 3 removed (${n} files restored/deleted).` : 'Nothing to revert.');
  process.exit(0);
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

if (!exists('package.json') || !exists('app/tickets/[id]/page.tsx')) {
  console.error('Run this from the client repo root (the folder with package.json and app/).'); process.exit(1);
}

createFile("components/SlaCountdown.tsx", "'use client';\nimport { useEffect, useState } from 'react';\n\nfunction span(ms: number) {\n  const mins = Math.floor(Math.abs(ms) / 60000);\n  const days = Math.floor(mins / 1440);\n  const hrs = Math.floor((mins % 1440) / 60);\n  const m = mins % 60;\n  if (days >= 1) return `${days}d ${hrs}h`;\n  if (hrs >= 1) return `${hrs}h ${m}m`;\n  return `${m}m`;\n}\n\n// Live SLA badge for a ticket: \"Due in 2h 10m\" -> turns amber, then orange, then a pulsing red \"Overdue 15m\".\n// Re-checks every 30 seconds, so the page does not need to be refreshed.\nexport default function SlaCountdown({ dueAt, status }: { dueAt?: string | null; status: string }) {\n  const [now, setNow] = useState(() => Date.now());\n\n  useEffect(() => {\n    const id = setInterval(() => setNow(Date.now()), 30000);\n    return () => clearInterval(id);\n  }, []);\n\n  if (!dueAt || status === 'resolved' || status === 'closed') return null;\n  const due = new Date(dueAt).getTime();\n  if (Number.isNaN(due)) return null;\n\n  const left = due - now;\n  const overdue = left < 0;\n  const tone = overdue\n    ? 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'\n    : left < 3600000\n      ? 'border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-400'\n      : left < 4 * 3600000\n        ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400'\n        : 'border-brand-dark/30 bg-brand/15 text-brand-dark';\n\n  return (\n    <span\n      title={`SLA due ${new Date(dueAt).toLocaleString()}`}\n      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${tone}`}\n    >\n      {overdue && <span className=\"h-1.5 w-1.5 animate-pulse rounded-full bg-current\" aria-hidden=\"true\" />}\n      {overdue ? `Overdue ${span(left)}` : `Due in ${span(left)}`}\n    </span>\n  );\n}\n");
createFile("components/MentionText.tsx", "// Shows a comment's text and highlights \"@Full Name\" tags (an @ followed by up to three capitalised words).\nconst MENTION = /((?<![\\p{L}\\p{N}._%+-])@\\p{Lu}[\\p{L}.'\u2019-]*(?:\\s+\\p{Lu}[\\p{L}.'\u2019-]*){0,2})/gu;\n\nexport default function MentionText({ body }: { body: string }) {\n  const parts = body.split(MENTION); // tags land on the odd positions\n  return (\n    <>\n      {parts.map((part, i) =>\n        i % 2 === 1 ? (\n          <span key={i} className=\"rounded bg-brand/15 px-1 font-medium text-brand-dark\">\n            {part}\n          </span>\n        ) : (\n          part\n        ),\n      )}\n    </>\n  );\n}\n");
createFile("components/MentionPicker.tsx", "'use client';\nimport { useEffect, useState } from 'react';\nimport { api } from '@/lib/api';\n\ntype Person = { id: number; full_name: string; role?: string };\n\n// One-click \"@Name\" chips under the comment box (staff only). Clicking adds the tag to the text;\n// the backend then sends that person a notification when the comment is posted.\nexport default function MentionPicker({ onPick, meId }: { onPick: (text: string) => void; meId?: number | string }) {\n  const [staff, setStaff] = useState<Person[]>([]);\n\n  useEffect(() => {\n    let alive = true;\n    api\n      .getStaff()\n      .then((list) => alive && setStaff(Array.isArray(list) ? list : []))\n      .catch(() => {});\n    return () => {\n      alive = false;\n    };\n  }, []);\n\n  const others = staff.filter((s) => String(s.id) !== String(meId));\n  if (others.length === 0) return null;\n\n  return (\n    <div className=\"flex flex-wrap items-center gap-1.5 text-xs\">\n      <span className=\"text-muted\">Mention:</span>\n      {others.map((s) => (\n        <button\n          key={s.id}\n          type=\"button\"\n          onClick={() => onPick(`@${s.full_name} `)}\n          className=\"rounded-full border border-line px-2.5 py-1 text-navy transition-colors hover:border-brand-dark hover:bg-brand/10\"\n        >\n          @{s.full_name}\n        </button>\n      ))}\n    </div>\n  );\n}\n");
createFile("__tests__/phase3.test.tsx", "import { render, screen } from '@testing-library/react';\nimport '@testing-library/jest-dom';\nimport SlaCountdown from '@/components/SlaCountdown';\nimport MentionText from '@/components/MentionText';\n\nconst inHours = (h: number) => new Date(Date.now() + h * 3600000 + 30000).toISOString();\n\ndescribe('SlaCountdown', () => {\n  test('shows time left, in hours and minutes', () => {\n    render(<SlaCountdown dueAt={inHours(2)} status=\"open\" />);\n    expect(screen.getByText(/^Due in 2h/)).toBeInTheDocument();\n  });\n\n  test('shows days for far-away deadlines', () => {\n    render(<SlaCountdown dueAt={inHours(50)} status=\"open\" />);\n    expect(screen.getByText(/^Due in 2d/)).toBeInTheDocument();\n  });\n\n  test('turns into \"Overdue\" once the time has passed', () => {\n    render(<SlaCountdown dueAt={inHours(-3)} status=\"in_progress\" />);\n    expect(screen.getByText(/^Overdue 2h/)).toBeInTheDocument();\n  });\n\n  test('shows nothing for resolved/closed tickets or when there is no deadline', () => {\n    const { container, rerender } = render(<SlaCountdown dueAt={inHours(2)} status=\"resolved\" />);\n    expect(container).toBeEmptyDOMElement();\n    rerender(<SlaCountdown dueAt={null} status=\"open\" />);\n    expect(container).toBeEmptyDOMElement();\n  });\n});\n\ndescribe('MentionText', () => {\n  test('highlights @Full Name and keeps the rest of the text', () => {\n    render(<p data-testid=\"t\"><MentionText body=\"Please check @Sara Agent today\" /></p>);\n    expect(screen.getByText('@Sara Agent')).toHaveClass('text-brand-dark');\n    expect(screen.getByTestId('t')).toHaveTextContent('Please check @Sara Agent today');\n  });\n\n  test('does not highlight email addresses', () => {\n    const { container } = render(<p><MentionText body=\"mail team@Example.com\" /></p>);\n    expect(container.querySelector('span')).toBeNull(); // nothing highlighted\n    expect(container).toHaveTextContent('mail team@Example.com');\n  });\n});\n");

const T = 'app/tickets/[id]/page.tsx';
edit(T, 'imports', "import CannedReplies from '@/components/CannedReplies';", "import CannedReplies from '@/components/CannedReplies';\nimport SlaCountdown from '@/components/SlaCountdown';\nimport MentionText from '@/components/MentionText';\nimport MentionPicker from '@/components/MentionPicker';", 'import SlaCountdown');
// the old badge was worked out once when the page loaded; the new one keeps counting
editRe(T, 'live SLA badge', /\{sla && \(\s*<span className=\{`[^`]*\$\{sla\.cls\}`\}>\s*\{sla\.label\}\s*<\/span>\s*\)\}/, '<SlaCountdown dueAt={dueAt} status={ticket.status} />', '<SlaCountdown');
if (exists(T)) { const s0 = read(T); const n0 = s0.replace(/^[ \t]*const sla = slaInfo\(dueAt, ticket\.status\);\r?\n/m, ''); if (n0 !== s0 && !/\bsla\b/.test(n0)) { backup(T); write(T, n0); } } // remove the old, now unused variable
editRe(T, 'highlight mentions in comments', /(<p className="[^"]*">)\{c\.body\}(<\/p>)/, '$1<MentionText body={c.body} />$2', '<MentionText body');
editRe(T, 'mention chips', /(onChange=\{\(e\) => setCommentBody\(e\.target\.value\)\}\s*\/>)/, `$1
          {role && permissions.canWriteInternalComment(role) && (
            <MentionPicker
              meId={user?.id}
              onPick={(tag) => setCommentBody((prev) => (prev && !/\\s$/.test(prev) ? \`\${prev} \${tag}\` : prev + tag))}
            />
          )}`, '<MentionPicker');
// drop the now-unused helper import if it was the only thing it brought in
if (exists(T)) { const s = read(T); if (!/slaInfo\(/.test(s) && /\bslaInfo\b/.test(s)) { const n = s.replace(/\bslaInfo,\s*/, '').replace(/,\s*slaInfo\b/, ''); if (n !== s) { backup(T); write(T, n); } } }

const B = 'components/NotificationBell.tsx';
edit(B, 'bell for agents', "const isAdmin = user?.role === 'admin';", "const isAdmin = user?.role === 'admin' || user?.role === 'agent'; // agents get the mentions", "|| user?.role === 'agent'");
edit(B, 'labels', "  user_login: 'Login',\n};", "  user_login: 'Login',\n  user_registered: 'New account',\n  mention: 'Mention',\n};", "mention: 'Mention'");

if (created.length) write(MANIFEST, JSON.stringify(created, null, 2));
console.log('\nPhase 3 client done.');
if (warnings.length) { console.log('\nCheck these (skipped parts):'); warnings.forEach((w) => console.log(' - ' + w)); }
console.log('\nNext: refresh. The backend needs apply-phase3-backend.mjs for the mention notifications.');
console.log('Undo anytime:  node apply-phase3-client.mjs --revert');
