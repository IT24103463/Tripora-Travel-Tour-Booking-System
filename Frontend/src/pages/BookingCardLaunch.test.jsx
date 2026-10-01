import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Offers from './Offers';
import TravelPackages from './TravelPackages';

const travelPackage = {
  id: 'package-1',
  name: 'Ella Cloud Forest Escape',
  description: 'A private highland escape.',
  destination: 'Ella, Sri Lanka',
  packageType: 'CoupleEscape',
  priceLKR: 36000,
  durationDays: 3,
  imageUrl: 'https://example.test/ella.jpg',
  inclusions: [],
  minGuests: 2,
  maxGuests: 6,
};

const offer = {
  id: 'offer-1',
  targetId: 'package-1',
  title: 'Ella Private Escape Offer',
  category: 'Package',
  originalPriceLKR: 45000,
  offerPriceLKR: 36000,
  discountPercentage: 20,
  imageUrl: 'https://example.test/offer.jpg',
  startDate: '2026-01-01',
  endDate: '2027-01-01',
};

describe('booking card launches', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn((url) => Promise.resolve({
      ok: true,
      json: async () => String(url).includes('/api/offers') ? [offer] : [travelPackage],
    })));
  });

  afterEach(() => vi.unstubAllGlobals());

  it('opens the unified booking modal with the selected package when its card is clicked', async () => {
    render(<MemoryRouter><TravelPackages /></MemoryRouter>);

    const title = await screen.findByText('Ella Cloud Forest Escape');
    fireEvent.click(title.closest('.package-card'));

    expect(await screen.findByRole('heading', { name: 'Complete Your Booking' })).toBeInTheDocument();
    expect(document.querySelector('.unified-booking-modal')).toHaveTextContent('Ella Cloud Forest Escape');
    expect(document.querySelector('.unified-booking-modal')).toHaveTextContent('LKR 36,000');
  });

  it('opens the unified booking modal with the selected offer when its card is clicked', async () => {
    render(<MemoryRouter><Offers /></MemoryRouter>);

    const title = await screen.findByText('Ella Private Escape Offer');
    fireEvent.click(title.closest('.offer-privilege-card'));

    expect(await screen.findByRole('heading', { name: 'Complete Your Booking' })).toBeInTheDocument();
    expect(document.querySelector('.unified-booking-modal')).toHaveTextContent('Ella Private Escape Offer');
    expect(document.querySelector('.unified-booking-modal')).toHaveTextContent('LKR 36,000');
  });
});
