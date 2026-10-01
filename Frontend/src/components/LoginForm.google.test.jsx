import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginForm from './LoginForm';

describe('LoginForm Google sign-in', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
    Element.prototype.scrollIntoView = vi.fn();
    window.google = {
      accounts: {
        id: {
          initialize: vi.fn(({ callback }) => { window.googleCredentialCallback = callback; }),
          prompt: vi.fn(() => window.googleCredentialCallback({ credential: 'google-id-token' })),
        },
      },
    };
  });

  it('exchanges a Google credential for the existing Tripora login handoff', async () => {
    const onLoginSuccess = vi.fn();
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { token: 'header.eyJleHAiOjQxMDI0NDQ4MDB9.signature', user: { email: 'traveler@example.com', role: 'Customer' } } }),
    });

    render(<MemoryRouter><LoginForm googleClientId="google-client-id" onLoginSuccess={onLoginSuccess} onSwitchToRegister={vi.fn()} /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }));

    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/users/google-login'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: 'google-id-token' }),
      }),
    ));
    expect(onLoginSuccess).toHaveBeenCalledWith('header.eyJleHAiOjQxMDI0NDQ4MDB9.signature', { email: 'traveler@example.com', role: 'Customer' });
  });

  it('shows a failure message when the Google identity library is unavailable', () => {
    delete window.google;
    render(<MemoryRouter><LoginForm googleClientId="google-client-id" onLoginSuccess={vi.fn()} onSwitchToRegister={vi.fn()} /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }));
    expect(screen.getByText('Google Sign-In is still loading. Please try again.')).toBeInTheDocument();
  });
});
