import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import PaymentPage from './PaymentPage';
import { formatBookingRef } from '../utils/formatters';

const mockNavigate = vi.fn();
let mockParams = { bookingId: 'b-999' };
let mockLocation = {
  state: {
    bookingId: 'b-999',
    guestName: 'John Doe',
    tourName: 'Santorini Sunset',
    totalAmount: 2400,
    quantity: 2,
    bookingType: 'Tour',
    travelDate: '2026-10-15'
  }
};

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
    useLocation: () => mockLocation
  };
});

describe('PaymentPage Component - Process Booking Payment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockParams = { bookingId: 'b-999' };
    mockLocation = {
      state: {
        bookingId: 'b-999',
        guestName: 'John Doe',
        tourName: 'Santorini Sunset',
        totalAmount: 2400,
        quantity: 2,
        bookingType: 'Tour',
        travelDate: '2026-10-15'
      }
    };
  });

  it('renders booking summary correctly without raw UUID badge', () => {
    render(<PaymentPage />);

    expect(screen.getByText('Santorini Sunset')).toBeInTheDocument();
    expect(screen.queryByText('b-999')).not.toBeInTheDocument();
    expect(screen.queryByText('ID:')).not.toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('$2,400 USD')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pay \$2,400 USD/i })).toBeInTheDocument();
  });

  it('formats card number with spaces and expiry date with slash', () => {
    render(<PaymentPage />);

    const cardInput = screen.getByPlaceholderText('1234 5678 9012 3456');
    fireEvent.change(cardInput, { target: { value: '4242111122223333' } });
    expect(cardInput.value).toBe('4242 1111 2222 3333');

    const expiryInput = screen.getByPlaceholderText('MM/YY');
    fireEvent.change(expiryInput, { target: { value: '1228' } });
    expect(expiryInput.value).toBe('12/28');
  });

  it('keeps Pay Now button disabled until all validation checks pass', () => {
    render(<PaymentPage />);

    const payBtn = screen.getByRole('button', { name: /Pay \$2,400 USD/i });
    expect(payBtn).toBeDisabled();

    const cardInput = screen.getByPlaceholderText('1234 5678 9012 3456');
    fireEvent.change(cardInput, { target: { value: '123' } });
    const expiryInput = screen.getByPlaceholderText('MM/YY');
    const cvvInput = screen.getByPlaceholderText('123');

    // Button disabled when incomplete
    expect(payBtn).toBeDisabled();

    // Fill valid card details (4242... passes Luhn, 12/28 is future, 456 is 3 digits)
    fireEvent.change(cardInput, { target: { value: '4242 4242 4242 4242' } });
    expect(payBtn).toBeDisabled();

    fireEvent.change(expiryInput, { target: { value: '12/28' } });
    expect(payBtn).toBeDisabled();

    fireEvent.change(cvvInput, { target: { value: '456' } });
    expect(payBtn).not.toBeDisabled();
  });

  it('displays inline red error messages when invalid card details are blurred', () => {
    render(<PaymentPage />);

    const cardInput = screen.getByPlaceholderText('1234 5678 9012 3456');
    const expiryInput = screen.getByPlaceholderText('MM/YY');
    const cvvInput = screen.getByPlaceholderText('123');

    // Invalid card number (fails Luhn checksum)
    fireEvent.change(cardInput, { target: { value: '4242 4242 4242 4241' } });
    fireEvent.blur(cardInput);
    expect(screen.getByText(/checksum failed/i)).toBeInTheDocument();

    // Expired date in past
    fireEvent.change(expiryInput, { target: { value: '01/20' } });
    fireEvent.blur(expiryInput);
    expect(screen.getByText(/Card has expired/i)).toBeInTheDocument();

    // Invalid CVV
    fireEvent.change(cvvInput, { target: { value: '1' } });
    fireEvent.blur(cvvInput);
    expect(screen.getByText(/CVV must be 3 or 4 digits/i)).toBeInTheDocument();
  });

  it('detects card brand dynamically and highlights active brand', () => {
    render(<PaymentPage />);

    const cardInput = screen.getByPlaceholderText('1234 5678 9012 3456');
    fireEvent.change(cardInput, { target: { value: '4242 4242 4242 4242' } });

    const visaPill = screen.getByText('VISA');
    expect(visaPill).toHaveClass('active');
  });

  it('submits payment and shows clean Payment Confirmed success screen with reference ID', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        id: '00000000-0000-0000-0000-000000000001',
        transactionId: 'TXN-ABC123XYZ',
        status: 'Success'
      })
    });

    render(<PaymentPage />);

    const cardInput = screen.getByPlaceholderText('1234 5678 9012 3456');
    const expiryInput = screen.getByPlaceholderText('MM/YY');
    const cvvInput = screen.getByPlaceholderText('123');
    const payBtn = screen.getByRole('button', { name: /Pay \$2,400 USD/i });

    fireEvent.change(cardInput, { target: { value: '4242 4242 4242 4242' } });
    fireEvent.change(expiryInput, { target: { value: '12/28' } });
    fireEvent.change(cvvInput, { target: { value: '456' } });

    expect(payBtn).not.toBeDisabled();
    fireEvent.click(payBtn);

    await waitFor(() => {
      expect(screen.getByText('Payment Confirmed!')).toBeInTheDocument();
    });

    expect(screen.getByText('TXN-ABC123XYZ')).toBeInTheDocument();
    expect(screen.queryByText('#b-999')).not.toBeInTheDocument();
    expect(screen.getByText('TRP-B999')).toBeInTheDocument();
    expect(screen.getByText('PAID & CONFIRMED')).toBeInTheDocument();
    expect(screen.getByText('$2,400 USD')).toBeInTheDocument();
    expect(screen.getByText(/Credit Card \(•••• 4242\)/i)).toBeInTheDocument();

    // Verify Return to Home navigation
    const returnHomeBtn = screen.getByRole('button', { name: /Return to Home/i });
    fireEvent.click(returnHomeBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('shows decline error banner when payment is declined and retains booking details', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({
        message: 'Payment declined by payment provider.'
      })
    });

    render(<PaymentPage />);

    const cardInput = screen.getByPlaceholderText('1234 5678 9012 3456');
    const expiryInput = screen.getByPlaceholderText('MM/YY');
    const cvvInput = screen.getByPlaceholderText('123');
    const payBtn = screen.getByRole('button', { name: /Pay \$2,400 USD/i });

    fireEvent.change(cardInput, { target: { value: '4000 0000 0000 0000' } });
    // 4111 1111 1117 0000 is a 16-digit card ending in 0000 that passes the Luhn checksum
    fireEvent.change(cardInput, { target: { value: '4111 1111 1117 0000' } });
    fireEvent.change(expiryInput, { target: { value: '12/28' } });
    fireEvent.change(cvvInput, { target: { value: '000' } });
    fireEvent.change(cvvInput, { target: { value: '123' } });

    expect(payBtn).not.toBeDisabled();
    fireEvent.click(payBtn);

    await waitFor(() => {
      expect(screen.getByText(/Payment declined by payment provider/i)).toBeInTheDocument();
    });

    // Verify booking summary details are retained
    expect(screen.getByText('Santorini Sunset')).toBeInTheDocument();
    expect(screen.getByText('$2,400 USD')).toBeInTheDocument();
  });

  it('shows warning banner advising user not to refresh when network timeout occurs', async () => {
    const abortErr = new Error('The user aborted a request.');
    abortErr.name = 'AbortError';
    global.fetch = vi.fn().mockRejectedValue(abortErr);

    render(<PaymentPage />);

    const cardInput = screen.getByPlaceholderText('1234 5678 9012 3456');
    const expiryInput = screen.getByPlaceholderText('MM/YY');
    const cvvInput = screen.getByPlaceholderText('123');
    const payBtn = screen.getByRole('button', { name: /Pay \$2,400 USD/i });

    fireEvent.change(cardInput, { target: { value: '4242 4242 4242 4242' } });
    fireEvent.change(expiryInput, { target: { value: '12/28' } });
    fireEvent.change(cvvInput, { target: { value: '456' } });

    fireEvent.click(payBtn);

    await waitFor(() => {
      expect(screen.getByText(/Network timeout or connection issue. Please do not refresh the page/i)).toBeInTheDocument();
    });

    // Booking details still intact
    expect(screen.getByText('Santorini Sunset')).toBeInTheDocument();
  });

  describe('formatBookingRef Helper', () => {
    it('formats UUIDs and alphanumeric IDs into short customer-friendly reference codes', () => {
      expect(formatBookingRef('2d1e0ce2-b6bd-473f-9f15-e262040f6190')).toBe('TRP-2D1E0C');
      expect(formatBookingRef('b-999')).toBe('TRP-B999');
      expect(formatBookingRef('')).toBe('TRP-000000');
      expect(formatBookingRef(null)).toBe('TRP-000000');
    });

    it('ensures raw UUID badge is not rendered on checkout and formatted code is on confirmation', async () => {
      mockParams = { bookingId: '3fa85f64-5717-4562-b3fc-2c963f66afa6' };
      mockLocation = {
        state: {
          bookingId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          guestName: 'Jane Smith',
          tourName: 'Alpine Glacier Explorer',
          totalAmount: 3200
        }
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          transactionId: 'TXN-ALPINE999',
          status: 'Success'
        })
      });

      render(<PaymentPage />);

      // Checkout screen: raw UUID must NOT be displayed
      expect(screen.queryByText('3fa85f64-5717-4562-b3fc-2c963f66afa6')).not.toBeInTheDocument();
      expect(screen.queryByText('ID:')).not.toBeInTheDocument();

      // Submit payment
      const cardInput = screen.getByPlaceholderText('1234 5678 9012 3456');
      const expiryInput = screen.getByPlaceholderText('MM/YY');
      const cvvInput = screen.getByPlaceholderText('123');
      const payBtn = screen.getByRole('button', { name: /Pay \$3,200 USD/i });

      fireEvent.change(cardInput, { target: { value: '4242 4242 4242 4242' } });
      fireEvent.change(expiryInput, { target: { value: '12/28' } });
      fireEvent.change(cvvInput, { target: { value: '456' } });

      fireEvent.click(payBtn);

      await waitFor(() => {
        expect(screen.getByText('Payment Confirmed!')).toBeInTheDocument();
      });

      // Confirmation screen: must display customer-friendly reference code
      expect(screen.getByText('TRP-3FA85F')).toBeInTheDocument();
      // Raw UUID must NOT be displayed as the confirmation number
      expect(screen.queryByText('#3fa85f64-5717-4562-b3fc-2c963f66afa6')).not.toBeInTheDocument();
    });
  });
});
