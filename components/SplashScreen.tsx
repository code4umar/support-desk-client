'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

// Intro animation. Plays:
//  - on every full page load (open / refresh)
//  - whenever you move to /dashboard, /tickets, a ticket (/tickets/44) or /login
//  - when you leave login/register for the app (right after signing in)
// It does NOT replay for filter / page changes on the tickets list (only the
// query string changes there, not the path).
const isAuthPage = (p: string) =>
  p === '/login' || p === '/register' || p === '/forgot-password';
const isTicketDetail = (p: string) => /^\/tickets\/\d+$/.test(p);
const splashWorthy = (p: string) =>
  p === '/dashboard' || p === '/tickets' || p === '/login' || isTicketDetail(p);

export default function SplashScreen() {
  const pathname = usePathname();
  const [prevPath, setPrevPath] = useState(pathname);
  const [run, setRun] = useState(0);

  // adjust state while rendering, so the new splash mounts before paint (no flash)
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    const authToAuth = isAuthPage(prevPath) && isAuthPage(pathname);
    if (!authToAuth && (splashWorthy(pathname) || isAuthPage(prevPath))) {
      setRun((r) => r + 1);
    }
  }

  return (
    <div key={run} className="deskly-splash" aria-hidden="true">
      <svg className="deskly-splash-logo" viewBox="0 0 661 462" fill="none">
        <path className="sp-left" d="M294,92 L49,138 L6,242 L157,444 L201,358 L103,223 L269,181Z" />
        <path className="sp-right" d="M508,18 L462,103 L560,237 L392,281 L368,369 L614,323 L655,216Z" />
        <path className="sp-slash" d="M456,6 L376,11 L207,456 L291,447Z" />
      </svg>
    </div>
  );
}