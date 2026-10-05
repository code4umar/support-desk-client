'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Shortcuts() {
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement;
      const typing =
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable;
      if (typing || e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === 'n') {
        e.preventDefault();
        router.push('/tickets/new');
      } else if (e.key === '/') {
        e.preventDefault();
        document
          .querySelector<HTMLInputElement>('input[placeholder^="Search"]')
          ?.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router]);

  return null;
}