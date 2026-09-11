import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Minimal stand-in for the list rendering logic, isolated from routing/auth.
function TicketListView({ data, total }: { data: any[]; total: number }) {
  if (data.length === 0) {
    return <p>{total === 0 ? 'No tickets match this filter.' : ''}</p>;
  }
  return (
    <ul>
      {data.map((t) => (
        <li key={t.id}>{t.subject}</li>
      ))}
    </ul>
  );
}

describe('ticket list rendering', () => {
  test('renders rows from a mocked page envelope', () => {
    const envelope = {
      data: [
        { id: 1, subject: 'Printer broken' },
        { id: 2, subject: 'VPN not connecting' },
      ],
      page: 1,
      pageSize: 20,
      total: 2,
    };
    render(<TicketListView data={envelope.data} total={envelope.total} />);
    expect(screen.getByText('Printer broken')).toBeInTheDocument();
    expect(screen.getByText('VPN not connecting')).toBeInTheDocument();
  });

  test('renders empty state from { data: [], total: 0 }', () => {
    render(<TicketListView data={[]} total={0} />);
    expect(screen.getByText('No tickets match this filter.')).toBeInTheDocument();
  });
});