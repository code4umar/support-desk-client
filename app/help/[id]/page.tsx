'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api, ApiRequestError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { permissions } from '@/lib/permissions';
import { timeAgo } from '@/lib/time';
import { useToast } from '@/components/Toast';
import RequireAuth from '@/components/RequireAuth';
import Markdown from '@/components/Markdown';
import ArticleFeedback from '@/components/ArticleFeedback';
import type { Article, Role } from '@/types';

type State =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error'; message: string }
  | { status: 'ready'; article: Article };

function ArticleInner() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { show } = useToast();
  const [state, setState] = useState<State>({ status: 'loading' });
  const role = user?.role as Role | undefined;

  useEffect(() => {
    api
      .getArticle(id)
      .then((article) => setState({ status: 'ready', article }))
      .catch((err) =>
        setState(
          err instanceof ApiRequestError && err.status === 404
            ? { status: 'not-found' }
            : { status: 'error', message: err instanceof ApiRequestError ? err.message : 'Could not load article' },
        ),
      );
  }, [id]);

  async function onDelete() {
    if (!confirm('Delete this article? This cannot be undone.')) return;
    try {
      await api.deleteArticle(id);
      show('Article deleted');
      router.push('/help');
    } catch (err) {
      show(err instanceof ApiRequestError ? err.message : 'Could not delete article', 'error');
    }
  }

  if (state.status === 'loading') return <div className="mx-auto h-64 max-w-3xl animate-pulse rounded-xl border border-line bg-surface" />;
  if (state.status !== 'ready') {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-line bg-surface p-8 text-center">
        <p className="font-semibold text-navy">{state.status === 'not-found' ? 'Article not found' : state.message}</p>
        <Link href="/help" className="mt-3 inline-block text-sm text-brand-dark hover:underline">← Back to Help Center</Link>
      </div>
    );
  }

  const a = state.article;
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/help" className="text-sm text-muted hover:text-navy">← Help Center</Link>

      <article className="mt-3 rounded-xl border border-line bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-navy">{a.title}</h1>
            <p className="mt-1 text-xs text-muted">
              {a.category_name && <span className="font-medium text-brand-dark">{a.category_name} · </span>}
              Updated {timeAgo(a.updated_at)}
              {a.author_name && ` by ${a.author_name}`}
              {!a.published && <span className="ml-2 font-semibold uppercase text-amber-600">Draft</span>}
            </p>
          </div>
          {role && permissions.canWriteArticle(role) && (
            <div className="flex gap-2">
              <Link href={`/help/${a.id}/edit`} className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-navy hover:bg-navy/5">
                Edit
              </Link>
              {permissions.canDeleteArticle(role) && (
                <button type="button" onClick={onDelete} className="rounded-md border border-red-500/30 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-500/10 dark:text-red-400">
                  Delete
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mt-5 border-t border-line pt-5">
          <Markdown source={a.body} />
        </div>

        {a.tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {a.tags.map((t) => (
              <Link key={t} href={`/help?tag=${encodeURIComponent(t)}`} className="rounded-full border border-line px-3 py-1 text-xs text-muted hover:border-brand-dark/60 hover:text-navy">
                #{t}
              </Link>
            ))}
          </div>
        )}

        {a.published && <ArticleFeedback articleId={a.id} />}
      </article>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand/30 bg-brand/5 p-4">
        <p className="text-sm text-navy">Didn&apos;t solve your problem?</p>
        <Link href="/tickets/new" className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-on-brand hover:bg-brand-dark">
          Open a ticket
        </Link>
      </div>
    </div>
  );
}

export default function ArticlePage() {
  return (
    <RequireAuth>
      <ArticleInner />
    </RequireAuth>
  );
}
