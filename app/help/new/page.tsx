'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { clearArticleDraft, readArticleDraft } from '@/lib/session';
import { useToast } from '@/components/Toast';
import RequireRole from '@/components/RequireRole';
import ArticleForm from '@/components/ArticleForm';

function NewArticleInner() {
  const router = useRouter();
  const { show } = useToast();
  // an AI draft handed over from a solved ticket, if there is one
  const [draft] = useState(readArticleDraft);

  useEffect(() => {
    clearArticleDraft();
  }, []);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-2xl font-bold">New help article</h1>
      {draft ? (
        <p className="mb-4 rounded-md border border-brand/30 bg-brand/5 px-3 py-2 text-sm text-navy">
          ✨ Drafted by AI from a solved ticket. Check every step before publishing; it starts as an unpublished draft.
        </p>
      ) : (
        <div className="mb-4" />
      )}
      <ArticleForm
        initial={draft ? { ...draft, published: false } : undefined}
        submitLabel={draft ? 'Save article' : 'Publish article'}
        onCancel={() => router.push('/help')}
        onSubmit={async (data) => {
          const article = await api.createArticle(data);
          show(data.published ? 'Article published' : 'Draft saved');
          router.push(`/help/${article.id}`);
        }}
      />
    </div>
  );
}

export default function NewArticlePage() {
  return (
    <RequireRole roles={['agent', 'admin']}>
      <NewArticleInner />
    </RequireRole>
  );
}
