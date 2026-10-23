'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Avatar from './Avatar';

// Hamburger menu for phones (the desktop links in the header are hidden below 640px).
export default function MobileNav({ name, role, onLogout }: { name: string; role: string; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const item = 'block rounded-lg px-3 py-2.5 text-sm font-medium text-navy hover:bg-navy/5';

  return (
    <div ref={box} className="relative md:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Menu"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-dark/50 bg-surface text-brand-dark shadow-sm"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-60 overflow-hidden rounded-xl border border-line bg-surface p-2 shadow-2xl">
          <div className="flex items-center gap-3 border-b border-line px-3 pb-3 pt-2">
            <Avatar name={name} size={36} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-navy">{name}</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-dark">{role}</p>
            </div>
          </div>
          <nav className="py-2">
            <Link href="/tickets" className={item} onClick={() => setOpen(false)}>Tickets</Link>
            <Link href="/dashboard" className={item} onClick={() => setOpen(false)}>Dashboard</Link>
            <Link href="/tickets/new" className={item} onClick={() => setOpen(false)}>+ New ticket</Link>
            <Link href="/settings" className={item} onClick={() => setOpen(false)}>Settings</Link>
            {role === 'admin' && <Link href="/admin" className={item} onClick={() => setOpen(false)}>Admin</Link>}
          </nav>
          <button
            type="button"
            onClick={() => { setOpen(false); onLogout(); }}
            className={`${item} w-full border-t border-line text-left text-red-600 dark:text-red-400`}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
