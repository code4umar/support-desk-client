import { getToken, clearToken } from './session';
import type { ApiError, Article, ArticleInput, ArticleSummary, Category, KbInsights, SimilarTickets, TicketStatus } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

class ApiRequestError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;
  constructor(err: ApiError) {
    super(err.message);
    this.status = err.status;
    this.fieldErrors = err.fieldErrors;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  isAuthCall = false
): Promise<T> {
  if (!BASE_URL) {
    throw new ApiRequestError({ status: 0, message: 'API URL not configured' });
  }

  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers, cache: 'no-store' });

  if (res.status === 204) {
    return undefined as T;
  }

  if (!res.ok) {
    let body: any = {};
    try {
      body = await res.json();
    } catch {
      // ignore parse failure on error body
    }
    const err: ApiError = {
      status: res.status,
      message: body.message || 'Request failed',
      fieldErrors: body.fieldErrors,
    };

    if (res.status === 401 && !isAuthCall) {
      clearToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    throw new ApiRequestError(err);
  }

  return res.json();
}

export const api = {
  login: (email: string, password: string) =>
    request<{ access_token: string; user: any }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) },
      true
    ),
  register: (name: string, email: string, password: string) =>
    request<{ access_token: string; user: any }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify({ full_name: name, email, password }) },
      true
    ),
  me: () => request<any>('/auth/me'),
  getUsers: () => request<any[]>('/users'),
  setUserRole: (id: number, role: string) =>
    request<any>(`/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
  updateMe: (full_name: string) =>
    request<any>('/users/me', { method: 'PATCH', body: JSON.stringify({ full_name }) }),
  changePassword: (current_password: string, new_password: string) =>
    request<{ message: string }>('/users/me/password', {
      method: 'POST',
      body: JSON.stringify({ current_password, new_password }),
    }),
  getActivity: (limit = 50) => request<any[]>(`/activity?limit=${limit}`),
  getStaff: () => request<any[]>('/staff'),
  getRating: (id: string) => request<any>(`/tickets/${id}/rating`),
  rateTicket: (id: string, stars: number, comment?: string) =>
    request<any>(`/tickets/${id}/rating`, {
      method: 'POST',
      body: JSON.stringify({ stars, comment }),
    }),
  getRatingSummary: () => request<{ average: number; count: number }>('/ratings/summary'),
  suggestReply: (id: string) =>
    request<{ draft: string }>(`/tickets/${id}/suggest-reply`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),
  forgotPassword: (email: string) =>
    request<{ message: string }>(
      '/auth/forgot-password',
      { method: 'POST', body: JSON.stringify({ email }) },
      true
    ),
  resetPassword: (token: string, password: string) =>
    request<{ message: string }>(
      '/auth/reset-password',
      { method: 'POST', body: JSON.stringify({ token, password }) },
      true
    ),

  getTickets: (query: string) => request<any>(`/tickets?${query}`),
  getTicket: (id: string) => request<any>(`/tickets/${id}`),
  createTicket: (data: any) =>
    request<any>('/tickets', { method: 'POST', body: JSON.stringify(data) }),
  updateTicket: (id: string, data: any) =>
    request<any>(`/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTicket: (id: string) =>
    request<void>(`/tickets/${id}`, { method: 'DELETE' }),

  assignTicket: (id: string, assigneeId: number) =>
    request<any>(`/tickets/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ assigneeId }),
    }),
  changeStatus: (id: string, status: string, note?: string) =>
    request<any>(`/tickets/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, note }),
    }),

  getComments: (id: string) => request<any[]>(`/tickets/${id}/comments`),
  addComment: (id: string, body: string, internal: boolean) =>
    request<any>(`/tickets/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body, isInternal: internal }),
    }),

  getEvents: (id: string) => request<any[]>(`/tickets/${id}/events`),

  getNotifications: (limit = 20) =>
    request<{ unread: number; items: any[] }>(`/notifications?limit=${limit}`),
  markNotificationRead: (id: number) =>
    request<any>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () =>
    request<{ updated: number }>('/notifications/read-all', { method: 'PATCH' }),

  getCategories: () => request<Category[]>('/categories'),
  createCategory: (name: string) =>
    request<Category>('/categories', { method: 'POST', body: JSON.stringify({ name }) }),
  deleteCategory: (id: number) =>
    request<void>(`/categories/${id}`, { method: 'DELETE' }),

  // query: q, tag, categoryId, limit — built by the caller as a query string
  searchArticles: (query: string) => request<ArticleSummary[]>(`/kb/articles?${query}`),
  getArticle: (id: string) => request<Article>(`/kb/articles/${id}`),
  getArticleTags: () => request<{ tag: string; count: number }[]>('/kb/tags'),
  createArticle: (data: ArticleInput) =>
    request<Article>('/kb/articles', { method: 'POST', body: JSON.stringify(data) }),
  updateArticle: (id: string, data: Partial<ArticleInput>) =>
    request<Article>(`/kb/articles/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteArticle: (id: string) =>
    request<void>(`/kb/articles/${id}`, { method: 'DELETE' }),
  // source 'ticket_form' = clicked on a suggestion while filing a ticket
  articleFeedback: (id: number | string, helpful: boolean, source: 'article' | 'ticket_form' = 'article') =>
    request<{ helpful: boolean }>(`/kb/articles/${id}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ helpful, source }),
    }),
  getKbInsights: () => request<KbInsights>('/kb/insights'),
  draftArticleFromTicket: (id: string) =>
    request<{ title: string; body: string; tags: string[] }>(`/tickets/${id}/draft-article`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),

  similarTickets: (q: string) =>
    request<SimilarTickets>(`/tickets/similar?${new URLSearchParams({ q })}`),
  linkTicket: (id: string, knownIssueId: number) =>
    request<{ id: number; known_issue_id: number | null }>(`/tickets/${id}/link`, {
      method: 'POST',
      body: JSON.stringify({ knownIssueId }),
    }),
  unlinkTicket: (id: string) =>
    request<{ id: number; known_issue_id: number | null }>(`/tickets/${id}/link`, { method: 'DELETE' }),
  getLinkedTickets: (id: string) =>
    request<{ id: number; subject: string; status: TicketStatus }[]>(`/tickets/${id}/linked`),

  getTags: () => request<any[]>('/tags'),
  createTag: (name: string) =>
    request<any>('/tags', { method: 'POST', body: JSON.stringify({ name }) }),
  addTagToTicket: (id: string, tagId: string) =>
    request<any>(`/tickets/${id}/tags`, {
      method: 'POST',
      body: JSON.stringify({ tagId: Number(tagId) }),
    }),
  removeTagFromTicket: (id: string, tagId: string) =>
    request<void>(`/tickets/${id}/tags/${tagId}`, { method: 'DELETE' }),

  // Updated Canned Replies endpoints to handle component parameters correctly
  getCannedReplies: () => 
    request<any[]>('/canned-replies'),
    
  createCannedReply: (...args: any[]) => {
    // Packages multiple function arguments into a single request body structure
    const body = args.length === 2 ? { title: args[0], content: args[1] } : args[0];
    return request<any>('/canned-replies', { 
      method: 'POST', 
      body: JSON.stringify(body) 
    });
  },
    
  deleteCannedReply: (id: string | number) =>
    request<void>(`/canned-replies/${id}`, { 
      method: 'DELETE' 
    }),
};

export { ApiRequestError };
