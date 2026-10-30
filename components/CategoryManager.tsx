'use client';
import { useEffect, useState } from 'react';
import { api, ApiRequestError } from '@/lib/api';
import { useToast } from '@/components/Toast';
import type { Category } from '@/types';

// Admin-only list of ticket/article categories. Deleting one keeps its
// tickets and articles; they just become uncategorised.
export default function CategoryManager() {
  const { show } = useToast();
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => api.getCategories().then(setCategories).catch(() => setCategories([]));
  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await api.createCategory(name.trim());
      setName('');
      show('Category added');
      load();
    } catch (err) {
      show(err instanceof ApiRequestError ? err.message : 'Could not add category', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function remove(c: Category) {
    const used = c.ticket_count + c.article_count;
    if (used && !confirm(`"${c.name}" is used by ${c.ticket_count} tickets and ${c.article_count} articles. They will become uncategorised. Delete it?`)) return;
    try {
      await api.deleteCategory(c.id);
      show('Category deleted');
      load();
    } catch (err) {
      show(err instanceof ApiRequestError ? err.message : 'Could not delete category', 'error');
    }
  }

  return (
    <section className="rounded-xl border border-line bg-surface p-5">
      <h2 className="text-lg font-bold text-navy">Categories</h2>
      <p className="text-sm text-muted">Used to group tickets and help articles</p>

      <form onSubmit={add} className="mt-4 flex gap-2">
        <input
          aria-label="New category name"
          placeholder="e.g. Shipping"
          maxLength={60}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded-md border border-line bg-transparent px-3 py-1.5 text-sm outline-none focus:border-brand-dark focus:ring-1 focus:ring-brand/50"
        />
        <button type="submit" disabled={saving || !name.trim()} className="rounded-md bg-brand px-4 py-1.5 text-sm font-semibold text-on-brand hover:bg-brand-dark disabled:opacity-50">
          Add
        </button>
      </form>

      <ul className="mt-4 divide-y divide-line">
        {categories === null && <li className="py-3 text-sm text-muted">Loading…</li>}
        {categories?.length === 0 && <li className="py-3 text-sm text-muted">No categories yet</li>}
        {categories?.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
            <div>
              <p className="text-sm font-medium text-navy">{c.name}</p>
              <p className="text-xs text-muted">{c.ticket_count} tickets · {c.article_count} articles</p>
            </div>
            <button type="button" onClick={() => remove(c)} className="text-xs text-muted hover:text-red-600">
              Delete
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
