'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function TitleSync() {
  const pathname = usePathname();

  useEffect(() => {
    let t = 'Deskly';
    if (pathname === '/dashboard') t = 'Dashboard · Deskly';
    else if (pathname === '/tickets') t = 'Tickets · Deskly';
    else if (pathname === '/tickets/new') t = 'New ticket · Deskly';
    else if (pathname.startsWith('/tickets/'))
      t = `Ticket #${pathname.split('/')[2]} · Deskly`;
    else if (pathname === '/login') t = 'Login · Deskly';
    else if (pathname === '/register') t = 'Register · Deskly';
    document.title = t;
  }, [pathname]);

  return null;
}