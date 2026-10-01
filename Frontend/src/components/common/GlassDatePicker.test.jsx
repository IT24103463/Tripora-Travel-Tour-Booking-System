import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import GlassDatePicker from './GlassDatePicker';

describe('GlassDatePicker', () => {
  it('uses empty offset cells before the first day of a month', () => {
    const { container, getByRole } = render(
      <GlassDatePicker value="01/06/2026" onChange={vi.fn()} ariaLabel="Travel date" />,
    );

    fireEvent.click(getByRole('button', { name: 'Travel date' }));

    const offsets = container.querySelectorAll('.prev-month-day');
    expect(offsets).toHaveLength(1);
    expect(offsets[0].textContent).toBe('');
  });
});
