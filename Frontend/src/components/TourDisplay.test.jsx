import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import TourDisplay from './TourDisplay';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Mock the global fetch
const mockTours = [
  {
    id: '1',
    name: 'Paris Adventure',
    description: 'Explore the city of lights',
    destination: 'Paris, France',
    price: 1500,
    durationDays: 5,
    capacity: 20,
    availableSlots: 15,
    isActive: true,
    imageUrl: 'paris.jpg'
  },
  {
    id: '2',
    name: 'Rome Getaway',
    description: 'Historic tour of Rome',
    destination: 'Rome, Italy',
    price: 1200,
    durationDays: 4,
    capacity: 15,
    availableSlots: 5,
    isActive: true,
    imageUrl: 'rome.jpg'
  }
];

const mockHotels = [
  {
    id: '1',
    name: 'Grand Plaza Hotel',
    description: 'Luxury hotel in the center',
    location: 'Paris, France',
    pricePerNight: 200,
    availableRooms: 10,
    rating: 4.8,
    amenities: 'WiFi, Pool',
    isActive: true,
    imageUrl: 'plaza.jpg'
  }
];

describe('TourDisplay Component', () => {
  beforeEach(() => {
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/tours/active')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockTours })
        });
      }
      if (url.includes('/api/hotels')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockHotels)
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders all active tours on initial load', async () => {
    render(<TourDisplay />);
    
    // Wait for the tours to load
    await waitFor(() => {
      expect(screen.getByText('Paris Adventure')).toBeInTheDocument();
      expect(screen.getByText('Rome Getaway')).toBeInTheDocument();
    });
  });

  it('filters list accurately based on location/keyword search', async () => {
    render(<TourDisplay />);
    
    await waitFor(() => {
      expect(screen.getByText('Paris Adventure')).toBeInTheDocument();
    });

    // Search by keyword "Rome"
    const searchInput = screen.getByPlaceholderText('Search name or description...');
    fireEvent.change(searchInput, { target: { value: 'Rome' } });

    expect(screen.queryByText('Paris Adventure')).not.toBeInTheDocument();
    expect(screen.getByText('Rome Getaway')).toBeInTheDocument();

    // Reset and search by location "Paris"
    fireEvent.change(searchInput, { target: { value: '' } });
    const locationInput = screen.getByPlaceholderText('Filter by location...');
    fireEvent.change(locationInput, { target: { value: 'Paris' } });

    expect(screen.getByText('Paris Adventure')).toBeInTheDocument();
    expect(screen.queryByText('Rome Getaway')).not.toBeInTheDocument();
  });

  it('displays "No results found" when no records match', async () => {
    render(<TourDisplay />);
    
    await waitFor(() => {
      expect(screen.getByText('Paris Adventure')).toBeInTheDocument();
    });

    // Search for something that doesn't exist
    const searchInput = screen.getByPlaceholderText('Search name or description...');
    fireEvent.change(searchInput, { target: { value: 'NonExistentTour123' } });

    expect(screen.getByText('No results found')).toBeInTheDocument();
    expect(screen.queryByText('Paris Adventure')).not.toBeInTheDocument();
  });

  it('triggers fallback placeholder on image error', async () => {
    render(<TourDisplay />);
    
    await waitFor(() => {
      expect(screen.getByText('Paris Adventure')).toBeInTheDocument();
    });

    const image = screen.getByAltText('Paris Adventure');
    // The placeholder should initially be hidden (display: none via inline style)
    const placeholders = document.querySelectorAll('.tour-placeholder');
    
    // Fire the error event
    fireEvent.error(image);

    // Image display should be set to none
    expect(image.style.display).toBe('none');
    
    // Verify fallback placeholder logic triggered
    // Next sibling should be displayed flex
    expect(image.nextElementSibling.style.display).toBe('flex');
  });

  it('toggles to Hotels and renders hotels', async () => {
    render(<TourDisplay />);
    
    await waitFor(() => {
      expect(screen.getByText('Paris Adventure')).toBeInTheDocument();
    });

    const hotelsTab = screen.getByRole('button', { name: 'Hotels' });
    fireEvent.click(hotelsTab);

    await waitFor(() => {
      expect(screen.getByText('Grand Plaza Hotel')).toBeInTheDocument();
    });
  });

  it('renders hotel booking modal ready-to-book with no error banner even if destination service is unavailable', async () => {
    // Hotel list succeeds, but hotel details endpoint fails with 503 or network error
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/hotels/1')) {
        return Promise.reject(new Error('Destination service is currently unavailable. Please try again later.'));
      }
      if (url.includes('/api/hotels')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockHotels)
        });
      }
      if (url.includes('/api/tours/active')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockTours })
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<TourDisplay token="mock-token" user={{ fullName: 'John Doe', role: 'Customer' }} />);

    await waitFor(() => {
      expect(screen.getByText('Paris Adventure')).toBeInTheDocument();
    });

    const hotelsTab = screen.getByRole('button', { name: 'Hotels' });
    fireEvent.click(hotelsTab);

    await waitFor(() => {
      expect(screen.getByText('Grand Plaza Hotel')).toBeInTheDocument();
    });

    // Click hotel card to open modal
    fireEvent.click(screen.getByText('Grand Plaza Hotel'));

    // Modal title should appear
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: 'Grand Plaza Hotel' })).toBeInTheDocument();
    });

    // Click Book Now button
    const bookNowButton = screen.getByRole('button', { name: 'Book Now' });
    fireEvent.click(bookNowButton);

    // Form should render ready to book without error banner
    await waitFor(() => {
      expect(screen.getByText('Complete Your Booking')).toBeInTheDocument();
    });

    // Assert that destination service unavailable banner is NOT in the document
    expect(screen.queryByText(/Destination service is currently unavailable/i)).not.toBeInTheDocument();
  });

  it('submits booking with guest details and authorization header, redirecting to payment page', async () => {
    let bookingRequestBody = null;
    let bookingRequestHeaders = null;

    global.fetch = vi.fn((url, options) => {
      if (url.includes('/api/tours/active')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockTours })
        });
      }
      if (url.includes('/api/booking')) {
        bookingRequestBody = JSON.parse(options.body);
        bookingRequestHeaders = options.headers;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Booking confirmed.', bookingId: 'b-123' })
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<TourDisplay token="test-jwt-token" user={{ fullName: 'Alice Smith', phoneNumber: '+94771234567', address: '789 Pine Rd, Seattle', role: 'Customer' }} />);

    await waitFor(() => {
      expect(screen.getByText('Paris Adventure')).toBeInTheDocument();
    });

    // Open Paris Adventure modal
    fireEvent.click(screen.getByText('Paris Adventure'));

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: 'Paris Adventure' })).toBeInTheDocument();
    });

    // Click Book Now
    fireEvent.click(screen.getByRole('button', { name: 'Book Now' }));

    await waitFor(() => {
      expect(screen.getByText('Complete Your Booking')).toBeInTheDocument();
    });

    // Verify guest fields exist and are pre-filled with user info
    const guestInput = screen.getByPlaceholderText('e.g. John Doe');
    const phoneInput = screen.getByPlaceholderText('+94 771234567');
    const billingInput = screen.getByPlaceholderText('e.g. 123 Main St, City, Country');

    expect(guestInput.value).toBe('Alice Smith');
    expect(phoneInput.value).toBe('+94771234567');
    expect(billingInput.value).toBe('789 Pine Rd, Seattle');

    // Select travel date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    const futureDateStr = futureDate.toLocaleDateString('en-CA');

    const dateInputs = document.querySelectorAll('input[type="date"]');
    expect(dateInputs.length).toBeGreaterThan(0);
    fireEvent.change(dateInputs[0], { target: { value: futureDateStr } });

    // Click Confirm Booking
    const confirmButton = screen.getByRole('button', { name: /Confirm Booking/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(bookingRequestBody).not.toBeNull();
    });

    expect(bookingRequestHeaders['Authorization']).toBe('Bearer test-jwt-token');
    expect(bookingRequestHeaders['Content-Type']).toBe('application/json');
    expect(bookingRequestBody.guestName).toBe('Alice Smith');
    expect(bookingRequestBody.phoneNumber).toBe('+94771234567');
    expect(bookingRequestBody.billingAddress).toBe('789 Pine Rd, Seattle');
    expect(bookingRequestBody.tourId).toBe('1');
    expect(bookingRequestBody.quantity).toBe(1);
    expect(bookingRequestBody.totalAmount).toBe(1500);
    expect(bookingRequestBody.travelDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    // Verify redirected to payment interface with bookingId and state
    expect(mockNavigate).toHaveBeenCalledWith('/payment/b-123', expect.objectContaining({
      state: expect.objectContaining({
        bookingId: 'b-123',
        totalAmount: 1500,
        tourName: 'Paris Adventure'
      })
    }));
  });

  it('displays backend validation error message and logs error when booking fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    global.fetch = vi.fn((url) => {
      if (url.includes('/api/tours/active')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockTours })
        });
      }
      if (url.includes('/api/booking')) {
        return Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve({
            title: 'One or more validation errors occurred.',
            errors: {
              GuestName: ['The GuestName field is required.']
            }
          })
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<TourDisplay token="test-jwt-token" user={{ fullName: '', phoneNumber: '+94771234567', role: 'Customer' }} />);

    await waitFor(() => {
      expect(screen.getByText('Paris Adventure')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Paris Adventure'));

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: 'Paris Adventure' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Book Now' }));

    await waitFor(() => {
      expect(screen.getByText('Complete Your Booking')).toBeInTheDocument();
    });

    // Select travel date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    const dateInputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(dateInputs[0], { target: { value: futureDate.toLocaleDateString('en-CA') } });

    // Confirm booking
    fireEvent.click(screen.getByRole('button', { name: /Confirm Booking/i }));

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Booking API error response:',
        400,
        expect.objectContaining({ title: 'One or more validation errors occurred.' })
      );
      expect(screen.getByText(/The GuestName field is required/i)).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  it('displays inline error "Enter valid phone number" when submitting with invalid phone', async () => {
    let bookingCalled = false;
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/tours/active')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockTours })
        });
      }
      if (url.includes('/api/booking')) {
        bookingCalled = true;
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<TourDisplay token="test-jwt-token" user={{ fullName: 'Bob Tester', phoneNumber: '', role: 'Customer' }} />);

    await waitFor(() => {
      expect(screen.getByText('Paris Adventure')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Paris Adventure'));
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 2, name: 'Paris Adventure' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Book Now' }));
    await waitFor(() => {
      expect(screen.getByText('Complete Your Booking')).toBeInTheDocument();
    });

    // Select valid travel date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    const dateInputs = document.querySelectorAll('input[type="date"]');
    fireEvent.change(dateInputs[0], { target: { value: futureDate.toLocaleDateString('en-CA') } });

    // Enter incomplete phone number
    const phoneInput = screen.getByPlaceholderText('+94 771234567');
    fireEvent.change(phoneInput, { target: { value: '+94712' } });

    // Submit booking
    fireEvent.click(screen.getByRole('button', { name: /Confirm Booking/i }));

    // Assert inline error message
    expect(screen.getByText('Enter valid phone number')).toBeInTheDocument();
    expect(bookingCalled).toBe(false);

    // Enter valid phone number
    fireEvent.change(phoneInput, { target: { value: '+94771234567' } });
    expect(screen.queryByText('Enter valid phone number')).not.toBeInTheDocument();
  });
});
