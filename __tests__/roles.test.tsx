import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { permissions } from '@/lib/permissions';

function TicketControls({ role }: { role: 'customer' | 'agent' | 'admin' }) {
  return (
    <div>
      {permissions.canAssign(role) && <button>Assign</button>}
      {permissions.canChangeStatus(role) && <button>Change status</button>}
      {permissions.canManageTags(role) && <button>Add tag</button>}
      {permissions.canDeleteTicket(role) && <button>Delete ticket</button>}
    </div>
  );
}

describe('role-based ticket controls', () => {
  test('agent sees assign, status, and tag controls', () => {
    render(<TicketControls role="agent" />);
    expect(screen.getByText('Assign')).toBeInTheDocument();
    expect(screen.getByText('Change status')).toBeInTheDocument();
    expect(screen.getByText('Add tag')).toBeInTheDocument();
  });

  test('agent does not see the admin-only delete control', () => {
    render(<TicketControls role="agent" />);
    expect(screen.queryByText('Delete ticket')).not.toBeInTheDocument();
  });

  test('customer sees none of the staff controls', () => {
    render(<TicketControls role="customer" />);
    expect(screen.queryByText('Assign')).not.toBeInTheDocument();
    expect(screen.queryByText('Change status')).not.toBeInTheDocument();
    expect(screen.queryByText('Add tag')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete ticket')).not.toBeInTheDocument();
  });

  test('admin sees the delete control', () => {
    render(<TicketControls role="admin" />);
    expect(screen.getByText('Delete ticket')).toBeInTheDocument();
  });
});