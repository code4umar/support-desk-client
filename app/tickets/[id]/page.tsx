'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { api, ApiRequestError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { permissions } from '@/lib/permissions';
import StatusControl from '@/components/StatusControl';
import RequireAuth from '@/components/RequireAuth';
import type { TicketStatus } from '@/lib/transitions';

type State =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error'; message: string }
  | { status: 'ready'; ticket: any };

const priorityStyles: Record<string, string> = {
  low: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
  normal: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
  high: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  urgent: 'bg-red-500/10 text-red-400 border-red-500/30',
};

const statusStyles: Record<string, string> = {
  open: 'text-teal-400',
  in_progress: 'text-amber-400',
  resolved: 'text-green-400',
  closed: 'text-zinc-500',
};

const inputClass =
  'border border-white/20 bg-transparent rounded-md p-2 text-sm outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 transition-colors';

function TicketDetailInner() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [comments, setComments] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [allTags, setAllTags] = useState<any[]>([]);
  const [selectedTagId, setSelectedTagId] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [assigneeIdInput, setAssigneeIdInput] = useState('');
  const [assignError, setAssignError] = useState('');
  const [commentBody, setCommentBody] = useState('');
  const [commentInternal, setCommentInternal] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [actionError, setActionError] = useState('');

  function loadAll() {
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
  }

  useEffect(() => {
    loadAll();
    api.getTags().then(setAllTags).catch(() => {});
  }, [id]);

  if (state.status === 'loading')
    return <p className="text-zinc-400 text-center py-8">Loading…</p>;
  if (state.status === 'not-found')
    return <p className="text-zinc-400 text-center py-8">Ticket not found.</p>;
  if (state.status === 'error')
    return <p className="text-red-500 text-center py-8">{state.message}</p>;

  const { ticket } = state;
  const dueAt = ticket.due_at;
  const isOverdue = dueAt && new Date(dueAt) < new Date() && ticket.status !== 'closed';
  const role = user?.role;

  async function handleAssign() {
    setAssignError('');
    const parsed = Number(assigneeIdInput);
    if (!assigneeIdInput || Number.isNaN(parsed)) {
      setAssignError('Enter a numeric user ID.');
      return;
    }
    try {
      await api.assignTicket(id, parsed);
      setAssigneeIdInput('');
      loadAll();
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 422) {
        setAssignError('That user is not an agent or admin.');
      } else if (err instanceof ApiRequestError && err.status === 404) {
        setAssignError('User not found.');
      } else {
        setAssignError('Could not assign ticket.');
      }
    }
  }

  async function handleCreateTag() {
    if (!newTagName.trim()) return;
    try {
      await api.createTag(newTagName.trim());
      setNewTagName('');
      const fresh = await api.getTags();
      setAllTags(fresh);
    } catch {
      setActionError('Could not create tag (maybe it already exists).');
    }
  }

  async function handleAddTag() {
    if (!selectedTagId) return;
    try {
      await api.addTagToTicket(id, selectedTagId);
      setSelectedTagId('');
      loadAll();
    } catch {
      setActionError('Could not add tag.');
    }
  }

  async function handleRemoveTag(tagId: string) {
    try {
      await api.removeTagFromTicket(id, tagId);
      loadAll();
    } catch {
      setActionError('Could not remove tag.');
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    setCommentError('');
    if (!commentBody.trim()) return;
    try {
      await api.addComment(id, commentBody, commentInternal);
      setCommentBody('');
      setCommentInternal(false);
      const fresh = await api.getComments(id);
      setComments(fresh);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 403) {
        setCommentError('You cannot post an internal comment.');
      } else {
        setCommentError('Could not add comment.');
      }
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this ticket? This cannot be undone.')) return;
    try {
      await api.deleteTicket(id);
      router.push('/tickets');
    } catch {
      setActionError('Could not delete ticket.');
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="rounded-xl border border-white/10 bg-black/30 backdrop-blur p-6">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold">{ticket.subject}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`text-sm capitalize ${statusStyles[ticket.status] ?? 'text-zinc-400'}`}>
                {ticket.status.replace('_', ' ')}
              </span>
              <span className="text-zinc-600">·</span>
              <span
                className={`text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full border capitalize ${
                  priorityStyles[ticket.priority] ?? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30'
                }`}
              >
                {ticket.priority}
              </span>
              {isOverdue && (
                <span className="text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
                  Overdue
                </span>
              )}
            </div>
          </div>
          {role && permissions.canDeleteTicket(role) && (
            <button
              onClick={handleDelete}
              className="text-red-400 text-sm border border-red-500/30 rounded-md px-3 py-1.5 hover:bg-red-500/10 transition-colors shrink-0"
            >
              Delete ticket
            </button>
          )}
        </div>

        <p className="mt-4 text-zinc-200 whitespace-pre-wrap">{ticket.body}</p>

        <div className="text-sm text-zinc-500 mt-4 pt-4 border-t border-white/10">
          Due {dueAt ?? '—'} · Requester:{' '}
          {ticket.requester ? ticket.requester.full_name : `#${ticket.requester_id}`} · Assignee:{' '}
          {ticket.assignee ? ticket.assignee.full_name : 'unassigned'}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {(ticket.ticketTags || []).map((tt: any) => (
            <span
              key={tt.tag.id}
              className="border border-teal-500/30 bg-teal-500/10 text-teal-400 rounded-full px-3 py-1 text-xs flex items-center gap-1.5"
            >
              {tt.tag.name}
              {role && permissions.canManageTags(role) && (
                <button
                  onClick={() => handleRemoveTag(tt.tag.id)}
                  className="text-teal-300 hover:text-red-400 transition-colors"
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
        {actionError && (
          <p className="text-red-500 text-sm mt-3 bg-red-500/10 border border-red-500/20 rounded-md py-1.5 px-3">
            {actionError}
          </p>
        )}

        {role && permissions.canCreateTag(role) && (
          <div className="mt-4 flex gap-2 items-center">
            <input
              className={`${inputClass} flex-1`}
              placeholder="New tag name"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
            />
            <button
              onClick={handleCreateTag}
              className="border border-white/20 rounded-md px-3 py-2 text-sm hover:border-teal-400 transition-colors"
            >
              Create tag
            </button>
          </div>
        )}

        {role && permissions.canManageTags(role) && (
          <div className="mt-3 flex gap-2 items-center">
            <select
              className={`${inputClass} flex-1`}
              value={selectedTagId}
              onChange={(e) => setSelectedTagId(e.target.value)}
            >
              <option value="">Add a tag…</option>
              {allTags.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddTag}
              className="border border-white/20 rounded-md px-3 py-2 text-sm hover:border-teal-400 transition-colors"
            >
              Add tag
            </button>
          </div>
        )}

        {role && permissions.canAssign(role) && (
          <div className="mt-4 border-t border-white/10 pt-4">
            <div className="text-xs font-semibold tracking-wide text-zinc-400 mb-2">
              Assign to (user ID)
            </div>
            {assignError && (
              <p className="text-red-500 text-sm bg-red-500/10 border border-red-500/20 rounded-md py-1.5 px-3 mb-2">
                {assignError}
              </p>
            )}
            <div className="flex gap-2">
              <input
                className={`${inputClass} w-24`}
                placeholder="e.g. 3"
                value={assigneeIdInput}
                onChange={(e) => setAssigneeIdInput(e.target.value)}
              />
              <button
                onClick={handleAssign}
                className="border border-white/20 rounded-md px-3 py-2 text-sm hover:border-teal-400 transition-colors"
              >
                Assign
              </button>
            </div>
          </div>
        )}

        {role && permissions.canChangeStatus(role) && (
          <StatusControl
            ticketId={id}
            currentStatus={ticket.status as TicketStatus}
            onChanged={() => loadAll()}
          />
        )}
      </div>

      <div className="rounded-xl border border-white/10 bg-black/30 backdrop-blur p-6 mt-6">
        <h2 className="text-lg font-bold mb-3">Comments</h2>
        <ul className="flex flex-col gap-3">
          {comments.map((c) => (
            <li
              key={c.id}
              className={`rounded-lg border p-3 ${
                c.is_internal
                  ? 'border-amber-500/30 bg-amber-500/5'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              <div className="text-xs text-zinc-500 flex items-center gap-2">
                <span>Author #{c.author_id}</span>
                <span>·</span>
                <span>{c.created_at}</span>
                {c.is_internal && (
                  <span className="text-amber-400 font-semibold uppercase tracking-wide">
                    Internal
                  </span>
                )}
              </div>
              <p className="text-sm text-zinc-200 mt-1">{c.body}</p>
            </li>
          ))}
        </ul>

        <form onSubmit={handleAddComment} className="mt-4 flex flex-col gap-2">
          {commentError && (
            <p className="text-red-500 text-sm bg-red-500/10 border border-red-500/20 rounded-md py-1.5 px-3">
              {commentError}
            </p>
          )}
          <textarea
            className={`${inputClass} resize-none`}
            rows={3}
            placeholder="Write a comment…"
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
          />
          {role && permissions.canWriteInternalComment(role) && (
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                className="accent-teal-500 h-4 w-4"
                checked={commentInternal}
                onChange={(e) => setCommentInternal(e.target.checked)}
              />
              Internal (agents/admins only)
            </label>
          )}
          <button
            className="bg-teal-500 text-black font-semibold rounded-md px-4 py-2 text-sm self-start transition-all hover:bg-teal-400 hover:scale-[1.02] active:scale-[0.98]"
            type="submit"
          >
            Post comment
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/30 backdrop-blur p-6 mt-6">
        <h2 className="text-lg font-bold mb-3">History</h2>
        <ul className="flex flex-col gap-2">
          {[...events].reverse().map((e) => {
            const sentence = e.from_status
              ? `Status changed from ${e.from_status} to ${e.to_status}${e.note ? ` — ${e.note}` : ''}`
              : e.note || 'Ticket updated';
            return (
              <li key={e.id} className="text-sm text-zinc-400 border-l-2 border-teal-500/30 pl-3">
                {sentence} <span className="text-zinc-600">· {e.created_at}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default function TicketDetailPage() {
  return (
    <RequireAuth>
      <TicketDetailInner />
    </RequireAuth>
  );
}