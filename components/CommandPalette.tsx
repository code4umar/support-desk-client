'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

type Item = { id: string; label: string; hint?: string; href: string };

const COMMANDS: Item[] = [
  { id: 'c-dash', label: 'Go to Dashboard', hint: 'Command', href: '/dashboard' },
  { id: 'c-tickets', label: 'All tickets', hint: 'Command', href: '/tickets' },
  { id: 'c-new', label: 'New ticket', hint: 'Command', href: '/tickets/new' },
  {
    id: 'c-over',
    label: 'Overdue tickets',
    hint: 'Command',
    href: '/tickets?overdue=true&sortBy=dueAt&order=asc',
  },
  {
    id: 'c-urgent',
    label: 'Urgent & open',
    hint: 'Command',
    href: '/tickets?status=open&priority=urgent',
  },
];

export default function CommandPalette() {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [tickets, setTickets] = useState<Item[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTickets([]);
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    if (!open || !q) {
      setTickets([]);
      return;
    }
    let cancelled = false;
    const handle = setTimeout(() => {
      api
        .getTickets(`q=${encodeURIComponent(q)}&page=1`)
        .then((res: any) => {
          if (cancelled) return;
          const rows: any[] = res?.data ?? [];
          setTickets(
            rows.slice(0, 6).map((t) => ({
              id: `t-${t.id}`,
              label: `${t.subject} #${t.id}`,
              hint: String(t.status).replace('_', ' '),
              href: `/tickets/${t.id}`,
            }))
          );
        })
        .catch(() => {});
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query, open]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cmds = q ? COMMANDS.filter((c) => c.label.toLowerCase().includes(q)) : COMMANDS;
    const jump: Item[] = /^#?\d+$/.test(q)
      ? [{ id: 'jump', label: `Open ticket #${q.replace('#', '')}`, hint: 'Jump', href: `/tickets/${q.replace('#', '')}` }]
      : [];
    return [...jump, ...tickets, ...cmds];
  }, [query, tickets]);

  useEffect(() => setActive(0), [items.length]);

  function go(item?: Item) {
    if (!item) return;
    setOpen(false);
    router.push(item.href);
  }

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(items[active]);
    }
  }

  if (!user || !open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 px-4 pt-[15vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-white/10 bg-zinc-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onInputKey}
          placeholder="Search tickets, or type a command…"
          className="w-full border-b border-white/10 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-zinc-500"
        />
        <ul className="max-h-80 overflow-y-auto p-2">
          {items.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-zinc-500">No results</li>
          )}
          {items.map((it, i) => (
            <li key={it.id}>
              <button
                onMouseEnter={() => setActive(i)}
                onClick={() => go(it)}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${
                  i === active ? 'bg-teal-500/15 text-teal-300' : 'text-zinc-300'
                }`}
              >
                <span className="truncate">{it.label}</span>
                <span className="ml-3 shrink-0 text-xs capitalize text-zinc-500">{it.hint}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="border-t border-white/10 px-4 py-2 text-[11px] text-zinc-500">
          ↑↓ navigate · Enter open · Esc close
        </div>
      </div>
    </div>
  );
}