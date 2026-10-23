import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SlaCountdown from '@/components/SlaCountdown';
import MentionText from '@/components/MentionText';

const inHours = (h: number) => new Date(Date.now() + h * 3600000 + 30000).toISOString();

describe('SlaCountdown', () => {
  test('shows time left, in hours and minutes', () => {
    render(<SlaCountdown dueAt={inHours(2)} status="open" />);
    expect(screen.getByText(/^Due in 2h/)).toBeInTheDocument();
  });

  test('shows days for far-away deadlines', () => {
    render(<SlaCountdown dueAt={inHours(50)} status="open" />);
    expect(screen.getByText(/^Due in 2d/)).toBeInTheDocument();
  });

  test('turns into "Overdue" once the time has passed', () => {
    render(<SlaCountdown dueAt={inHours(-3)} status="in_progress" />);
    expect(screen.getByText(/^Overdue 2h/)).toBeInTheDocument();
  });

  test('shows nothing for resolved/closed tickets or when there is no deadline', () => {
    const { container, rerender } = render(<SlaCountdown dueAt={inHours(2)} status="resolved" />);
    expect(container).toBeEmptyDOMElement();
    rerender(<SlaCountdown dueAt={null} status="open" />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('MentionText', () => {
  test('highlights @Full Name and keeps the rest of the text', () => {
    render(<p data-testid="t"><MentionText body="Please check @Sara Agent today" /></p>);
    expect(screen.getByText('@Sara Agent')).toHaveClass('text-brand-dark');
    expect(screen.getByTestId('t')).toHaveTextContent('Please check @Sara Agent today');
  });

  test('does not highlight email addresses', () => {
    const { container } = render(<p><MentionText body="mail team@Example.com" /></p>);
    expect(container.querySelector('span')).toBeNull(); // nothing highlighted
    expect(container).toHaveTextContent('mail team@Example.com');
  });
});
