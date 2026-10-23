'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { LogoMark } from '@/components/dashboard/widgets';

const icon = (d: string) => (
  <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: icon('M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v4H4zM14 15h6v4h-6z') },
  { href: '/tickets', label: 'Tickets', icon: icon('M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4zM14 6v12') },
  { href: '/tickets/new', label: 'New ticket', icon: icon('M12 8v8M8 12h8M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z') },
  { href: '/admin', label: 'Admin', icon: icon('M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6z'), adminOnly: true },
  { href: '/settings', label: 'Settings', icon: icon('M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z') },
];

function isActive(pathname: string, href: string) {
  if (href === '/tickets') return pathname.startsWith('/tickets') && pathname !== '/tickets/new';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="hidden w-[232px] shrink-0 flex-col border-r border-line bg-[var(--sidebar)] px-4 py-6 md:sticky md:top-0 md:flex md:h-screen md:self-start">
      <Link href="/dashboard" className="mb-8 flex items-center gap-2.5 px-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-[var(--accent-2)] shadow-lg shadow-brand/30">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-on-brand" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
        <span className="text-xl font-bold tracking-tight text-navy">Deskly</span>
      </Link>

      <nav className="space-y-1.5">
        {ITEMS.filter((i) => !i.adminOnly || user?.role === 'admin').map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                active ? 'nav-active' : 'text-muted hover:bg-navy/5 hover:text-navy'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="glass-card relative mt-auto overflow-hidden p-4 text-center">
        <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand/40 to-transparent ring-1 ring-white/10">
          <LogoMark className="h-9 w-12 text-navy" />
        </div>
        <p className="text-sm font-medium text-navy">Need a hand? Create a ticket in seconds.</p>
        <Link href="/tickets/new" className="nav-active mt-3 block rounded-xl px-4 py-2.5 text-sm font-semibold">
          New ticket
        </Link>
      </div>
    </aside>
  );
}
