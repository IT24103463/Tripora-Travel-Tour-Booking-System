import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AdminDashboard from './AdminDashboard';

vi.mock('../../api/apiClient', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }));
import api from '../../api/apiClient';

describe('AdminDashboard overview ledger', () => {
  beforeEach(() => api.get.mockResolvedValue({ data: [] }));
  afterEach(() => vi.clearAllMocks());

  it('loads the recent expedition ledger only when refreshed', async () => {
    api.get.mockResolvedValue({ data: [{ id: 'booking-1', guestName: 'Asha', status: 'confirmed' }] });
    render(<MemoryRouter><AdminDashboard /></MemoryRouter>);

    expect(api.get).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Refresh Ledger/i }));
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/bookings'));
    expect(await screen.findByText('Asha')).toBeTruthy();
  });

  it('does not render telemetry cards or background sync status', () => {
    render(<MemoryRouter><AdminDashboard /></MemoryRouter>);
    expect(screen.queryByText('Confirmed Expeditions')).toBeNull();
    expect(screen.queryByText('Active Offers')).toBeNull();
    expect(screen.queryByText('Concierge Inquiries')).toBeNull();
    expect(screen.queryByText(/Live Sync|Polling/i)).toBeNull();
  });
});
