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

export interface Category {
  id: number;
  name: string;
  ticket_count: number;
  article_count: number;
}

export interface ArticleSummary {
  id: number;
  title: string;
  excerpt: string;
  tags: string[];
  category_id: number | null;
  category_name: string | null;
  published: boolean;
  updated_at: string;
}

export interface Article extends Omit<ArticleSummary, 'excerpt'> {
  body: string;
  author_id: number | null;
  author_name: string | null;
  created_at: string;
}

export interface ArticleInput {
  title: string;
  body: string;
  tags: string[];
  categoryId: number | null;
  published: boolean;
}

export interface KbInsights {
  deflected_7d: number;
  votes_30d: number;
  helpful_rate_30d: number | null;
  needs_work: { id: number; title: string; helpful: number; unhelpful: number }[];
}

export interface SimilarTickets {
  count: number;
  items?: { id: number; subject: string; status: TicketStatus; known_issue_id: number | null }[];
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