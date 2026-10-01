import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Offers from './Offers';

vi.mock('../components/BookingAction', () => ({
  default: ({ offer }) => <output data-testid={`booking-image-${offer.id}`}>{offer.imageUrl}</output>,
}));

const offers = [
  {
    id: 'stored-image', title: 'Trincomalee Catamaran Escape', category: 'Tour', targetId: 'target-1',
    imageUrl: 'https://cdn.tripora.test/trincomalee.jpg', originalPriceLKR: 50000, offerPriceLKR: 40000,
    startDate: '2026-01-01', endDate: '2027-01-01', isActive: true,
  },
  {
    id: 'safari-fallback', title: 'Yala Leopard Safari', category: 'Tour', targetId: 'target-2',
    originalPriceLKR: 50000, offerPriceLKR: 40000, startDate: '2026-01-01', endDate: '2027-01-01', isActive: true,
  },
  {
    id: 'mountain-fallback', title: 'Knuckles Mist Valley Trek', category: 'Tour', targetId: 'target-3',
    originalPriceLKR: 50000, offerPriceLKR: 40000, startDate: '2026-01-01', endDate: '2027-01-01', isActive: true,
  },
];

describe('Offers imagery', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => offers }));
  });

  afterEach(() => vi.unstubAllGlobals());

  it('prefers each offer ImageUrl and assigns distinct contextual fallbacks when it is absent', async () => {
    const { container } = render(<Offers />);

    await screen.findByText('Trincomalee Catamaran Escape');

    const media = container.querySelectorAll('.offer-card-media');
    expect(media[0].style.backgroundImage).toContain('cdn.tripora.test/trincomalee.jpg');
    expect(media[1].style.backgroundImage).toContain('1516426122078-c23e76319801');
    expect(media[2].style.backgroundImage).toContain('1464822759023-fed622ff2c3b');
    expect(media[1].style.backgroundImage).not.toEqual(media[2].style.backgroundImage);

    fireEvent.click(screen.getByText('Trincomalee Catamaran Escape').closest('.offer-privilege-card'));
    await waitFor(() => expect(screen.getByTestId('booking-image-target-1').textContent).toContain('cdn.tripora.test/trincomalee.jpg'));
  });
});
