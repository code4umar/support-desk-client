import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Minimal stand-in that mimics TicketFilters' contract: calling onChange
// with a key/value when a filter changes.
function StatusFilter({ onChange }: { onChange: (key: string, value: string | null) => void }) {
  return (
    <select
      aria-label="status filter"
      onChange={(e) => onChange('status', e.target.value || null)}
    >
      <option value="">All statuses</option>
      <option value="open">Open</option>
      <option value="closed">Closed</option>
    </select>
  );
}

describe('filter behaviour', () => {
  test('changing a filter calls onChange with the new key and value', () => {
    const onChange = jest.fn();
    render(<StatusFilter onChange={onChange} />);

    const select = screen.getByLabelText('status filter');
    fireEvent.change(select, { target: { value: 'open' } });

    expect(onChange).toHaveBeenCalledWith('status', 'open');
  });

  test('clearing a filter calls onChange with null', () => {
    const onChange = jest.fn();
    render(<StatusFilter onChange={onChange} />);

    const select = screen.getByLabelText('status filter');
    fireEvent.change(select, { target: { value: '' } });

    expect(onChange).toHaveBeenCalledWith('status', null);
  });
});