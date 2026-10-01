import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AdminDashboard from './AdminDashboard';

vi.mock('../../api/apiClient', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

import api from '../../api/apiClient';

describe('AdminDashboard live data states', () => {
  afterEach(() => vi.useRealTimers());

  beforeEach(() => {
    api.get.mockImplementation((endpoint) => Promise.resolve({
      data: endpoint === '/bookings' ? [{
        id: 'booking-1',
        guestName: 'Asha Perera',
        itemTitle: 'Yala Safari',
        travelDate: '2026-09-28T00:00:00',
        status: 'confirmed',
      }] : [],
    }));
  });

  it('renders a human-readable date after live endpoints return booking records', async () => {
    render(<MemoryRouter><AdminDashboard /></MemoryRouter>);

    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(3));
    expect(await screen.findByText('Sep 28, 2026')).toBeTruthy();
    expect(screen.getAllByText('LKR 0')).not.toHaveLength(0);
  });

  it('uses one shared shell and three explicit top-island columns', async () => {
    render(<MemoryRouter><AdminDashboard /></MemoryRouter>);

    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(3));
    expect(document.querySelector('.admin-master-shell')).toBeTruthy();
    expect(document.querySelector('.floating-top-island > .island-col-left')).toBeTruthy();
    expect(document.querySelector('.floating-top-island > .island-col-center')).toBeTruthy();
    expect(document.querySelector('.floating-top-island > .island-col-right')).toBeTruthy();
  });

  it('shows only the three operational overview metrics', async () => {
    render(<MemoryRouter><AdminDashboard /></MemoryRouter>);

    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(3));

    expect(document.querySelectorAll('.bento-metric-grid .bento-glass-card')).toHaveLength(3);
    expect(screen.getByText('Confirmed Expeditions')).toBeTruthy();
    expect(screen.getByText('Active Offers')).toBeTruthy();
    expect(screen.getByText('Concierge Inquiries')).toBeTruthy();
    expect(screen.queryByText('Gross Booking Volume')).toBeNull();
  });

  it('refreshes the overview metrics from backend data every 30 seconds', async () => {
    let version = 1;
    api.get.mockImplementation((endpoint) => Promise.resolve({
      data: endpoint === '/bookings'
        ? Array.from({ length: version }, (_, index) => ({ id: `booking-${index}`, status: 'confirmed' }))
        : endpoint === '/offers'
          ? Array.from({ length: version }, (_, index) => ({ id: `offer-${index}`, isActive: true }))
          : Array.from({ length: version }, (_, index) => ({ id: `inquiry-${index}`, status: 'UNREAD' })),
    }));
    vi.useFakeTimers();

    render(<MemoryRouter><AdminDashboard /></MemoryRouter>);
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByText('1 Active')).toBeTruthy();
    expect(screen.getByText('1 Open')).toBeTruthy();

    version = 2;
    await act(async () => { await vi.advanceTimersByTimeAsync(30000); });

    expect(api.get).toHaveBeenCalledTimes(6);
    expect(screen.getByText('2 Active')).toBeTruthy();
    expect(screen.getByText('2 Open')).toBeTruthy();
  });

  it('opens the complete inquiry details when an inquiry row is selected', async () => {
    api.get.mockImplementation((endpoint) => Promise.resolve({
      data: endpoint === '/inquiries' ? [{
        id: 'inquiry-1',
        name: 'Nimal Fernando',
        phoneNumber: '+94 77 123 4567',
        reason: 'Private tour request',
        message: 'Please arrange a private Yala expedition for four guests.',
        status: 'UNREAD',
        createdAt: '2026-09-28T09:30:00.000Z',
      }] : [],
    }));
    const user = userEvent.setup();

    render(<MemoryRouter><AdminDashboard /></MemoryRouter>);
    await user.click(screen.getByRole('button', { name: 'Concierge Desk' }));
    await user.click(await screen.findByText('Please arrange a private Yala expedition for four guests.'));

    const dialog = screen.getByRole('dialog', { name: 'Inquiry from Nimal Fernando' });
    expect(dialog).toBeTruthy();
    expect(within(dialog).getByText('+94 77 123 4567')).toBeTruthy();
  });

  it('renders live expedition reservations in the bookings module', async () => {
    api.get.mockImplementation((endpoint) => Promise.resolve({
      data: endpoint === '/bookings' ? [{
        id: 'booking-7',
        guestName: 'Maya Silva',
        email: 'maya@example.com',
        itemTitle: 'Sigiriya Sunrise Escape',
        travelDate: '2026-10-14T00:00:00.000Z',
        guests: 2,
        totalPrice: 1450,
        status: 'confirmed',
      }] : [],
    }));
    const user = userEvent.setup();

    render(<MemoryRouter><AdminDashboard /></MemoryRouter>);
    await user.click(screen.getByRole('button', { name: 'Reservation Ledger' }));

    expect(await screen.findByRole('heading', { name: 'Expedition Reservations' })).toBeTruthy();
    expect(screen.getByText('Maya Silva')).toBeTruthy();
    expect(screen.getByText('maya@example.com')).toBeTruthy();
    expect(screen.getByText('Sigiriya Sunrise Escape')).toBeTruthy();
    expect(screen.getByText('Oct 14, 2026')).toBeTruthy();
    expect(screen.getByText('2 Guests')).toBeTruthy();
    expect(screen.getByText('Confirmed')).toBeTruthy();
  });

  it('shows an empty expedition state after a successful empty response', async () => {
    api.get.mockResolvedValue({ data: [] });
    const user = userEvent.setup();
    render(<MemoryRouter><AdminDashboard /></MemoryRouter>);
    await user.click(screen.getByRole('button', { name: 'Reservation Ledger' }));

    expect(await screen.findByText('No confirmed expeditions found.')).toBeTruthy();
  });

  it('shows confirmed fallback expeditions when the bookings service is unavailable', async () => {
    api.get.mockRejectedValue(new Error('offline'));
    const user = userEvent.setup();
    render(<MemoryRouter><AdminDashboard /></MemoryRouter>);
    await user.click(screen.getByRole('button', { name: 'Reservation Ledger' }));

    expect(await screen.findByText('Showing temporary expedition records while the bookings service reconnects.')).toBeTruthy();
    expect(screen.getAllByText('Confirmed')).toHaveLength(6);
  });
});
