'use client';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';
import Avatar from './Avatar';
import MobileNav from './MobileNav';
import BrandMark from './BrandMark';

export default function Header() {
  const { user, loading, logout } = useAuth();

  if (loading) return <header className="h-16 border-b border-line bg-surface backdrop-blur" />;

  return (
    <header className="sticky top-0 z-50 border-b border-brand-dark/20 bg-surface/85 backdrop-blur-md shadow-lg shadow-navy/10">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <span className="transition-transform group-hover:scale-105">
            <BrandMark size={34} />
          </span>
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-navy to-muted bg-clip-text text-transparent">
            Deskly
          </span>
        </Link>

        {user ? (
          <div className="flex items-center gap-4">
            {/* NEW: nav links */}
           <nav className="hidden items-center gap-1 sm:flex">
              <Link
                href="/tickets"
                className="text-sm font-medium text-muted hover:text-navy transition-colors px-3 py-1.5 rounded-md hover:bg-navy/5"
              >
                Tickets
              </Link>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-muted hover:text-navy transition-colors px-3 py-1.5 rounded-md hover:bg-navy/5"
              >
                Dashboard
              </Link>
              <Link href="/settings" className="text-sm font-medium text-muted hover:text-navy transition-colors px-3 py-1.5 rounded-md hover:bg-navy/5">
                Settings
              </Link>
              {user.role === 'admin' && (
                <Link href="/admin" className="text-sm font-medium text-muted hover:text-navy transition-colors px-3 py-1.5 rounded-md hover:bg-navy/5">
                  Admin
                </Link>
              )}
            </nav>

            <NotificationBell />

            <ThemeToggle />
            <MobileNav name={user.name} role={user.role} onLogout={logout} />

            <div className="hidden sm:flex items-center gap-2 rounded-full border border-line bg-navy/5 px-3 py-1.5">
              <Avatar name={user.name} size={24} />
              <span className="text-sm font-medium text-navy">{user.name}</span>
              <span className="text-xs uppercase tracking-wide text-brand-dark font-semibold">
                {user.role}
              </span>
            </div>
            <button
              onClick={logout}
              className="hidden sm:block text-sm font-medium text-muted hover:text-navy transition-colors px-3 py-1.5 rounded-md hover:bg-navy/5"
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/login"
              className="text-sm font-medium text-navy hover:text-navy transition-colors px-4 py-2 rounded-md hover:bg-navy/5"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold text-on-brand bg-brand hover:bg-brand-dark transition-colors px-4 py-2 rounded-md"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}