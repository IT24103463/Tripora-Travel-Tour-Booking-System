import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../api/apiClient', () => ({
  default: { get: vi.fn() },
}));

import CustomerHome from './CustomerHome';
import api from '../api/apiClient';

describe('CustomerHome', () => {
  const renderHome = (withRoutes = false) => render(
    <MemoryRouter>
      {withRoutes ? <Routes><Route path="/" element={<CustomerHome user={{ fullName: 'Nimesh DK' }} onNavigate={vi.fn()} />} /><Route path="/offers" element={<p>Offers route</p>} /></Routes> : <CustomerHome user={{ fullName: 'Nimesh DK' }} onNavigate={vi.fn()} />}
    </MemoryRouter>,
  );

  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({ data: [] });
  });

  it('centers the member-experience wording in its dedicated footer wrapper', () => {
    renderHome();

    const wording = screen.getByText('Welcome to your member experience');
    const wrapper = wording.closest('.welcome-banner-header');
    expect(wrapper).not.toBeNull();
    expect(wrapper?.classList.contains('text-center')).toBe(true);
  });

  it('ranks the three largest active savings, omits prices, and links cards to offers', async () => {
    api.get.mockResolvedValue({ data: { data: [
      { id: 'small', title: 'Small Saving', isActive: true, originalPriceLKR: 80000, offerPriceLKR: 70000, discountPercentage: 12 },
      { id: 'exclusive', title: 'Private Coast Escape', isActive: true, originalPriceLKR: 125000, offerPriceLKR: 70000, discountPercentage: 25, isExclusive: true, badgeText: 'Coastal Privilege', specialInclusions: 'Private charter' },
      { id: 'second', title: 'Highland Retreat', isActive: true, originalPriceLKR: 100000, offerPriceLKR: 45000, discountPercentage: 20 },
      { id: 'third', title: 'Wildlife Sanctuary', isActive: true, originalPriceLKR: 90000, offerPriceLKR: 40000, discountPercentage: 18 },
      { id: 'inactive', title: 'Inactive Offer', isActive: false, originalPriceLKR: 200000, offerPriceLKR: 1, discountPercentage: 90 },
    ] } });
    renderHome(true);

    expect(await screen.findByText('Private Coast Escape')).toBeInTheDocument();
    expect(screen.getByText('Highland Retreat')).toBeInTheDocument();
    expect(screen.getByText('Wildlife Sanctuary')).toBeInTheDocument();
    expect(screen.queryByText('Small Saving')).not.toBeInTheDocument();
    expect(screen.queryByText('Inactive Offer')).not.toBeInTheDocument();
    expect(screen.getByText('EXCLUSIVE')).toBeInTheDocument();
    expect(screen.getByText('25% OFF')).toBeInTheDocument();
    expect(screen.queryByText(/LKR/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: /Private Coast Escape/i }));
    expect(await screen.findByText('Offers route')).toBeInTheDocument();
  });

  it('uses contextual fallback photos and omits redundant card footer metadata', async () => {
    api.get.mockResolvedValue({ data: [
      { id: 'coast', title: 'Trincomalee Catamaran Escape', category: 'Tour', isActive: true, discountPercentage: 30, originalPriceLKR: 120000, offerPriceLKR: 80000, badgeText: 'Coastal Privilege' },
      { id: 'safari', title: 'Yala Leopard Safari', category: 'Tour', isActive: true, discountPercentage: 25, originalPriceLKR: 100000, offerPriceLKR: 70000 },
      { id: 'mist', title: 'Knuckles Mist Valley', category: 'Package', isActive: true, discountPercentage: 20, originalPriceLKR: 90000, offerPriceLKR: 65000 },
    ] });
    renderHome();

    const trincomaleeImage = await screen.findByAltText('Trincomalee Catamaran Escape');
    expect(trincomaleeImage).toHaveAttribute('src', expect.stringContaining('1507525428034-b723cf961d3e'));
    expect(trincomaleeImage).toHaveAttribute('referrerpolicy', 'no-referrer');
    expect(screen.getByAltText('Yala Leopard Safari')).toHaveAttribute('src', expect.stringContaining('1516426122078-c23e76319801'));
    expect(screen.getByAltText('Knuckles Mist Valley')).toHaveAttribute('src', expect.stringContaining('1464822759023-fed622ff2c3b'));
    fireEvent.error(trincomaleeImage);
    expect(trincomaleeImage).toHaveAttribute('src', expect.stringContaining('/images/admin-bg.jpg'));
    expect(screen.queryByText('Explore privilege')).not.toBeInTheDocument();
    expect(screen.queryByText('Coastal Privilege')).not.toBeInTheDocument();
  });
});
