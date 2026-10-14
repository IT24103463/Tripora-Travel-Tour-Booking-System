import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import api from '../api/apiClient';
import MyInquiries from './MyInquiries';

vi.mock('../api/apiClient', () => ({
  default: { get: vi.fn() },
}));

describe('MyInquiries', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('loads and displays inquiry details and an available concierge response', async () => {
    api.get.mockResolvedValue({
      data: [{
        id: 1,
        reason: 'Private Rail Journey',
        message: 'Can you help plan the trip?',
        status: 'RESOLVED',
        createdAt: '2026-10-14T10:00:00Z',
        adminResponse: 'Our concierge will contact you shortly.',
      }],
    });

    render(<MyInquiries />);

    expect(await screen.findByText('Private Rail Journey')).toBeTruthy();
    expect(screen.getByText('Can you help plan the trip?')).toBeTruthy();
    expect(screen.getByText('Resolved')).toBeTruthy();
    expect(screen.getByText('Our concierge will contact you shortly.')).toBeTruthy();
    expect(api.get).toHaveBeenCalledWith('/inquiries/my');
  });

  it('shows the empty state when the user has not sent inquiries', async () => {
    api.get.mockResolvedValue({ data: [] });

    render(<MyInquiries />);

    expect(await screen.findByText('No inquiries sent yet')).toBeTruthy();
  });

  it('shows a readable error when loading fails', async () => {
    api.get.mockRejectedValue(new Error('offline'));

    render(<MyInquiries />);

    expect(await screen.findByText('Inquiries unavailable')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('Unable to load your sent inquiries');
  });
});
