import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { getLoginDestination, isAdminUser } from './App';
import App from './App';
import api from './api/apiClient';

describe('getLoginDestination', () => {
  it('sends administrators to the gateway despite a saved dashboard redirect', () => {
    expect(getLoginDestination({ role: 'Admin' }, '/admin/dashboard')).toBe('/admin');
    expect(getLoginDestination({ role: 'admin' }, '/admin/dashboard')).toBe('/admin');
  });

  it('sends customers to the landing page instead of a saved profile redirect', () => {
    expect(getLoginDestination({ role: 'Customer' }, '/profile')).toBe('/');
  });
});

describe('isAdminUser', () => {
  it('recognizes the supported Admin and admin role values', () => {
    expect(isAdminUser({ role: 'Admin' })).toBe(true);
    expect(isAdminUser({ role: 'admin' })).toBe(true);
  });
});

describe('authenticated admin fallback', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    const tokenPayload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
    localStorage.setItem('tripora_token', `header.${tokenPayload}.signature`);
    localStorage.setItem('tripora_user', JSON.stringify({ role: 'Admin', fullName: 'Console User' }));
  });

  it('returns an administrator to the gateway instead of rendering the dashboard for an unmatched path', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/legacy']}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: /Sanctuary Management & Operations/i })).toBeTruthy();
  });
});

describe('unauthenticated navigation', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('opens login when a visitor clicks an internal navigation tab', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('link', { name: 'Travel Packages' }));

    expect(await screen.findByRole('heading', { name: 'Customer Sign In' })).toBeTruthy();
  });

  it('redirects a visitor opening a payment URL directly to login', async () => {
    render(
      <MemoryRouter initialEntries={['/payment/booking-123']}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'Customer Sign In' })).toBeTruthy();
  });
});

describe('sent inquiries route', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.spyOn(api, 'get').mockResolvedValue({ data: [] });
  });

  it('requires authentication when opened directly', async () => {
    render(
      <MemoryRouter initialEntries={['/my-inquiries']}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'Customer Sign In' })).toBeTruthy();
    expect(api.get).not.toHaveBeenCalled();
  });

  it('renders for an authenticated customer', async () => {
    const tokenPayload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }));
    localStorage.setItem('tripora_token', `header.${tokenPayload}.signature`);
    localStorage.setItem('tripora_user', JSON.stringify({ role: 'Customer', fullName: 'Traveler' }));

    render(
      <MemoryRouter initialEntries={['/my-inquiries']}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole('heading', { name: 'Sent Inquiries' })).toBeTruthy();
    expect(api.get).toHaveBeenCalledWith('/inquiries/my');
  });
});
