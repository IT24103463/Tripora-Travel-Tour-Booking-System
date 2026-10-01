import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import AdminLanding from './AdminLanding';

function NavigationState() {
  const location = useLocation();
  return <output data-testid="navigation-state">{`${location.pathname}:${location.state?.activeModule || ''}`}</output>;
}

describe('AdminLanding', () => {
  it('presents the management gateway and dashboard launch link', () => {
    render(
      <MemoryRouter>
        <AdminLanding />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Sanctuary Management & Operations' })).toBeInTheDocument();
    expect(screen.getByText('SERVICES OPERATIONAL')).toBeInTheDocument();
    expect(screen.getByText('Confirmed Expeditions')).toBeInTheDocument();
    expect(screen.getByText('Active records')).toBeInTheDocument();
    expect(screen.getByText('Active Offers')).toBeInTheDocument();
    expect(screen.getByText('Live in DB')).toBeInTheDocument();
    expect(screen.getByText('Concierge Inquiries')).toBeInTheDocument();
    expect(screen.getByText('IMAP Queue')).toBeInTheDocument();
    expect(screen.queryByText('Encrypted JWT / TLS 1.3')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Go to Dashboard/i })).toHaveAttribute('href', '/admin/dashboard');
    expect(screen.getByRole('img', { name: 'Tripora Admin Landscape' })).toHaveAttribute('src', '/images/admin-bg.jpg');
    expect(document.querySelector('.admin-brand-group .brand-plane-icon')).not.toBeNull();
    expect(screen.getByText('Travel & Tours')).toBeInTheDocument();
  });

  it('uses the same status-badge content pattern for every metric', () => {
    render(
      <MemoryRouter>
        <AdminLanding />
      </MemoryRouter>,
    );

    expect(screen.getByText('Active records')).toBeInTheDocument();
    expect(screen.getByText('Live in DB')).toBeInTheDocument();
    expect(screen.getByText('IMAP Queue')).toBeInTheDocument();
  });

  it.each([
    ['CONFIRMED EXPEDITIONS', 'bookings'],
    ['ACTIVE OFFERS', 'offers'],
    ['CONCIERGE INQUIRIES', 'inquiries'],
  ])('opens the %s dashboard section when its metric card is selected', async (cardName, activeModule) => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <AdminLanding />
        <NavigationState />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: cardName }));

    expect(screen.getByTestId('navigation-state')).toHaveTextContent(`/admin/dashboard:${activeModule}`);
  });
});
