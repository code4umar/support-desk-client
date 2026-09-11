import { legalMoves, requiresNote } from '@/lib/transitions';

describe('status transitions', () => {
  test('open only allows in_progress', () => {
    expect(legalMoves('open')).toEqual(['in_progress']);
    expect(legalMoves('open')).not.toContain('closed');
    expect(legalMoves('open')).not.toContain('resolved');
  });

  test('in_progress only allows resolved', () => {
    expect(legalMoves('in_progress')).toEqual(['resolved']);
    expect(legalMoves('in_progress')).not.toContain('open');
  });

  test('resolved allows closed or back to in_progress, nothing else', () => {
    expect(legalMoves('resolved').sort()).toEqual(['closed', 'in_progress'].sort());
    expect(legalMoves('resolved')).not.toContain('open');
  });

  test('closed only allows in_progress', () => {
    expect(legalMoves('closed')).toEqual(['in_progress']);
    expect(legalMoves('closed')).not.toContain('resolved');
  });
});

describe('reopen note requirement', () => {
  test('requires a note only when moving from closed to in_progress', () => {
    expect(requiresNote('closed', 'in_progress')).toBe(true);
    expect(requiresNote('resolved', 'in_progress')).toBe(false);
    expect(requiresNote('open', 'in_progress')).toBe(false);
  });
});