import { getToken, clearToken } from './session';
import type { ApiError } from '@/types';

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

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

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
    request<{ token: string; user: any }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) },
      true
    ),
  register: (name: string, email: string, password: string) =>
    request<{ token: string; user: any }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify({ full_name: name, email, password }) },
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

  assignTicket: (id: string, assigneeId: string) =>
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
      body: JSON.stringify({ body, internal }),
    }),

  getEvents: (id: string) => request<any[]>(`/tickets/${id}/events`),

  getTags: () => request<any[]>('/tags'),
  createTag: (name: string) =>
    request<any>('/tags', { method: 'POST', body: JSON.stringify({ name }) }),
  addTagToTicket: (id: string, tagId: string) =>
    request<any>(`/tickets/${id}/tags`, {
      method: 'POST',
      body: JSON.stringify({ tagId }),
    }),
  removeTagFromTicket: (id: string, tagId: string) =>
    request<void>(`/tickets/${id}/tags/${tagId}`, { method: 'DELETE' }),
};

export { ApiRequestError };