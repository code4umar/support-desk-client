'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api, ApiRequestError } from '@/lib/api';
import { useToast } from '@/components/Toast';
import RequireRole from '@/components/RequireRole';
import ArticleForm from '@/components/ArticleForm';
import type { Article } from '@/types';

function EditArticleInner() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { show } = useToast();
  const [article, setArticle] = useState<Article | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getArticle(id)
      .then(setArticle)
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : 'Could not load article'));
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-line bg-surface p-8 text-center">
        <p className="font-semibold text-navy">{error}</p>
        <Link href="/help" className="mt-3 inline-block text-sm text-brand-dark hover:underline">← Back to Help Center</Link>
      </div>
    );
  }
  if (!article) return <div className="mx-auto h-64 max-w-3xl animate-pulse rounded-xl border border-line bg-surface" />;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 text-2xl font-bold">Edit article</h1>
      <ArticleForm
        initial={{
          title: article.title,
          body: article.body,
          tags: article.tags,
          categoryId: article.category_id,
          published: article.published,
        }}
        submitLabel="Save changes"
        onCancel={() => router.push(`/help/${id}`)}
        onSubmit={async (data) => {
          await api.updateArticle(id, data);
          show('Article saved');
          router.push(`/help/${id}`);
        }}
      />
    </div>
  );
}

export default function EditArticlePage() {
  return (
    <RequireRole roles={['agent', 'admin']}>
      <EditArticleInner />
    </RequireRole>
  );
}
