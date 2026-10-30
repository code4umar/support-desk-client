import { act, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { permissions } from '@/lib/permissions';
import ArticleSuggestions from '@/components/ArticleSuggestions';

const searchArticles = jest.fn();
jest.mock('@/lib/api', () => ({
  api: { searchArticles: (q: string) => searchArticles(q) },
}));

describe('article suggestions on the new-ticket form', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    searchArticles.mockReset();
  });
  afterEach(() => jest.useRealTimers());

  test('searches after the user stops typing and lists matching articles', async () => {
    searchArticles.mockResolvedValue([
      { id: 4, title: 'How to reset your password', excerpt: 'Open the sign in page', tags: [], published: true },
    ]);
    render(<ArticleSuggestions text="reset password" />);

    expect(searchArticles).not.toHaveBeenCalled(); // debounced
    await act(async () => {
      jest.advanceTimersByTime(400);
    });

    expect(searchArticles).toHaveBeenCalledWith('q=reset+password&limit=3');
    expect(screen.getByRole('link', { name: 'How to reset your password' })).toHaveAttribute('href', '/help/4');
  });

  test('does not search for very short text', async () => {
    render(<ArticleSuggestions text="hi" />);
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(searchArticles).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('Suggested articles')).not.toBeInTheDocument();
  });

  test('stays hidden when nothing matches', async () => {
    searchArticles.mockResolvedValue([]);
    render(<ArticleSuggestions text="something unusual" />);
    await act(async () => {
      jest.advanceTimersByTime(400);
    });
    expect(screen.queryByLabelText('Suggested articles')).not.toBeInTheDocument();
  });
});

describe('help center permissions', () => {
  test('agents and admins write articles; customers do not', () => {
    expect(permissions.canWriteArticle('agent')).toBe(true);
    expect(permissions.canWriteArticle('admin')).toBe(true);
    expect(permissions.canWriteArticle('customer')).toBe(false);
  });

  test('only admins delete articles and manage categories', () => {
    expect(permissions.canDeleteArticle('agent')).toBe(false);
    expect(permissions.canDeleteArticle('admin')).toBe(true);
    expect(permissions.canManageCategories('agent')).toBe(false);
    expect(permissions.canManageCategories('admin')).toBe(true);
  });
});
