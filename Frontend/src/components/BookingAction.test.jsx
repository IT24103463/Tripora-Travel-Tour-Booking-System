import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import BookingAction from './BookingAction';

const packageItem = {
  id: 'package-1',
  bookingType: 'Package',
  name: 'Ella Cloud Forest Escape',
  destination: 'Ella, Sri Lanka',
  description: 'A private highland escape with considered local experiences.',
  imageUrl: 'https://example.test/ella.jpg',
  durationDays: 3,
  minGuests: 2,
  maxGuests: 6,
  priceLKR: 36000,
};

describe('BookingAction', () => {
  it('opens the unified package booking modal with a cover, four booking specs, and the booking form', () => {
    render(
      <MemoryRouter>
        <BookingAction item={packageItem} label="Book package" />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Book package' }));

    const modal = document.querySelector('.unified-booking-modal');
    expect(modal).not.toBeNull();
    expect(modal?.querySelector('.modal-hero-cover img')?.getAttribute('src')).toBe(packageItem.imageUrl);
    expect(modal?.querySelectorAll('.modal-spec-grid-2x2 .spec-card-cell')).toHaveLength(4);
    expect(modal?.querySelectorAll('.spec-svg')).toHaveLength(5);
    expect(modal?.querySelectorAll('.pin-svg')).toHaveLength(1);
    expect(screen.getByRole('heading', { name: 'Complete Your Booking' })).toBeTruthy();
    expect(screen.getByLabelText('TRAVEL DATE')).toBeTruthy();
    expect(screen.getByLabelText('NUMBER OF PARTICIPANTS')).toBeTruthy();
    expect(screen.getByLabelText('GUEST FULL NAME')).toBeTruthy();
  });

  it('does not bubble a modal close into the clickable card that opened it', () => {
    const onCardClick = vi.fn();
    render(
      <MemoryRouter>
        <div onClick={onCardClick}>
          <BookingAction item={packageItem} label="Book package" />
        </div>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Book package' }));
    fireEvent.click(document.querySelector('.modal-docked-close-btn'));

    expect(onCardClick).not.toHaveBeenCalled();
    expect(document.querySelector('.unified-booking-modal')).toBeNull();
  });

  it('closes only when the backdrop itself is pressed and does not leak that event to the card', () => {
    const onCardClick = vi.fn();
    render(
      <MemoryRouter>
        <div onClick={onCardClick}>
          <BookingAction item={packageItem} label="Book package" />
        </div>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Book package' }));
    fireEvent.mouseDown(document.querySelector('.unified-modal-overlay'));

    expect(onCardClick).not.toHaveBeenCalled();
    expect(document.querySelector('.unified-booking-modal')).toBeNull();
  });

  it('uses the themed date picker instead of the browser date control', () => {
    render(
      <MemoryRouter>
        <BookingAction item={packageItem} label="Book package" />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Book package' }));

    expect(document.querySelector('#booking-travel-date input[type="date"]')).toBeNull();
    expect(document.querySelector('#booking-travel-date .glass-datepicker-input-box')).not.toBeNull();
  });

  it('formats selected dates as DD/MM/YYYY and dismisses only the calendar when clicking outside it', () => {
    render(
      <MemoryRouter>
        <BookingAction item={packageItem} label="Book package" />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Book package' }));
    const datePicker = document.querySelector('#booking-travel-date .glass-datepicker-input-box');
    fireEvent.click(datePicker);
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
    fireEvent.click(screen.getByRole('button', { name: '28' }));

    expect(datePicker.textContent).toMatch(/28\/\d{2}\/\d{4}/);

    fireEvent.click(datePicker);
    expect(document.querySelector('.glass-calendar-dropdown')).not.toBeNull();
    fireEvent.mouseDown(document.body);
    expect(document.querySelector('.glass-calendar-dropdown')).toBeNull();
    expect(document.querySelector('.unified-booking-modal')).not.toBeNull();
  });

  it('serializes a DD/MM/YYYY selection to the booking API datetime format', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ bookingId: 'booking-1', data: { totalAmount: 36000 } }),
    });
    localStorage.setItem('tripora_token', 'test-token');

    render(
      <MemoryRouter>
        <BookingAction item={packageItem} label="Book package" />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Book package' }));
    const datePicker = document.querySelector('#booking-travel-date .glass-datepicker-input-box');
    fireEvent.click(datePicker);
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }));
    fireEvent.click(screen.getByRole('button', { name: '28' }));
    fireEvent.change(screen.getByLabelText('GUEST FULL NAME'), { target: { value: 'Asha Perera' } });
    fireEvent.change(screen.getByLabelText('PHONE NUMBER'), { target: { value: '+94771234567' } });
    fireEvent.change(screen.getByLabelText('BILLING ADDRESS'), { target: { value: 'Colombo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Book Now' }));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    const payload = JSON.parse(fetchSpy.mock.calls[0][1].body);
    const [, month, year] = datePicker.textContent.match(/28\/(\d{2})\/(\d{4})/);
    expect(payload.travelDate).toBe(`${year}-${month}-28T00:00:00`);

    fetchSpy.mockRestore();
    localStorage.removeItem('tripora_token');
  });
});
