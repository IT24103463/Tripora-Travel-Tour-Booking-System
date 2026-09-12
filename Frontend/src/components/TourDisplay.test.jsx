import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import TourDisplay from './TourDisplay';

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
});
