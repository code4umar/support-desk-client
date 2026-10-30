'use client';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';

const PUBLIC = ['/login', '/register', '/forgot-password', '/reset-password'];

// Signed-in pages get the sidebar layout; login / register / password pages keep the simple top header.
export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const isPublic = PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!user || isPublic) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-5xl p-4">{children}</main>
      </>
    );
  }

  return (
    // From md up the app is exactly one screen tall and the page never scrolls:
    // each page lays itself out inside <main>. (main keeps a scroll fallback
    // only for very short windows.) Phones scroll normally.
    <div className="app-outer min-h-screen md:h-dvh md:overflow-hidden md:p-3 lg:p-4">
      <div className="app-window mx-auto flex min-h-screen max-w-[1480px] overflow-clip md:h-full md:min-h-0 md:rounded-[28px]">
        <Sidebar />
        <div className="relative z-10 flex min-w-0 flex-1 flex-col md:min-h-0">
          <TopBar />
          <main className="flex-1 px-4 pb-8 pt-2 md:min-h-0 md:overflow-y-auto md:px-7 md:pb-5">{children}</main>
        </div>
      </div>
    </div>
  );
}
