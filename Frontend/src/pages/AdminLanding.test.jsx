import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import AdminLanding from './AdminLanding';

describe('AdminLanding', () => {
  it('presents the management gateway and dashboard launch link', () => {
    render(
      <MemoryRouter>
        <AdminLanding />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Sanctuary Management & Operations' })).toBeInTheDocument();
    expect(screen.getByText('SERVICES OPERATIONAL')).toBeInTheDocument();
    expect(screen.queryByText('Confirmed Expeditions')).not.toBeInTheDocument();
    expect(screen.queryByText('Active Offers')).not.toBeInTheDocument();
    expect(screen.queryByText('Concierge Inquiries')).not.toBeInTheDocument();
    expect(screen.queryByText('Encrypted JWT / TLS 1.3')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Go to Dashboard/i })).toHaveAttribute('href', '/admin/dashboard');
    expect(screen.getByRole('img', { name: 'Tripora Admin Landscape' })).toHaveAttribute('src', '/images/admin-bg.jpg');
    expect(document.querySelector('.admin-brand-group .brand-plane-icon')).not.toBeNull();
    expect(screen.getByText('Travel & Tours')).toBeInTheDocument();
  });
});
