export type Role = 'customer' | 'agent' | 'admin';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Ticket {
  id: string;
  subject: string;
  body: string;
  status: TicketStatus;
  priority: Priority;
  requesterId: string;
  assigneeId: string | null;
  dueDate: string | null;
  tags: { id: string; name: string }[];
  createdAt: string;
}

export interface Comment {
  id: string;
  body: string;
  authorId: string;
  authorName: string;
  internal: boolean;
  createdAt: string;
}

export interface TicketEvent {
  id: string;
  type: string;
  createdAt: string;
  description: string;
}

export interface Envelope<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface ApiError {
  status: number;
  message: string;
  fieldErrors?: Record<string, string>;
}