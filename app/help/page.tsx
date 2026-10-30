'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { api, ApiRequestError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { permissions } from '@/lib/permissions';
import RequireAuth from '@/components/RequireAuth';
import type { ArticleSummary, Category, Role } from '@/types';

const inputClass =
  'border border-line bg-surface rounded-md px-3 py-2 text-sm outline-none focus:border-brand-dark focus:ring-1 focus:ring-brand/50 transition-colors';

// Search, tag, and category all live in the URL, like the ticket list filters.
function HelpCenterInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const canWrite = !!user && permissions.canWriteArticle(user.role as Role);

  const urlQ = searchParams.get('q') ?? '';
  const tag = searchParams.get('tag') ?? '';
  const categoryId = searchParams.get('categoryId') ?? '';

  const [search, setSearch] = useState(urlQ);
  const [prevUrlQ, setPrevUrlQ] = useState(urlQ);
  const [result, setResult] = useState<{ key: string; articles: ArticleSummary[]; error: string } | null>(null);
  const [tags, setTags] = useState<{ tag: string; count: number }[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  useEffect(() => {
    api.getArticleTags().then(setTags).catch(() => {});
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  // the URL changed from outside (back button, tag link): mirror it into the box
  if (urlQ !== prevUrlQ) {
    setPrevUrlQ(urlQ);
    setSearch(urlQ);
  }

  useEffect(() => {
    if (search === urlQ) return;
    const handle = setTimeout(() => setParam('q', search.trim() || null), 400);
    return () => clearTimeout(handle);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const query = new URLSearchParams();
  if (urlQ) query.set('q', urlQ);
  if (tag) query.set('tag', tag);
  if (categoryId) query.set('categoryId', categoryId);
  const key = query.toString();

  useEffect(() => {
    let cancelled = false;
    api
      .searchArticles(key)
      .then((rows) => !cancelled && setResult({ key, articles: rows, error: '' }))
      .catch((err) => {
        if (cancelled) return;
        setResult({ key, articles: [], error: err instanceof ApiRequestError ? err.message : 'Could not load articles' });
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  // null while the current search is in flight
  const articles = result?.key === key ? result.articles : null;
  const error = result?.key === key ? result.error : '';

  const filtered = !!(urlQ || tag || categoryId);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Help Center</h1>
          <p className="text-sm text-muted">Find an answer before you open a ticket</p>
        </div>
        {canWrite && (
          <Link href="/help/new" className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-on-brand hover:bg-brand-dark">
            + New article
          </Link>
        )}
      </div>

      <div className="mb-4 rounded-xl border border-line bg-surface p-4">
        <div className="flex flex-wrap gap-3">
          <input
            aria-label="search articles"
            type="search"
            className={`${inputClass} min-w-[200px] flex-1`}
            placeholder="Search the help center…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            aria-label="category filter"
            className={inputClass}
            value={categoryId}
            onChange={(e) => setParam('categoryId', e.target.value || null)}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((t) => (
              <button
                key={t.tag}
                type="button"
                aria-pressed={tag === t.tag}
                onClick={() => setParam('tag', tag === t.tag ? null : t.tag)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  tag === t.tag
                    ? 'border-brand-dark bg-brand/15 text-brand-dark'
                    : 'border-line text-muted hover:border-brand-dark/60 hover:text-navy'
                }`}
              >
                #{t.tag} <span className="opacity-60">{t.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

      {articles === null ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl border border-line bg-surface" />)}
        </div>
      ) : articles.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-8 text-center">
          <p className="font-semibold text-navy">{filtered ? 'No articles match that search' : 'No articles yet'}</p>
          <p className="mt-1 text-sm text-muted">Can&apos;t find what you need? Our team is happy to help.</p>
          <Link href="/tickets/new" className="mt-4 inline-block rounded-md bg-brand px-4 py-2 text-sm font-semibold text-on-brand hover:bg-brand-dark">
            Open a ticket
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {articles.map((a) => (
            <li key={a.id}>
              <Link
                href={`/help/${a.id}`}
                className="block rounded-xl border border-line bg-surface p-4 transition-colors hover:border-brand-dark/60"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-navy">{a.title}</h2>
                  {!a.published && (
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase text-amber-700 dark:text-amber-400">
                      Draft
                    </span>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{a.excerpt}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted">
                  {a.category_name && <span className="font-medium text-brand-dark">{a.category_name}</span>}
                  {a.tags.map((t) => <span key={t}>#{t}</span>)}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function HelpCenterPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<div className="mx-auto h-40 max-w-4xl animate-pulse rounded-xl border border-line bg-surface" />}>
        <HelpCenterInner />
      </Suspense>
    </RequireAuth>
  );
}
