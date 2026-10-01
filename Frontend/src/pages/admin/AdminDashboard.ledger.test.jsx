import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import AdminDashboard from './AdminDashboard';

describe('AdminDashboard operational ledger', () => {
  it('renders the dynamic expedition ledger beneath the executive metrics', () => {
    render(<MemoryRouter><AdminDashboard /></MemoryRouter>);

    expect(screen.getByRole('heading', { name: 'Recent Expedition Ledger' })).toBeTruthy();
    expect(screen.getByRole('table', { name: 'Recent expedition ledger' })).toBeTruthy();
  });
});
