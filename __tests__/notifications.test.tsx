import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import NotificationBell from '@/components/NotificationBell';

const push = jest.fn();
let mockRole: string | undefined = 'admin';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));
jest.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: mockRole ? { id: 1, role: mockRole, name: 'X' } : null }),
}));
jest.mock('@/components/Toast', () => ({ useToast: () => ({ show: jest.fn() }) }));
jest.mock('@/lib/api', () => ({
  api: {
    getNotifications: jest.fn(),
    markNotificationRead: jest.fn(() => Promise.resolve({})),
    markAllNotificationsRead: jest.fn(() => Promise.resolve({ updated: 2 })),
  },
}));
import { api } from '@/lib/api';

const sample = {
  unread: 2,
  items: [
    { id: 2, type: 'ticket_created', message: 'New ticket #7: Printer broken (by a@x.com)', ticket_id: 7, read_at: null, created_at: new Date().toISOString() },
    { id: 1, type: 'user_login', message: 'Ali (customer) logged in', ticket_id: null, read_at: null, created_at: new Date().toISOString() },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockRole = 'admin';
  (api.getNotifications as jest.Mock).mockResolvedValue(sample);
});

describe('NotificationBell', () => {
  test('shows the unread count badge for an admin', async () => {
    render(<NotificationBell />);
    expect(await screen.findByText('2')).toBeInTheDocument();
  });

  test('renders nothing (and never calls the API) for non-admins', () => {
    mockRole = 'customer';
    const { container } = render(<NotificationBell />);
    expect(container).toBeEmptyDOMElement();
    expect(api.getNotifications).not.toHaveBeenCalled();
  });

  test('opens the list and clicking a ticket notification marks it read and navigates', async () => {
    render(<NotificationBell />);
    await screen.findByText('2');
    fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
    fireEvent.click(await screen.findByText(/Printer broken/));
    expect(api.markNotificationRead).toHaveBeenCalledWith(2);
    expect(push).toHaveBeenCalledWith('/tickets/7');
  });

  test('"Mark all read" clears the badge', async () => {
    render(<NotificationBell />);
    await screen.findByText('2');
    fireEvent.click(screen.getByRole('button', { name: /notifications/i }));
    fireEvent.click(await screen.findByText('Mark all read'));
    expect(api.markAllNotificationsRead).toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByText('2')).not.toBeInTheDocument());
  });
});
