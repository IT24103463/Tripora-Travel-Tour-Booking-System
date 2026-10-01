import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

const renderWithRouter = (element) => render(<MemoryRouter>{element}</MemoryRouter>);

describe('auth verification integration', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('opens verification after a successful registration that requires email verification', async () => {
    const onVerificationRequired = vi.fn();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 201,
      json: async () => ({ success: true, data: { email: 'new.traveler@example.com', verificationRequired: true } }),
    }));
    render(<RegisterForm onSwitchToLogin={vi.fn()} onVerificationRequired={onVerificationRequired} />);

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'New Traveler' } });
    fireEvent.change(screen.getByLabelText(/^email address/i), { target: { value: 'new.traveler@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'Verification123!' } });
    fireEvent.change(document.getElementById('confirmPassword'), { target: { value: 'Verification123!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Customer Account' }));

    await waitFor(() => expect(onVerificationRequired).toHaveBeenCalledWith('new.traveler@example.com'));
  });

  it('offers Verify Email Now without a retry action when login is blocked pending verification', async () => {
    const onVerificationRequired = vi.fn();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 403,
      json: async () => ({
        message: 'Please verify your email address before signing in.',
        isUnverified: true,
        email: 'pending@example.com',
      }),
    }));
    renderWithRouter(<LoginForm onLoginSuccess={vi.fn()} onSwitchToRegister={vi.fn()} onVerificationRequired={onVerificationRequired} />);

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'pending@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'Verification123!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In to Tripora' }));

    expect(await screen.findByText('Please verify your email address before signing in.')).toBeInTheDocument();
    expect(onVerificationRequired).not.toHaveBeenCalled();

    expect(screen.queryByRole('button', { name: /Try Again/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Verify Email Now →' }));

    expect(onVerificationRequired).toHaveBeenCalledWith('pending@example.com', {
      resetLogin: true,
      initialResendAfter: 0,
      autoResend: true,
    });
  });

  it('offers Verify Email Now for a legacy 403 verification message without metadata', async () => {
    const onVerificationRequired = vi.fn();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 403,
      json: async () => ({
        message: 'Please verify your email address before signing in.',
      }),
    }));
    renderWithRouter(<LoginForm onLoginSuccess={vi.fn()} onSwitchToRegister={vi.fn()} onVerificationRequired={onVerificationRequired} />);

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'legacy@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'Verification123!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In to Tripora' }));

    expect(await screen.findByText('Please verify your email address before signing in.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Verify Email Now/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Try Again/i })).not.toBeInTheDocument();
  });
});
