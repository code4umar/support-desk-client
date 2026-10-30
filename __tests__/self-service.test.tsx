import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ArticleFeedback from '@/components/ArticleFeedback';
import ArticleSuggestions from '@/components/ArticleSuggestions';
import SimilarTickets from '@/components/SimilarTickets';
import KnownIssuePanel from '@/components/KnownIssuePanel';

const articleFeedback = jest.fn();
const searchArticles = jest.fn();
const similarTickets = jest.fn();
jest.mock('@/lib/api', () => ({
  api: {
    articleFeedback: (...a: unknown[]) => articleFeedback(...a),
    searchArticles: (...a: unknown[]) => searchArticles(...a),
    similarTickets: (...a: unknown[]) => similarTickets(...a),
    getLinkedTickets: () => Promise.resolve([]),
  },
  ApiRequestError: class extends Error {},
}));
jest.mock('@/components/Toast', () => ({ useToast: () => ({ show: jest.fn() }) }));

beforeEach(() => {
  articleFeedback.mockReset().mockResolvedValue({ helpful: true });
  searchArticles.mockReset();
  similarTickets.mockReset();
});

describe('article feedback', () => {
  test('records a vote and thanks the reader', async () => {
    render(<ArticleFeedback articleId={4} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /no/i }));
    });
    expect(articleFeedback).toHaveBeenCalledWith(4, false);
    expect(screen.getByText(/use that to improve it/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /no/i })).toHaveAttribute('aria-pressed', 'true');
  });

  test('rolls back when saving fails', async () => {
    articleFeedback.mockRejectedValue(new Error('down'));
    render(<ArticleFeedback articleId={4} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /yes/i }));
    });
    expect(screen.getByText('Was this article helpful?')).toBeInTheDocument();
    expect(screen.getByText(/Couldn’t save your vote/)).toBeInTheDocument();
  });
});

describe('"This solved it" on the new-ticket form', () => {
  test('counts as a ticket avoided and tells the form', async () => {
    jest.useFakeTimers();
    const article = { id: 1, title: 'How to reset your password', excerpt: '', tags: [], published: true };
    searchArticles.mockResolvedValue([article]);
    const onSolved = jest.fn();
    render(<ArticleSuggestions text="reset password" onSolved={onSolved} />);
    await act(async () => {
      jest.advanceTimersByTime(400);
    });
    fireEvent.click(screen.getByRole('button', { name: /this solved it/i }));
    expect(articleFeedback).toHaveBeenCalledWith(1, true, 'ticket_form');
    expect(onSolved).toHaveBeenCalledWith(article);
    jest.useRealTimers();
  });
});

describe('similar tickets', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('customers only learn the count', async () => {
    similarTickets.mockResolvedValue({ count: 3 });
    render(<SimilarTickets text="checkout payment error" />);
    await act(async () => {
      jest.advanceTimersByTime(600);
    });
    expect(screen.getByText('3 other people reported something similar recently')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  test('staff get links to the matching tickets', async () => {
    similarTickets.mockResolvedValue({ count: 1, items: [{ id: 31, subject: 'Payment error', status: 'open', known_issue_id: 30 }] });
    render(<SimilarTickets text="checkout payment error" />);
    await act(async () => {
      jest.advanceTimersByTime(600);
    });
    expect(screen.getByRole('link', { name: '#31 Payment error' })).toHaveAttribute('href', '/tickets/31');
    expect(screen.getByText('→ known issue #30')).toBeInTheDocument();
  });

  test('stays hidden when nobody else reported it', async () => {
    similarTickets.mockResolvedValue({ count: 0 });
    render(<SimilarTickets text="something unusual here" />);
    await act(async () => {
      jest.advanceTimersByTime(600);
    });
    expect(screen.queryByLabelText('Similar tickets')).not.toBeInTheDocument();
  });
});

describe('known issue panel', () => {
  test('customers see a reassuring note, no controls or ticket numbers', () => {
    render(<KnownIssuePanel ticketId="31" knownIssueId={30} staff={false} onChange={jest.fn()} />);
    expect(screen.getByText(/tracking it as one known issue/)).toBeInTheDocument();
    expect(screen.queryByText(/#30/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('customers see nothing for an ordinary ticket', () => {
    const { container } = render(<KnownIssuePanel ticketId="5" knownIssueId={null} staff={false} onChange={jest.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  test('staff can link a duplicate', async () => {
    render(<KnownIssuePanel ticketId="5" knownIssueId={null} staff onChange={jest.fn()} />);
    expect(await screen.findByLabelText('Duplicate of ticket #')).toBeInTheDocument();
  });
});
