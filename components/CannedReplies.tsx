'use client';
import { useEffect, useRef, useState } from 'react';
import { api, ApiRequestError } from '@/lib/api';
import { useToast } from '@/components/Toast';

type Reply = {
  id: number;
  title: string;
  body: string;
  created_by: number | null;
  created_by_name: string | null;
};

// {{name}} -> the customer's first name, {{agent}} -> the agent who is writing
export function fillTemplate(text: string, vars: { name: string; agent: string }) {
  return text
    .replace(/\{\{\s*name\s*\}\}/gi, vars.name)
    .replace(/\{\{\s*agent\s*\}\}/gi, vars.agent);
}

// Agent-only picker of ready-made answers. Picking one puts it in the comment box
// (nothing is sent). "Save what you typed" adds the current text to the shared list.
export default function CannedReplies({
  currentText,
  onPick,
  vars,
  meId,
  isAdmin,
}: {
  currentText: string;
  onPick: (text: string) => void;
  vars: { name: string; agent: string };
  meId?: number | string;
  isAdmin: boolean;
}) {
  const { show } = useToast();
  const [open, setOpen] = useState(false);
  const [replies, setReplies] = useState<Reply[] | null>(null);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      setReplies(await api.getCannedReplies());
      setError('');
    } catch {
      setError('Could not load saved replies.');
    }
  }

  useEffect(() => {
    if (open && replies === null) load();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function saveCurrent() {
    const body = currentText.trim();
    if (!body) {
      setError('Type your reply in the comment box first.');
      return;
    }
    if (!title.trim()) {
      setError('Give the reply a short title.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.createCannedReply(title.trim(), body);
      setTitle('');
      await load();
      show('Saved reply added');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not save the reply.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(r: Reply) {
    if (!confirm(`Delete the saved reply "${r.title}"?`)) return;
    try {
      await api.deleteCannedReply(r.id);
      setReplies((prev) => (prev ? prev.filter((x) => x.id !== r.id) : prev));
      show('Saved reply deleted');
    } catch {
      setError('Could not delete that reply.');
    }
  }

  return (
    <div className="relative w-fit" ref={box}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-md border border-line px-3 py-1.5 text-sm text-navy transition hover:border-brand-dark"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15a2 2 0 01-2 2H8l-5 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
        Saved replies
      </button>

      {open && (
        <div
          className="absolute left-0 z-40 mt-2 w-[22rem] max-w-[85vw] rounded-xl border border-line p-3 shadow-2xl"
          style={{ background: 'var(--card)' }}
        >
          {error && (
            <p className="mb-2 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-sm text-red-500">
              {error}
            </p>
          )}

          {replies === null && !error && <p className="px-1 py-2 text-sm text-muted">Loading…</p>}
          {replies && replies.length === 0 && (
            <p className="px-1 py-2 text-sm text-muted">
              No saved replies yet. Write one below and save it.
            </p>
          )}

          {replies && replies.length > 0 && (
            <ul className="max-h-60 overflow-y-auto">
              {replies.map((r) => {
                const canDelete = isAdmin || (r.created_by !== null && String(r.created_by) === String(meId));
                return (
                  <li key={r.id} className="flex items-start gap-1 rounded-lg hover:bg-brand/10">
                    <button
                      type="button"
                      onClick={() => {
                        onPick(fillTemplate(r.body, vars));
                        setOpen(false);
                      }}
                      className="min-w-0 flex-1 px-2 py-2 text-left"
                    >
                      <span className="block truncate text-sm font-semibold text-navy">{r.title}</span>
                      <span className="block truncate text-xs text-muted">
                        {r.body.replace(/\s+/g, ' ')}
                      </span>
                    </button>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => remove(r)}
                        aria-label={`Delete ${r.title}`}
                        className="px-2 py-2 text-muted transition-colors hover:text-red-600"
                      >
                        ×
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-3 border-t border-line pt-3">
            <p className="mb-2 text-xs text-muted">
              Save what you typed in the comment box. Use {'{{name}}'} and {'{{agent}}'} to fill in names automatically.
            </p>
            <div className="flex gap-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={80}
                placeholder="Title, e.g. Password help"
                className="min-w-0 flex-1 rounded-md border border-line bg-transparent p-2 text-sm outline-none focus:border-brand-dark focus:ring-1 focus:ring-brand/50"
              />
              <button
                type="button"
                onClick={saveCurrent}
                disabled={saving}
                className="rounded-md bg-brand px-3 py-2 text-sm font-semibold text-on-brand transition hover:bg-brand-dark disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}