'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { api, ApiRequestError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { permissions } from '@/lib/permissions';
import StatusControl from '@/components/StatusControl';
import type { TicketStatus } from '@/lib/transitions';

type State =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error'; message: string }
  | { status: 'ready'; ticket: any };

export default function TicketDetailPage() {
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

  if (state.status === 'loading') return <p>Loading…</p>;
  if (state.status === 'not-found') return <p>Ticket not found.</p>;
  if (state.status === 'error') return <p className="text-red-600">{state.message}</p>;

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
    <div>
      <div className="flex justify-between items-start">
        <h1 className="text-xl font-bold">{ticket.subject}</h1>
        {role && permissions.canDeleteTicket(role) && (
          <button onClick={handleDelete} className="text-red-600 text-sm border px-2 py-1">
            Delete ticket
          </button>
        )}
      </div>
      {isOverdue && <span className="text-red-600 text-sm">Overdue</span>}
      <p className="mt-2">{ticket.body}</p>
      <div className="text-sm text-gray-500 mt-2">
        {ticket.status} · {ticket.priority} · due {dueAt ?? '—'} · assignee:{' '}
        {ticket.assignee ? ticket.assignee.full_name : 'unassigned'}
      </div>

            <div className="mt-2 flex flex-wrap gap-1">
        {(ticket.ticketTags || []).map((tt: any) => (
          <span key={tt.tag.id} className="border px-2 py-0.5 text-xs flex items-center gap-1">
            {tt.tag.name}
            {role && permissions.canManageTags(role) && (
              <button onClick={() => handleRemoveTag(tt.tag.id)} className="text-red-600">
                ×
              </button>
            )}
          </span>
        ))}
      </div>
      {actionError && <p className="text-red-600 text-sm mt-2">{actionError}</p>}

      {role && permissions.canCreateTag(role) && (
        <div className="mt-3 flex gap-2 items-center">
          <input
            className="border p-1 text-sm"
            placeholder="New tag name"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
          />
          <button onClick={handleCreateTag} className="border px-2 py-1 text-sm">
            Create tag
          </button>
        </div>
      )}

      {role && permissions.canManageTags(role) && (
        <div className="mt-3 flex gap-2 items-center">
          <select
            className="border p-1 text-sm"
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
          <button onClick={handleAddTag} className="border px-2 py-1 text-sm">
            Add tag
          </button>
        </div>
      )}

      {role && permissions.canAssign(role) && (
        <div className="mt-3">
          <div className="text-sm font-medium mb-1">Assign to (user ID)</div>
          {assignError && <p className="text-red-600 text-sm">{assignError}</p>}
          <div className="flex gap-2">
            <input
              className="border p-1 text-sm w-24"
              placeholder="e.g. 3"
              value={assigneeIdInput}
              onChange={(e) => setAssigneeIdInput(e.target.value)}
            />
            <button onClick={handleAssign} className="border px-2 py-1 text-sm">
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

      <h2 className="font-bold mt-6">Comments</h2>
      <ul className="space-y-2">
        {comments.map((c) => (
          <li key={c.id} className="border p-2">
            <div className="text-sm text-gray-500">
              Author #{c.author_id} · {c.created_at} {c.is_internal && <b>(internal)</b>}
            </div>
            <p>{c.body}</p>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAddComment} className="mt-3 flex flex-col gap-2 max-w-lg">
        {commentError && <p className="text-red-600 text-sm">{commentError}</p>}
        <textarea
          className="border p-2"
          placeholder="Write a comment…"
          value={commentBody}
          onChange={(e) => setCommentBody(e.target.value)}
        />
        {role && permissions.canWriteInternalComment(role) && (
          <label className="flex items-center gap-1 text-sm">
            <input
              type="checkbox"
              checked={commentInternal}
              onChange={(e) => setCommentInternal(e.target.checked)}
            />
            Internal (agents/admins only)
          </label>
        )}
        <button className="border px-3 py-1 self-start" type="submit">
          Post comment
        </button>
      </form>

      <h2 className="font-bold mt-6">History</h2>
      <ul className="text-sm text-gray-600 space-y-1">
        {[...events].reverse().map((e) => (
          <li key={e.id}>
            {e.from_status} → {e.to_status} {e.note ? `(${e.note})` : ''} · {e.created_at}
          </li>
        ))}
      </ul>
    </div>
  );
}