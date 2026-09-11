export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export const transitions: Record<TicketStatus, TicketStatus[]> = {
  open: ['in_progress'],
  in_progress: ['resolved'],
  resolved: ['closed', 'in_progress'],
  closed: ['in_progress'],
};

export function legalMoves(from: TicketStatus): TicketStatus[] {
  return transitions[from] ?? [];
}

export function requiresNote(from: TicketStatus, to: TicketStatus): boolean {
  return from === 'closed' && to === 'in_progress';
}