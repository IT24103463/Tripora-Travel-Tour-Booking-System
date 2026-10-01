import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AdminDashboard from './AdminDashboard';

vi.mock('../../api/apiClient', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

import api from '../../api/apiClient';

describe('AdminDashboard CRUD workspaces', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  beforeEach(() => {
    api.get.mockResolvedValue({ data: [] });
  });

  it('does not open a create dialog when switching to a management tab', async () => {
    render(<MemoryRouter><AdminDashboard /></MemoryRouter>);

    fireEvent.click(screen.getByRole('button', { name: /Travel Packages/i }));

    expect(await screen.findByRole('table', { name: 'Packages management' })).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens a tour create form from the Tours workspace', async () => {
    render(<MemoryRouter><AdminDashboard /></MemoryRouter>);

    fireEvent.click(screen.getByRole('button', { name: /Expeditions & Tours/i }));

    fireEvent.click(await screen.findByRole('button', { name: /Add Tour/i }));

    expect(screen.getByRole('dialog', { name: /Create Tour/i })).toBeTruthy();
    expect(screen.getByLabelText(/Tour name/i)).toBeTruthy();
  });

  it('requires confirmation before removing a tour from the workspace', async () => {
    let deleted = false;
    api.get.mockImplementation((path) => {
      if (path === '/tours') {
        return Promise.resolve({ data: deleted ? { data: [] } : { data: [{ id: 'tour-1', name: 'Whale Coast', destination: 'Mirissa', durationDays: 2, capacity: 12, availableSlots: 12, price: 45000, isActive: true }] } });
      }
      return Promise.resolve({ data: [] });
    });
    api.delete.mockImplementation(async () => { deleted = true; });
    render(<MemoryRouter><AdminDashboard /></MemoryRouter>);

    fireEvent.click(screen.getByRole('button', { name: /Expeditions & Tours/i }));
    expect(await screen.findByText('Whale Coast')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByRole('dialog', { name: /Delete Tour/i })).toBeTruthy();
    expect(screen.getByText(/permanently remove this tour/i)).toBeTruthy();

    fireEvent.click(within(screen.getByRole('dialog', { name: /Delete Tour/i })).getByRole('button', { name: 'Delete' }));
    expect(await screen.findByText('No tours are recorded yet.')).toBeTruthy();
  });
});
