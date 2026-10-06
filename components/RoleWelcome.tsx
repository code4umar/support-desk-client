'use client';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

export default function RoleWelcome() {
  const { user } = useAuth();
  if (!user) return null;
  const role = String(user.role);

  const links =
    role === 'requester'
      ? [
          { href: '/tickets/new', label: '+ New ticket' },
          { href: '/tickets', label: 'My tickets' },
        ]
      : [
          { href: `/tickets?assigneeId=${user.id}`, label: 'Assigned to me' },
          { href: '/tickets?overdue=true&sortBy=dueAt&order=asc', label: 'Overdue' },
          { href: '/tickets?status=open&priority=urgent', label: 'Urgent & open' },
        ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-teal-500/20 bg-teal-500/[0.04] px-5 py-4">
      <div>
        <p className="font-semibold">Welcome back, {user.name}</p>
        <p className="text-xs capitalize text-zinc-500">
          {role} view · press <kbd className="text-teal-300">Ctrl+K</kbd> to search
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {links.map((l) => (
          <Link
            key={l.label}
            href={l.href}
            className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300 hover:border-teal-400 hover:text-white"
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}