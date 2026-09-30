'use client';
import { useState } from 'react';
import { legalMoves, requiresNote, TicketStatus } from '@/lib/transitions';
import { api, ApiRequestError } from '@/lib/api';

export default function StatusControl({
  ticketId,
  currentStatus,
  onChanged,
}: {
  ticketId: string;
  currentStatus: TicketStatus;
  onChanged: (newStatus: TicketStatus) => void;
}) {
  const [note, setNote] = useState('');
  const [pendingTarget, setPendingTarget] = useState<TicketStatus | null>(null);
  const [error, setError] = useState('');

  const moves = legalMoves(currentStatus);

  async function submitMove(target: TicketStatus) {
    if (requiresNote(currentStatus, target) && !note.trim()) {
      setPendingTarget(target);
      return;
    }
    setError('');
    try {
      await api.changeStatus(ticketId, target, note.trim() || undefined);
      onChanged(target);
      setNote('');
      setPendingTarget(null);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 409) {
        setError('This ticket already moved — refresh to see its current status.');
      } else if (err instanceof ApiRequestError && err.status === 400) {
        setError(err.message);
      } else {
        setError('Could not change status.');
      }
    }
  }

  if (moves.length === 0) return null;

  return (
    <div className="mt-4 border-t border-white/10 pt-4">
      <div className="text-xs font-semibold tracking-wide text-zinc-400 mb-2">Change status</div>
      {error && (
        <p className="text-red-500 text-sm bg-red-500/10 border border-red-500/20 rounded-md py-1.5 px-3 mb-2">
          {error}
        </p>
      )}
      <div className="flex gap-2 flex-wrap">
        {moves.map((m) => (
          <button
            key={m}
            className="border border-white/20 rounded-md px-3 py-1.5 text-sm transition-colors hover:border-teal-400 hover:text-teal-400"
            onClick={() => submitMove(m)}
          >
            → {m}
          </button>
        ))}
      </div>
      {pendingTarget && (
        <div className="mt-3 flex gap-2 items-center">
          <input
            className="border border-white/20 bg-transparent rounded-md p-2 text-sm flex-1 outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 transition-colors"
            placeholder="Reason for reopening (required)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button
            className="bg-teal-500 text-black font-semibold rounded-md px-3 py-2 text-sm transition-all hover:bg-teal-400 disabled:opacity-40 disabled:hover:bg-teal-500"
            disabled={!note.trim()}
            onClick={() => submitMove(pendingTarget)}
          >
            Confirm
          </button>
        </div>
      )}
    </div>
  );
}