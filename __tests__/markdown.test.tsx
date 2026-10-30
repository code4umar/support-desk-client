import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { parseInline, parseMarkdown, safeHref } from '@/lib/markdown';
import Markdown from '@/components/Markdown';

describe('markdown parser', () => {
  test('reads headings, lists, quotes, code and paragraphs', () => {
    const blocks = parseMarkdown('## Title\n\n1. one\n2. two\n\n- a\n- b\n\n> note\n\n```\nx = 1\n```\n\nline one\nline two');
    expect(blocks.map((b) => b.type)).toEqual(['heading', 'list', 'list', 'quote', 'code', 'paragraph']);
    expect(blocks[1]).toMatchObject({ type: 'list', ordered: true });
    expect(blocks[2]).toMatchObject({ type: 'list', ordered: false });
    expect(blocks[4]).toEqual({ type: 'code', text: 'x = 1' });
    expect(blocks[5]).toEqual({ type: 'paragraph', children: [{ type: 'text', text: 'line one line two' }] });
  });

  test('reads inline bold, italic, code and links', () => {
    expect(parseInline('a **b** *c* `d` [e](/f)')).toEqual([
      { type: 'text', text: 'a ' },
      { type: 'strong', children: [{ type: 'text', text: 'b' }] },
      { type: 'text', text: ' ' },
      { type: 'em', children: [{ type: 'text', text: 'c' }] },
      { type: 'text', text: ' ' },
      { type: 'code', text: 'd' },
      { type: 'text', text: ' ' },
      { type: 'link', href: '/f', children: [{ type: 'text', text: 'e' }] },
    ]);
  });

  test('only allows links that cannot run script', () => {
    expect(safeHref('https://example.com')).toBe('https://example.com');
    expect(safeHref('/tickets/new')).toBe('/tickets/new');
    expect(safeHref('mailto:help@example.com')).toBe('mailto:help@example.com');
    expect(safeHref('javascript:alert(1)')).toBeNull();
    expect(safeHref('//evil.example')).toBeNull();
    expect(safeHref('data:text/html,hi')).toBeNull();
  });
});

describe('<Markdown />', () => {
  test('renders an unsafe link as plain text', () => {
    const { container } = render(<Markdown source="[click me](javascript:alert(1))" />);
    expect(container.querySelector('a')).toBeNull();
    expect(screen.getByText(/click me/)).toBeInTheDocument();
  });

  test('shows raw HTML as text instead of injecting it', () => {
    const { container } = render(<Markdown source={'<img src=x onerror="alert(1)">'} />);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('<img src=x onerror="alert(1)">')).toBeInTheDocument();
  });

  test('renders safe links and headings', () => {
    render(<Markdown source={'# Reset\n\nSee [the docs](https://example.com).'} />);
    expect(screen.getByRole('heading', { name: 'Reset' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'the docs' })).toHaveAttribute('href', 'https://example.com');
  });
});
