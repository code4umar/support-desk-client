'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, ApiRequestError } from '@/lib/api';
import type { Ticket, Comment, TicketEvent } from '@/types';

type State =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error'; message: string }
  | { status: 'ready'; ticket: Ticket };

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [comments, setComments] = useState<Comment[]>([]);
  const [events, setEvents] = useState<TicketEvent[]>([]);

  useEffect(() => {
    api
      .getTicket(id)
      .then((ticket) => setState({ status: 'ready', ticket }))
      .catch((err) => {
        if (err instanceof ApiRequestError && err.status === 404) {
          setState({ status: 'not-found' });
        } else if (err instanceof ApiRequestError && err.status === 403) {
          setState({ status: 'error', message: 'This ticket is not yours to view.' });
        } else {
          setState({ status: 'error', message: 'Failed to load ticket.' });
        }
      });
    api.getComments(id).then(setComments).catch(() => {});
    api.getEvents(id).then(setEvents).catch(() => {});
  }, [id]);

  if (state.status === 'loading') return <p>Loading…</p>;
  if (state.status === 'not-found') return <p>Ticket not found.</p>;
  if (state.status === 'error') return <p className="text-red-600">{state.message}</p>;

  const { ticket } = state;
  const isOverdue =
    ticket.dueDate && new Date(ticket.dueDate) < new Date() && ticket.status !== 'closed';

  return (
    <div>
      <h1 className="text-xl font-bold">{ticket.subject}</h1>
      {isOverdue && <span className="text-red-600 text-sm">Overdue</span>}
      <p className="mt-2">{ticket.body}</p>
      <div className="text-sm text-gray-500 mt-2">
        {ticket.status} · {ticket.priority} · due {ticket.dueDate ?? '—'}
      </div>
      <div className="mt-2">
        {ticket.tags.map((t) => (
          <span key={t.id} className="border px-2 py-0.5 text-xs mr-1">
            {t.name}
          </span>
        ))}
      </div>

      <h2 className="font-bold mt-6">Comments</h2>
      <ul className="space-y-2">
        {comments.map((c) => (
          <li key={c.id} className="border p-2">
            <div className="text-sm text-gray-500">
              {c.authorName} · {c.createdAt} {c.internal && <b>(internal)</b>}
            </div>
            <p>{c.body}</p>
          </li>
        ))}
      </ul>

      <h2 className="font-bold mt-6">History</h2>
      <ul className="text-sm text-gray-600 space-y-1">
        {[...events].reverse().map((e) => (
          <li key={e.id}>{e.description}</li>
        ))}
      </ul>
    </div>
  );
}