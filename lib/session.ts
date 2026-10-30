const TOKEN_KEY = 'support-desk-token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// Hands an AI article draft from the ticket page to /help/new. Session storage,
// so it never outlives the tab. Reading and clearing are separate so React's
// double-invoked state initializers in dev can't lose the draft.
const ARTICLE_DRAFT_KEY = 'deskly-article-draft';

export function stashArticleDraft(draft: { title: string; body: string; tags: string[] }): void {
  try {
    sessionStorage.setItem(ARTICLE_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // storage blocked: the editor just opens empty
  }
}

export function readArticleDraft(): { title: string; body: string; tags: string[] } | null {
  try {
    const raw = sessionStorage.getItem(ARTICLE_DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearArticleDraft(): void {
  try {
    sessionStorage.removeItem(ARTICLE_DRAFT_KEY);
  } catch {
    // nothing to clear
  }
}