'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, ApiRequestError } from '@/lib/api';
import { useToast } from '@/components/Toast';

type Linked = { id: number; subject: string; status: string };

// Known issues: link duplicates to one ticket; resolving that ticket resolves
// them all. Staff get the controls; customers only see a reassuring note.
export default function KnownIssuePanel({
  ticketId,
  knownIssueId,
  staff,
  onChange,
}: {
  ticketId: string;
  knownIssueId: number | null;
  staff: boolean;
  onChange: () => void;
}) {
  const { show } = useToast();
  const [linked, setLinked] = useState<Linked[]>([]);
  const [target, setTarget] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!staff) return;
    api.getLinkedTickets(ticketId).then(setLinked).catch(() => {});
  }, [ticketId, staff, knownIssueId]);

  if (!staff) {
    return knownIssueId ? (
      <div className="mt-4 rounded-lg border border-brand/30 bg-brand/5 px-4 py-3 text-sm text-navy">
        🔗 Others reported this too. Our team is tracking it as one known issue, and you&apos;ll be notified as soon as it&apos;s fixed.
      </div>
    ) : null;
  }

  async function run(action: () => Promise<unknown>, done: string) {
    setError('');
    setBusy(true);
    try {
      await action();
      show(done);
      setTarget('');
      onChange();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  const active = linked.filter((t) => t.status === 'open' || t.status === 'in_progress').length;

  return (
    <section aria-label="Known issue" className="mt-4 rounded-lg border border-line p-4">
      <h2 className="text-sm font-semibold text-navy">Known issue</h2>

      {knownIssueId ? (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
          <p className="text-navy">
            Duplicate of <Link href={`/tickets/${knownIssueId}`} className="font-medium text-brand-dark hover:underline">#{knownIssueId}</Link>. It will be resolved when that ticket is.
          </p>
          <button type="button" disabled={busy} onClick={() => run(() => api.unlinkTicket(ticketId), 'Unlinked')} className="text-xs text-muted hover:text-red-600 disabled:opacity-50">
            Unlink
          </button>
        </div>
      ) : linked.length > 0 ? (
        <div className="mt-2 text-sm">
          <p className="text-navy">
            <strong>{linked.length}</strong> ticket{linked.length === 1 ? '' : 's'} linked here
            {active > 0 && <> · resolving this ticket resolves the <strong>{active}</strong> still open and notifies their requesters</>}.
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {linked.map((t) => (
              <li key={t.id}>
                <Link href={`/tickets/${t.id}`} className="rounded-full border border-line px-2.5 py-0.5 text-xs text-navy hover:border-brand-dark/60" title={t.subject}>
                  #{t.id} · {t.status.replace('_', ' ')}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <form
          className="mt-2 flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const id = Number(target);
            if (id > 0) run(() => api.linkTicket(ticketId, id), `Linked to known issue #${id}`);
          }}
        >
          <label htmlFor="known-issue-id" className="text-xs text-muted">Duplicate of ticket #</label>
          <input
            id="known-issue-id"
            inputMode="numeric"
            value={target}
            onChange={(e) => setTarget(e.target.value.replace(/\D/g, ''))}
            className="w-24 rounded-md border border-line bg-transparent px-2 py-1 text-sm outline-none focus:border-brand-dark"
          />
          <button type="submit" disabled={busy || !target} className="rounded-md border border-brand-dark/40 px-3 py-1 text-xs font-semibold text-brand-dark hover:bg-brand/15 disabled:opacity-50">
            Link
          </button>
        </form>
      )}
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </section>
  );
}
