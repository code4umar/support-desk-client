'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import Avatar from '@/components/Avatar';
import NotificationBell from '@/components/NotificationBell';
import ThemeToggle from '@/components/ThemeToggle';
import MobileNav from '@/components/MobileNav';
import { SearchButton } from '@/components/dashboard/widgets';

function UserMenu() {
  const { user, logout } = useAuth();
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

  if (!user) return null;
  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Account menu"
        className="glass-card flex h-11 items-center gap-2.5 rounded-xl py-1 pl-1.5 pr-3 transition-colors hover:border-brand"
      >
        <Avatar name={user.name} size={32} />
        <span className="hidden text-left leading-tight sm:block">
          <span className="block max-w-[120px] truncate text-sm font-medium text-navy">{user.name}</span>
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-brand-dark">{user.role}</span>
        </span>
      </button>
      {open && (
        <div className="absolute right-0 top-14 z-50 w-56 overflow-hidden rounded-xl border border-line bg-surface p-2 shadow-2xl">
          <div className="border-b border-line px-3 pb-2 pt-1">
            <p className="truncate text-sm font-semibold text-navy">{user.name}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
          <Link href="/settings" onClick={() => setOpen(false)} className="mt-1 block rounded-lg px-3 py-2 text-sm text-navy hover:bg-navy/5">
            Settings
          </Link>
          <button
            type="button"
            onClick={() => { setOpen(false); logout(); }}
            className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-500/10 dark:text-red-400"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default function TopBar() {
  const { user, logout } = useAuth();
  if (!user) return null;
  return (
    <div className="flex items-center justify-between gap-3 px-4 pb-2 pt-5 md:justify-end md:px-8">
      <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-[var(--accent-2)]">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-on-brand" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
        <span className="text-lg font-bold text-navy">Deskly</span>
      </Link>
      <div className="flex items-center gap-2 sm:gap-2.5">
        <SearchButton compact />
        <NotificationBell />
        <ThemeToggle />
        <MobileNav name={user.name} role={user.role} onLogout={logout} />
        <div className="hidden sm:block">
          <UserMenu />
        </div>
      </div>
    </div>
  );
}
