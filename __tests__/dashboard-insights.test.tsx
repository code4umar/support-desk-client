import { deskPulse, knownIssues, slaBuckets } from '@/components/dashboard/insights';
import type { Ticket } from '@/components/dashboard/widgets';

jest.mock('@/lib/api', () => ({ api: {} }));

const NOW = Date.parse('2026-10-30T12:00:00Z');
const H = 3_600_000;
const t = (id: number, status: string, dueInHours: number | null, extra: Partial<Ticket> = {}): Ticket => ({
  id,
  subject: `Ticket ${id}`,
  status,
  priority: 'normal',
  due_at: dueInHours === null ? null : new Date(NOW + dueInHours * H).toISOString(),
  ...extra,
});

describe('slaBuckets', () => {
  test('sorts active tickets by time left and ignores finished ones', () => {
    const { counts, total } = slaBuckets(
      [t(1, 'open', -2), t(2, 'in_progress', 1), t(3, 'open', 10), t(4, 'open', 72), t(5, 'resolved', -50), t(6, 'open', null)],
      NOW,
    );
    expect(counts).toEqual({ breached: 1, soon: 1, today: 1, later: 1 });
    expect(total).toBe(4);
  });
});

describe('deskPulse', () => {
  test('is critical when anything breached, mentioning what is due soon', () => {
    const p = deskPulse([t(1, 'open', -1), t(2, 'open', -3), t(3, 'open', 2)], NOW, true);
    expect(p.level).toBe('critical');
    expect(p.text).toBe('2 tickets past SLA and 1 more due within 4 hours. Start with the oldest.');
  });

  test('is busy when something is due today but nothing breached', () => {
    expect(deskPulse([t(1, 'open', 10)], NOW, true)).toEqual({ level: 'busy', text: 'Nothing breached. 1 ticket due today.' });
  });

  test('is calm when nothing is due within 24 hours', () => {
    expect(deskPulse([t(1, 'open', 48)], NOW, true).level).toBe('calm');
  });

  test('talks to customers about their own tickets, never about SLA', () => {
    expect(deskPulse([t(1, 'open', -5), t(2, 'in_progress', 3)], NOW, false)).toEqual({
      level: 'calm',
      text: 'You have 2 open tickets; we’re actively working on 1.',
    });
    expect(deskPulse([], NOW, false).text).toMatch(/no open tickets/);
  });
});

describe('knownIssues', () => {
  test('groups linked tickets under their known issue, busiest first', () => {
    const list = knownIssues([
      t(10, 'in_progress', 5, { subject: 'Checkout broken' }),
      t(11, 'open', 5, { known_issue_id: 10 }),
      t(12, 'open', 5, { known_issue_id: 10 }),
      t(20, 'resolved', null, { subject: 'CSV empty' }),
      t(21, 'resolved', null, { known_issue_id: 20 }),
    ]);
    expect(list).toEqual([
      { id: 10, subject: 'Checkout broken', status: 'in_progress', linked: 2, active: 2 },
      { id: 20, subject: 'CSV empty', status: 'resolved', linked: 1, active: 0 },
    ]);
  });
});
