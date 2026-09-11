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
    <div className="mt-2 border-t pt-2">
      <div className="text-sm font-medium mb-1">Change status</div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex gap-2 flex-wrap">
        {moves.map((m) => (
          <button
            key={m}
            className="border px-2 py-1 text-sm"
            onClick={() => submitMove(m)}
          >
            → {m}
          </button>
        ))}
      </div>
      {pendingTarget && (
        <div className="mt-2 flex gap-2 items-center">
          <input
            className="border p-1 text-sm flex-1"
            placeholder="Reason for reopening (required)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button
            className="border px-2 py-1 text-sm"
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