'use client';
import { useToast } from '@/components/Toast';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { api, ApiRequestError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { permissions } from '@/lib/permissions';
import { timeAgo, initials } from '@/lib/time';
import StatusControl from '@/components/StatusControl';
import RequireAuth from '@/components/RequireAuth';
import type { TicketStatus } from '@/lib/transitions';
import RatingStars from '@/components/RatingStars';
import StaffSelect from '@/components/StaffSelect';
import SuggestReply from '@/components/SuggestReply';
import CannedReplies from '@/components/CannedReplies';
import AttachmentsPanel from '@/components/AttachmentsPanel';
import SlaCountdown from '@/components/SlaCountdown';
import MentionText from '@/components/MentionText';
import MentionPicker from '@/components/MentionPicker';
import type { Category } from '@/types';
import KnownIssuePanel from '@/components/KnownIssuePanel';
import DraftArticleButton from '@/components/DraftArticleButton';
import ViewTabs from '@/components/ViewTabs';

type DetailTab = 'conversation' | 'details' | 'files' | 'history';

type State =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error'; message: string }
  | { status: 'ready'; ticket: any };

const priorityStyles: Record<string, string> = {
  low: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30',
  normal: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
  high: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
  urgent: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
};

const statusStyles: Record<string, string> = {
  open: 'text-brand-dark',
  in_progress: 'text-amber-700 dark:text-amber-400',
  resolved: 'text-green-700 dark:text-green-400',
  closed: 'text-muted',
};

const inputClass =
  'border border-line bg-transparent rounded-md p-2 text-sm outline-none focus:border-brand-dark focus:ring-1 focus:ring-brand/50 transition-colors';

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
  const [categories, setCategories] = useState<Category[]>([]);
  const [tab, setTab] = useState<DetailTab>('conversation');

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
    api.getCategories().then(setCategories).catch(() => {});
  }, [id]);

  if (state.status === 'loading' || !minTimeDone)
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4 md:h-full md:min-h-0">
        <div className="relative flex w-full max-w-md flex-col items-center gap-4 overflow-hidden rounded-2xl border border-line bg-surface/95 px-8 py-12 text-center shadow-2xl shadow-navy/20 backdrop-blur-sm">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand/30 blur-3xl" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-dark">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-on-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="relative text-lg font-semibold text-navy">Welcome to your ticket</p>
          <p className="relative text-sm text-muted">Pulling up the details…</p>
        </div>
      </div>
    );
  if (state.status === 'not-found')
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
        <p className="text-lg font-semibold text-navy">Ticket not found</p>
        <p className="text-sm text-muted">It may have been deleted or you don&apos;t have access.</p>
      </div>
    );
  if (state.status === 'error')
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
        <p className="text-lg font-semibold text-red-600 dark:text-red-400">{state.message}</p>
      </div>
    );

  const { ticket } = state;
  const dueAt = ticket.due_at;
  const role = user?.role;

  // author id -> name (fallback for comments that carry no author_name)
  const people: Record<number, string> = {};
  if (ticket.requester) people[ticket.requester.id ?? ticket.requester_id] = ticket.requester.full_name;
  if (ticket.assignee) people[ticket.assignee.id ?? ticket.assignee_id] = ticket.assignee.full_name;

  async function handleAssign() {
    setAssignError('');
    const parsed = Number(assigneeIdInput);
    if (!assigneeIdInput || Number.isNaN(parsed)) {
      setAssignError('Pick someone to assign this ticket to.');
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

  async function handleAssignToMe() {
    if (!user) return;
    setAssignError('');
    try {
      await api.assignTicket(id, Number(user.id));
      show('Assigned to you');
      loadAll();
    } catch {
      setAssignError('Could not assign ticket.');
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

  async function changeCategory(value: string) {
    try {
      await api.updateTicket(id, { categoryId: value ? Number(value) : null });
      show('Category updated');
      loadAll();
    } catch (err) {
      setActionError(err instanceof ApiRequestError ? err.message : 'Could not change category.');
    }
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

  const isStaff = !!role && permissions.canAssign(role);
  const tabs: { id: DetailTab; label: string; badge?: number }[] = [
    { id: 'conversation', label: 'Conversation', badge: comments.length },
    { id: 'details', label: 'Details' },
    { id: 'files', label: 'Files' },
    { id: 'history', label: 'History', badge: events.length },
  ];

  // One screen: header on top, a tabbed main panel, and the controls beside it.
  // Only a long conversation scrolls, inside its own panel.
  return (
    <div className="flex flex-col gap-4 md:h-full md:min-h-0">
      <div className="rounded-xl border border-line bg-surface p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold" title={ticket.subject}>
              {ticket.subject} <span className="font-normal text-muted">#{ticket.id}</span>
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`text-sm capitalize ${statusStyles[ticket.status] ?? 'text-muted'}`}>
                {ticket.status.replace('_', ' ')}
              </span>
              <span className="text-muted">·</span>
              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide capitalize ${
                  priorityStyles[ticket.priority] ?? 'bg-navy/5 text-muted border-navy/20'
                }`}
              >
                {ticket.priority}
              </span>
              <SlaCountdown dueAt={dueAt} status={ticket.status} />
              {role && permissions.canEditTicket(role, ticket.requester_id === user?.id) && categories.length > 0 ? (
                <select
                  aria-label="ticket category"
                  className="rounded-full border border-line bg-surface px-2.5 py-1 text-xs text-navy outline-none focus:border-brand-dark"
                  value={ticket.category_id ?? ''}
                  onChange={(e) => changeCategory(e.target.value)}
                >
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              ) : (
                ticket.category_id && (
                  <span className="rounded-full border border-line px-2.5 py-1 text-xs text-muted">
                    {categories.find((c) => c.id === ticket.category_id)?.name ?? 'Categorised'}
                  </span>
                )
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {role && permissions.canWriteArticle(role) && (ticket.status === 'resolved' || ticket.status === 'closed') && (
              <DraftArticleButton ticketId={id} />
            )}
            {role && permissions.canEditTicket(role, ticket.requester_id === user?.id) && !editMode && (
              <button
                onClick={() => {
                  startEdit();
                  setTab('details');
                }}
                className="rounded-md border border-brand-dark/30 px-3 py-1.5 text-sm text-brand-dark transition-colors hover:bg-brand/15"
              >
                Edit
              </button>
            )}
            {role && permissions.canDeleteTicket(role) && (
              <button
                onClick={handleDelete}
                className="rounded-md border border-red-500/30 px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400"
              >
                Delete ticket
              </button>
            )}
          </div>
        </div>
        {actionError && (
          <p className="mt-3 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-sm text-red-500">{actionError}</p>
        )}
      </div>

      <div className="grid gap-4 md:min-h-0 md:flex-1 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5 md:min-h-0">
          <ViewTabs label="Ticket sections" tabs={tabs} value={tab} onChange={setTab} />

          {tab === 'conversation' && (
            <>
              <ul className="flex flex-col gap-3 md:min-h-0 md:flex-1 md:overflow-y-auto md:pr-1">
                {comments.length === 0 && <li className="py-6 text-center text-sm text-muted">No comments yet. Start the conversation below.</li>}
                {comments.map((c) => (
                  <li
                    key={c.id}
                    className={`rounded-lg border p-3 ${c.is_internal ? 'border-amber-500/30 bg-amber-500/5' : 'border-line bg-navy/5'}`}
                  >
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand/25 text-[10px] font-bold text-brand-dark">
                        {initials(c.author_name ?? people[c.author_id])}
                      </span>
                      <span className="text-navy">{c.author_name ?? people[c.author_id] ?? `User #${c.author_id}`}</span>
                      <span>·</span>
                      <span title={c.created_at}>{timeAgo(c.created_at)}</span>
                      {c.is_internal && (
                        <span className="font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">Internal</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-navy"><MentionText body={c.body} /></p>
                  </li>
                ))}
              </ul>

              <form onSubmit={handleAddComment} className="flex shrink-0 flex-col gap-2 border-t border-line pt-3">
                {commentError && (
                  <p className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-sm text-red-500">{commentError}</p>
                )}
                <textarea
                  className={`${inputClass} resize-none`}
                  rows={2}
                  placeholder="Write a comment…"
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                />
                {role && permissions.canWriteInternalComment(role) && (
                  <MentionPicker
                    meId={user?.id}
                    onPick={(tag) => setCommentBody((prev) => (prev && !/\s$/.test(prev) ? `${prev} ${tag}` : prev + tag))}
                  />
                )}
                <div className="flex flex-wrap items-start gap-3">
                  {role && permissions.canWriteInternalComment(role) && (
                    <CannedReplies
                      currentText={commentBody}
                      onPick={(text) => setCommentBody((prev) => (prev.trim() ? `${prev}\n\n${text}` : text))}
                      vars={{
                        name: (ticket.requester?.full_name ?? 'there').split(' ')[0],
                        agent: user?.name ?? 'Support',
                      }}
                      meId={user?.id}
                      isAdmin={String(role) === 'admin'}
                    />
                  )}
                  {role && permissions.canWriteInternalComment(role) && <SuggestReply ticketId={id} onUse={setCommentBody} />}
                  {role && permissions.canWriteInternalComment(role) && (
                    <label className="flex items-center gap-2 self-center text-sm text-navy">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-brand-dark"
                        checked={commentInternal}
                        onChange={(e) => setCommentInternal(e.target.checked)}
                      />
                      Internal
                    </label>
                  )}
                  <button
                    className="ml-auto rounded-md bg-brand px-4 py-2 text-sm font-semibold text-on-brand transition-all hover:bg-brand-dark"
                    type="submit"
                  >
                    Post comment
                  </button>
                </div>
              </form>
            </>
          )}

          {tab === 'details' && (
            <div className="flex flex-col gap-4 md:min-h-0 md:flex-1 md:overflow-y-auto">
              {editMode ? (
                <div className="flex flex-col gap-2">
                  {editError && (
                    <p className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-sm text-red-500">{editError}</p>
                  )}
                  <input className={inputClass} value={editSubject} onChange={(e) => setEditSubject(e.target.value)} placeholder="Subject" />
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
                      className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-on-brand transition-all hover:bg-brand-dark disabled:opacity-50"
                    >
                      {editSaving ? 'Saving…' : 'Save changes'}
                    </button>
                    <button
                      onClick={() => setEditMode(false)}
                      className="rounded-md px-4 py-2 text-sm text-muted transition-colors hover:bg-navy/5 hover:text-navy"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="whitespace-pre-wrap text-navy">{ticket.body}</p>
              )}

              <dl className="grid gap-3 border-t border-line pt-4 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-muted">Due</dt>
                  <dd className="text-navy">{dueAt ? new Date(dueAt).toLocaleString() : '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Requester</dt>
                  <dd className="text-navy">{ticket.requester ? ticket.requester.full_name : `#${ticket.requester_id}`}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Assignee</dt>
                  <dd className="text-navy">{ticket.assignee ? ticket.assignee.full_name : 'unassigned'}</dd>
                </div>
              </dl>

              <div>
                <h2 className="mb-2 text-xs font-semibold tracking-wide text-muted">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {(ticket.ticketTags || []).length === 0 && <span className="text-sm text-muted">No tags</span>}
                  {(ticket.ticketTags || []).map((tt: any) => (
                    <span
                      key={tt.tag.id}
                      className="flex items-center gap-1.5 rounded-full border border-brand-dark/30 bg-brand/15 px-3 py-1 text-xs text-brand-dark"
                    >
                      {tt.tag.name}
                      {role && permissions.canManageTags(role) && (
                        <button onClick={() => handleRemoveTag(tt.tag.id)} className="text-brand-dark transition-colors hover:text-red-600">
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                {role && permissions.canManageTags(role) && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <select className={`${inputClass} min-w-[160px] flex-1`} value={selectedTagId} onChange={(e) => setSelectedTagId(e.target.value)}>
                      <option value="">Add a tag…</option>
                      {allTags.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <button onClick={handleAddTag} className="rounded-md border border-line px-3 py-2 text-sm transition-colors hover:border-brand-dark">
                      Add tag
                    </button>
                    {permissions.canCreateTag(role) && (
                      <>
                        <input
                          className={`${inputClass} min-w-[140px] flex-1`}
                          placeholder="New tag name"
                          value={newTagName}
                          onChange={(e) => setNewTagName(e.target.value)}
                        />
                        <button onClick={handleCreateTag} className="rounded-md border border-line px-3 py-2 text-sm transition-colors hover:border-brand-dark">
                          Create tag
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'files' && (
            <div className="md:min-h-0 md:flex-1 md:overflow-y-auto [&>*:first-child]:mt-0 [&>*:first-child]:border-0 [&>*:first-child]:p-0">
              <AttachmentsPanel ticketId={ticket.id} meId={user?.id} isStaff={!!role && permissions.canWriteInternalComment(role)} />
            </div>
          )}

          {tab === 'history' && (
            <ul className="flex flex-col gap-2 md:min-h-0 md:flex-1 md:overflow-y-auto">
              {events.length === 0 && <li className="py-6 text-center text-sm text-muted">Nothing has happened yet.</li>}
              {[...events].reverse().map((e) => {
                const sentence = e.from_status
                  ? `Status changed from ${e.from_status} to ${e.to_status}${e.note ? ` — ${e.note}` : ''}`
                  : e.note || 'Ticket updated';
                return (
                  <li key={e.id} className="border-l-2 border-brand-dark/30 pl-3 text-sm text-muted">
                    {sentence} <span className="text-muted">· {timeAgo(e.created_at)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5 md:min-h-0 md:overflow-y-auto [&>*:first-child]:mt-0 [&>*:first-child]:border-t-0 [&>*:first-child]:pt-0">
          {isStaff && (
            <div>
              <div className="mb-2 text-xs font-semibold tracking-wide text-muted">Assign to</div>
              {assignError && (
                <p className="mb-2 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-sm text-red-500">{assignError}</p>
              )}
              <div className="flex gap-2">
                <StaffSelect value={assigneeIdInput} onChange={setAssigneeIdInput} className={`${inputClass} min-w-0 flex-1`} />
                <button onClick={handleAssign} className="rounded-md border border-line px-3 py-2 text-sm transition-colors hover:border-brand-dark">
                  Assign
                </button>
              </div>
              {user && String(ticket.assignee_id ?? '') !== String(user.id) && (
                <button onClick={handleAssignToMe} className="mt-2 text-sm text-brand-dark hover:underline">
                  Assign to me
                </button>
              )}
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

          <KnownIssuePanel ticketId={id} knownIssueId={ticket.known_issue_id ?? null} staff={isStaff} onChange={loadAll} />

          <div className="[&>*]:mt-0 [&>*]:border-0 [&>*]:p-0">
            <RatingStars ticketId={id} status={ticket.status} isRequester={ticket.requester_id === user?.id} />
          </div>

          {!isStaff && !ticket.known_issue_id && (
            <p className="text-sm text-muted">
              We&apos;ll reply in the Conversation tab. Due {dueAt ? new Date(dueAt).toLocaleString() : 'soon'}.
            </p>
          )}
        </aside>
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