'use client';
import { useEffect, useState } from 'react';
import { api, ApiRequestError } from '@/lib/api';
import Markdown from '@/components/Markdown';
import type { ArticleInput, Category } from '@/types';

const inputClass =
  'border border-line bg-transparent rounded-md p-2.5 text-sm outline-none focus:border-brand-dark focus:ring-1 focus:ring-brand/50 transition-colors';
const labelClass = 'text-xs font-semibold tracking-wide text-muted';

// Shared by /help/new and /help/[id]/edit.
export default function ArticleForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<ArticleInput>;
  submitLabel: string;
  onSubmit: (data: ArticleInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [tags, setTags] = useState((initial?.tags ?? []).join(', '));
  const [categoryId, setCategoryId] = useState(initial?.categoryId ? String(initial.categoryId) : '');
  const [published, setPublished] = useState(initial?.published ?? true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!title.trim() || !body.trim()) {
      setError('Title and article text are required');
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        body,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        categoryId: categoryId ? Number(categoryId) : null,
        published,
      });
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Something went wrong. Try again.');
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-6">
      {error && (
        <p role="alert" className="rounded-md border border-red-500/20 bg-red-500/10 py-2 text-center text-sm text-red-500">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="article-title" className={labelClass}>Title</label>
        <input id="article-title" className={inputClass} value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label htmlFor="article-body" className={labelClass}>Article (Markdown)</label>
          <div className="flex gap-1 text-xs" role="tablist">
            {(['write', 'preview'] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`rounded-md px-2.5 py-1 capitalize ${tab === t ? 'bg-brand/15 text-brand-dark' : 'text-muted hover:text-navy'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        {tab === 'write' ? (
          <textarea
            id="article-body"
            rows={14}
            className={`${inputClass} resize-y font-mono`}
            placeholder={'## Heading\n\nUse **bold**, *italic*, `code`, lists and [links](/tickets/new).'}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        ) : (
          <div className="min-h-[200px] rounded-md border border-line p-4">
            {body.trim() ? <Markdown source={body} /> : <p className="text-sm text-muted">Nothing to preview yet.</p>}
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="article-tags" className={labelClass}>Tags (comma separated)</label>
          <input id="article-tags" className={inputClass} placeholder="billing, refund" value={tags} onChange={(e) => setTags(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="article-category" className={labelClass}>Category</label>
          <select id="article-category" className={`${inputClass} bg-surface`} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">No category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-navy">
        <input type="checkbox" className="h-4 w-4 accent-brand-dark" checked={published} onChange={(e) => setPublished(e.target.checked)} />
        Published (visible to customers)
      </label>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded-md px-4 py-2 text-sm font-medium text-muted hover:bg-navy/5 hover:text-navy">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="rounded-md bg-brand px-5 py-2 font-semibold text-on-brand transition-colors hover:bg-brand-dark disabled:opacity-50">
          {saving ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
