import { api } from '@/lib/api';
import * as session from '@/lib/session';

global.fetch = jest.fn();

describe('api client auth header', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('attaches Authorization header when signed in', async () => {
    jest.spyOn(session, 'getToken').mockReturnValue('abc123');
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [], page: 1, pageSize: 20, total: 0 }),
    });

    await api.getTickets('');

    const callArgs = (fetch as jest.Mock).mock.calls[0];
    const headers = callArgs[1].headers;
    expect(headers['Authorization']).toBe('Bearer abc123');
  });

  test('does not attach Authorization header when signed out', async () => {
    jest.spyOn(session, 'getToken').mockReturnValue(null);
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [], page: 1, pageSize: 20, total: 0 }),
    });

    await api.getTickets('');

    const callArgs = (fetch as jest.Mock).mock.calls[0];
    const headers = callArgs[1].headers;
    expect(headers['Authorization']).toBeUndefined();
  });
});