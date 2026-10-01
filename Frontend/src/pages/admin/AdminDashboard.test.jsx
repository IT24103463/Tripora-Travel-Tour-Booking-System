import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import AdminDashboard from './AdminDashboard';

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={['/admin/dashboard']}>
      <Routes>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin" element={<div>Admin Gateway</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('AdminDashboard shell', () => {
  it('switches modules and returns to the gateway', () => {
    renderDashboard();

    expect(screen.getByText('Tripora')).toBeTruthy();
    expect(screen.getByText('Travel & Tours')).toBeTruthy();
    expect(document.querySelectorAll('.rail-svg-icon')).toHaveLength(7);
    expect(screen.getByText('Live').className).toContain('rail-tag-teal');
    expect(screen.queryByText('TLS 1.3 / AES-256')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Executive Command Pulse' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Reservation Ledger/ }));
    expect(screen.getByRole('heading', { name: 'Expedition Reservations' })).toBeTruthy();

    expect(screen.getByRole('button', { name: 'Sign Out' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Return to Admin Landing' }));
    expect(screen.getByText('Admin Gateway')).toBeTruthy();
  });
});
