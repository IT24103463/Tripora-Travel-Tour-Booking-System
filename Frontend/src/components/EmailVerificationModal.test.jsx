import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../api/apiClient', () => ({
  default: { post: vi.fn() },
}));

import api from '../api/apiClient';
import EmailVerificationModal from './EmailVerificationModal';

describe('EmailVerificationModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits a pasted six-digit code and notifies the verified callback', async () => {
    const session = {
      token: 'verified-session-token',
      user: { id: 'traveler-id', email: 'traveler@example.com', role: 'Customer' },
    };
    api.post.mockResolvedValue({ data: { success: true, data: session } });
    const onVerified = vi.fn();
    render(<EmailVerificationModal email="traveler@example.com" onVerified={onVerified} onClose={vi.fn()} />);

    fireEvent.paste(screen.getByLabelText('Verification digit 1'), {
      clipboardData: { getData: () => '123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Verify email' }));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/users/verify-email', {
      email: 'traveler@example.com',
      code: '123456',
    }));
    expect(onVerified).toHaveBeenCalledWith(session);
  });

  it('keeps the modal open and displays an API verification error', async () => {
    api.post.mockRejectedValue({ response: { data: { message: 'This verification code has expired.' } } });
    render(<EmailVerificationModal email="traveler@example.com" onVerified={vi.fn()} onClose={vi.fn()} />);

    fireEvent.paste(screen.getByLabelText('Verification digit 1'), {
      clipboardData: { getData: () => '123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Verify email' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('This verification code has expired.');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('guides travelers to check their Spam or Junk folder', () => {
    render(<EmailVerificationModal email="traveler@example.com" onVerified={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByText(/Spam or Junk/i)).toBeInTheDocument();
  });

  it('requests a fresh code once when opened from the Verify Email Now action', async () => {
    api.post.mockResolvedValue({ data: { success: true, data: { retryAfterSeconds: 60 } } });

    render(<EmailVerificationModal email="traveler@example.com" onVerified={vi.fn()} onClose={vi.fn()} autoResend />);

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/users/resend-verification', {
      email: 'traveler@example.com',
    }));
    expect(await screen.findByRole('status')).toHaveTextContent(/new verification code has been requested/i);
  });
});
