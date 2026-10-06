'use client';
import { useToast } from '@/components/Toast';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { api, ApiRequestError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { permissions } from '@/lib/permissions';
import { timeAgo, slaInfo, initials } from '@/lib/time';
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
  const { show } = useToast();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [minTimeDone, setMinTimeDone] = useState(false);
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
  const [editMode, setEditMode] = useState(false);
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

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
    const timer = setTimeout(() => setMinTimeDone(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    loadAll();
    api.getTags().then(setAllTags).catch(() => {});
  }, [id]);

    if (state.status === 'loading' || !minTimeDone)
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="relative flex w-full max-w-md flex-col items-center gap-4 overflow-hidden rounded-2xl border border-white/10 bg-[#0e151d]/95 px-8 py-12 text-center shadow-2xl shadow-black/50 backdrop-blur-sm">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#e58a3c]/20 blur-3xl" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#f5b942] to-[#e58a3c]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#101820]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="relative text-lg font-semibold text-white">Welcome to your ticket</p>
          <p className="relative text-sm text-[#8b95a1]">Pulling up the details…</p>
        </div>
      </div>
    );
  if (state.status === 'not-found')
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
        <p className="text-lg font-semibold text-white">Ticket not found</p>
        <p className="text-sm text-[#8b95a1]">It may have been deleted or you don&apos;t have access.</p>
      </div>
    );
  if (state.status === 'error')
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
        <p className="text-lg font-semibold text-red-400">{state.message}</p>
      </div>
    );

  const { ticket } = state;
  const dueAt = ticket.due_at;
  const sla = slaInfo(dueAt, ticket.status);
  const role = user?.role;

  // author id -> naam (sirf requester/assignee ke naam maloom hain)
  const people: Record<number, string> = {};
  if (ticket.requester) people[ticket.requester.id ?? ticket.requester_id] = ticket.requester.full_name;
  if (ticket.assignee) people[ticket.assignee.id ?? ticket.assignee_id] = ticket.assignee.full_name;

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
      show('Ticket assigned');
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
      show('Tag added');
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
      show('Comment posted');
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

  function startEdit() {
    setEditSubject(ticket.subject);
    setEditBody(ticket.body);
    setEditError('');
    setEditMode(true);
  }

  async function saveEdit() {
    if (!editSubject.trim() || !editBody.trim()) {
      setEditError('Subject and description are required.');
      return;
    }
    setEditSaving(true);
    setEditError('');
    try {
      await api.updateTicket(id, { subject: editSubject.trim(), body: editBody.trim() });
      setEditMode(false);
      show('Ticket updated');
      loadAll();
    } catch (err) {
      setEditError(err instanceof ApiRequestError ? err.message : 'Could not save changes.');
    } finally {
      setEditSaving(false);
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
              {sla && (
                <span className={`text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full border ${sla.cls}`}>
                  {sla.label}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {role && permissions.canEditTicket(role, ticket.requester_id === user?.id) && !editMode && (
              <button
                onClick={startEdit}
                className="text-teal-400 text-sm border border-teal-500/30 rounded-md px-3 py-1.5 hover:bg-teal-500/10 transition-colors"
              >
                Edit
              </button>
            )}
            {role && permissions.canDeleteTicket(role) && (
              <button
                onClick={handleDelete}
                className="text-red-400 text-sm border border-red-500/30 rounded-md px-3 py-1.5 hover:bg-red-500/10 transition-colors"
              >
                Delete ticket
              </button>
            )}
          </div>
        </div>

        {editMode ? (
          <div className="mt-4 flex flex-col gap-2">
            {editError && (
              <p className="text-red-500 text-sm bg-red-500/10 border border-red-500/20 rounded-md py-1.5 px-3">
                {editError}
              </p>
            )}
            <input
              className={inputClass}
              value={editSubject}
              onChange={(e) => setEditSubject(e.target.value)}
              placeholder="Subject"
            />
            <textarea
              className={`${inputClass} resize-none`}
              rows={4}
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              placeholder="Description"
            />
            <div className="flex gap-2">
              <button
                onClick={saveEdit}
                disabled={editSaving}
                className="bg-teal-500 text-black font-semibold rounded-md px-4 py-2 text-sm transition-all hover:bg-teal-400 disabled:opacity-50"
              >
                {editSaving ? 'Saving…' : 'Save changes'}
              </button>
              <button
                onClick={() => setEditMode(false)}
                className="text-sm text-zinc-400 hover:text-white px-4 py-2 rounded-md hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-zinc-200 whitespace-pre-wrap">{ticket.body}</p>
        )}

        <div className="text-sm text-zinc-500 mt-4 pt-4 border-t border-white/10">
          Due {dueAt ? new Date(dueAt).toLocaleString() : '—'} · Requester:{' '}
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
            onChanged={() => {
              loadAll();
              show('Status updated');
            }}
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
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-500/20 text-[10px] font-bold text-teal-300">
                  {initials(people[c.author_id])}
                </span>
                <span className="text-zinc-300">{people[c.author_id] ?? `User #${c.author_id}`}</span>
                <span>·</span>
                <span title={c.created_at}>{timeAgo(c.created_at)}</span>
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
                {sentence} <span className="text-zinc-600">· {timeAgo(e.created_at)}</span>
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