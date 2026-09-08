'use client';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

export default function Header() {
  const { user, loading, logout } = useAuth();

  if (loading) return <header className="p-4 border-b h-14" />;

  return (
    <header className="p-4 border-b flex justify-between items-center">
      <Link href="/tickets" className="font-bold">Support Desk</Link>
      {user ? (
        <div className="flex items-center gap-3">
          <span>{user.name} · {user.role}</span>
          <button onClick={logout} className="text-sm underline">Sign out</button>
        </div>
      ) : (
        <div className="flex gap-3">
          <Link href="/login">Login</Link>
          <Link href="/register">Register</Link>
        </div>
      )}
    </header>
  );
}