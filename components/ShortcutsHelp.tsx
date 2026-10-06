'use client';
import { useEffect, useState } from 'react';

const ROWS: [string, string][] = [
  ['Ctrl + K', 'Command palette'],
  ['N', 'New ticket'],
  ['/', 'Focus search'],
  ['?', 'Show this help'],
  ['Esc', 'Close dialogs'],
];

export default function ShortcutsHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement;
      const typing =
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable;
      if (e.key === 'Escape') setOpen(false);
      else if (e.key === '?' && !typing && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/40 px-4 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-line bg-surface p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-3 text-lg font-bold">Keyboard shortcuts</h2>
        <ul className="space-y-2">
          {ROWS.map(([k, d]) => (
            <li key={k} className="flex items-center justify-between text-sm">
              <span className="text-navy">{d}</span>
              <kbd className="rounded border border-line bg-navy/5 px-2 py-0.5 text-xs text-brand-dark">
                {k}
              </kbd>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}