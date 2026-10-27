import { getToken } from './session';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export type Attachment = {
  id: number;
  ticket_id: number;
  filename: string;
  mime_type: string;
  size: number;
  uploaded_by: number | null;
  uploader_name: string | null;
  created_at: string;
};

export const MAX_FILE_BYTES = 2 * 1024 * 1024;
export const ACCEPT = 'image/png,image/jpeg,image/gif,image/webp,application/pdf,text/plain,text/csv,.csv,.txt';
const ALLOWED = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'text/csv']);

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10 * 1024 ? 1 : 0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

// quick check in the browser, so people get an instant message (the server checks everything again)
export function validateFile(file: File): string | null {
  if (file.size === 0) return 'That file is empty';
  if (file.size > MAX_FILE_BYTES) return `${file.name} is larger than 2 MB`;
  const type = file.type || (/\.csv$/i.test(file.name) ? 'text/csv' : /\.txt$/i.test(file.name) ? 'text/plain' : '');
  const okType = ALLOWED.has(type) || (/\.csv$/i.test(file.name) && type === 'application/vnd.ms-excel');
  return okType ? null : 'Only images (PNG, JPG, GIF, WebP), PDF, TXT and CSV files can be attached';
}

// A small fetch wrapper: sends the sign-in token, and turns API errors into readable messages.
async function authed(path: string, init: RequestInit = {}) {
  if (!BASE_URL) throw new Error('API URL not configured');
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { ...(init.headers as Record<string, string>), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    cache: 'no-store',
  });
  if (!res.ok) {
    let message = res.status === 413 ? 'The file is larger than 2 MB' : 'Something went wrong';
    try {
      const body = await res.json();
      message = Array.isArray(body.message) ? body.message.join(', ') : body.message ?? message;
    } catch {
      /* keep the default */
    }
    throw new Error(message);
  }
  return res;
}

export const listAttachments = async (ticketId: number): Promise<Attachment[]> =>
  (await authed(`/tickets/${ticketId}/attachments`)).json();

export const uploadAttachment = async (ticketId: number, file: File): Promise<Attachment> => {
  const form = new FormData();
  form.append('file', file);
  return (await authed(`/tickets/${ticketId}/attachments`, { method: 'POST', body: form })).json();
};

export const fetchAttachmentBlob = async (id: number): Promise<Blob> => (await authed(`/attachments/${id}/download`)).blob();

export const deleteAttachment = async (id: number): Promise<void> => {
  await authed(`/attachments/${id}`, { method: 'DELETE' });
};
