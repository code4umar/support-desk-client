'use client';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

export default function Header() {
  const { user, loading, logout } = useAuth();

  if (loading) return <header className="h-16 border-b border-white/5 bg-black/40 backdrop-blur" />;

  return (
    <header className="sticky top-0 z-50 border-b border-teal-500/20 bg-black/60 backdrop-blur-md shadow-lg shadow-black/20">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/tickets" className="flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 shadow-md shadow-teal-500/30 transition-transform group-hover:scale-105">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Deskly
          </span>
        </Link>

        {user ? (
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-teal-400" />
              <span className="text-sm font-medium text-zinc-200">{user.name}</span>
              <span className="text-xs uppercase tracking-wide text-teal-400 font-semibold">
                {user.role}
              </span>
            </div>
            <button
              onClick={logout}
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors px-3 py-1.5 rounded-md hover:bg-white/5"
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-300 hover:text-white transition-colors px-4 py-2 rounded-md hover:bg-white/5"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold text-black bg-teal-500 hover:bg-teal-400 transition-colors px-4 py-2 rounded-md"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}