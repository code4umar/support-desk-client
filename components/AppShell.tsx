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
    <div className="app-outer min-h-screen md:p-5 lg:p-7">
      <div className="app-window mx-auto flex min-h-screen max-w-[1480px] overflow-clip md:min-h-[calc(100vh-2.5rem)] md:rounded-[28px] lg:min-h-[calc(100vh-3.5rem)]">
        <Sidebar />
        <div className="relative z-10 flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="flex-1 px-4 pb-10 pt-2 md:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
