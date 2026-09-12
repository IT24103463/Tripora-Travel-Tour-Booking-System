import { useState, useEffect, useCallback } from 'react';
import './TourDisplay.css';
<<<<<<< Updated upstream

const API_TOURS_ENDPOINT = 'http://localhost:5025/api/tours';
const API_ACTIVE_TOURS_ENDPOINT = 'http://localhost:5025/api/tours/active';

export default function TourDisplay() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [selectedTour, setSelectedTour] = useState(null);
=======
import {
  Search, MapPin, DollarSign, X, Clock, Users, Ticket, Tag,
  Sparkles, BedSingle, Star, AlertTriangle, Briefcase,
  Hotel as HotelIcon, RefreshCw, CalendarDays, CheckCircle, Loader
} from 'lucide-react';

const API_BASE             = 'http://localhost:5120';
const API_ACTIVE_TOURS     = `${API_BASE}/api/tours/active`;
const API_HOTELS           = `${API_BASE}/api/hotels`;
const API_BOOKINGS         = `${API_BASE}/api/bookings`;

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Toast helper
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Toast({ toasts, onDismiss }) {
  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span className="toast-msg">{t.message}</span>
          <button type="button" className="toast-close" onClick={() => onDismiss(t.id)} aria-label="Dismiss">âœ•</button>
        </div>
      ))}
    </div>
  );
}

let toastCounter = 0;

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Main component
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function TourDisplay({ token, user }) {
  const [activeTab, setActiveTab] = useState('tours');

  const [tours,  setTours]  = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error,   setError]           = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  // Filters
  const [searchTerm,     setSearchTerm]     = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [maxPrice,       setMaxPrice]       = useState('');
>>>>>>> Stashed changes

  // Booking sub-modal state
  const [showBookingForm, setShowBookingForm]   = useState(false);
  const [bookingQty,      setBookingQty]        = useState(1);
  const [travelDate,      setTravelDate]        = useState('');
  const [checkIn,         setCheckIn]           = useState('');
  const [checkOut,        setCheckOut]          = useState('');
  const [bookingLoading,  setBookingLoading]    = useState(false);

  // Toasts
  const [toasts, setToasts] = useState([]);

  const pushToast = useCallback((message, type = 'info') => {
    const id = ++toastCounter;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // â”€â”€ Data fetching â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
<<<<<<< Updated upstream
    fetchTours();
  }, [showActiveOnly]);
=======
    if (activeTab === 'tours') fetchTours();
    else fetchHotels();
  }, [activeTab]);
>>>>>>> Stashed changes

  const fetchTours = async () => {
    setLoading(true); setError(null);
    try {
<<<<<<< Updated upstream
      const endpoint = showActiveOnly ? API_ACTIVE_TOURS_ENDPOINT : API_TOURS_ENDPOINT;
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTours(data.data || []);
      } else {
        setError(data.message || 'Failed to retrieve tours.');
      }
    } catch (err) {
      console.error('Tour fetch error:', err);
=======
      const res  = await fetch(API_ACTIVE_TOURS, { headers: { Accept: 'application/json' } });
      const data = await res.json();
      if (res.ok && data.success) setTours(data.data || []);
      else setError(data.message || 'Failed to retrieve tours.');
    } catch {
>>>>>>> Stashed changes
      setError('Unable to connect to the tour service. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

<<<<<<< Updated upstream
  const handleTourClick = (tour) => {
    setSelectedTour(tour);
  };

  const handleCloseModal = () => {
    setSelectedTour(null);
  };

  if (loading) {
    return (
      <div className="tour-display-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading available tours...</p>
=======
  const fetchHotels = async () => {
    setLoading(true); setError(null);
    try {
      const res  = await fetch(API_HOTELS, { headers: { Accept: 'application/json' } });
      const data = await res.json();
      if (res.ok) setHotels(data || []);
      else setError('Failed to retrieve hotels.');
    } catch {
      setError('Unable to connect to the hotel service. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // â”€â”€ Modal helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleItemClick  = (item) => { setSelectedItem(item); setShowBookingForm(false); };
  const handleCloseModal = () => { setSelectedItem(null); setShowBookingForm(false); };
  const handleImageError = (e) => {
    e.target.style.display = 'none';
    if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex';
  };

  const resetFilters = () => { setSearchTerm(''); setLocationFilter(''); setMaxPrice(''); };

  // â”€â”€ Book Now â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleBookNowClick = () => {
    if (!token || !user) {
      pushToast('Please sign in to make a booking.', 'warning');
      return;
    }
    // Reset form state
    setBookingQty(1);
    setTravelDate('');
    setCheckIn('');
    setCheckOut('');
    setShowBookingForm(true);
  };

  const handleConfirmBooking = async () => {
    if (!token || !user) {
      pushToast('Please sign in to make a booking.', 'warning');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Validate inputs
    if (activeTab === 'tours') {
      if (!travelDate) { pushToast('Please select a travel date.', 'error'); return; }
      const selectedDate = new Date(travelDate);
      if (selectedDate <= today) {
        pushToast('Travel date must be a future date.', 'error');
        return;
      }
    } else {
      if (!checkIn)  { pushToast('Please select a check-in date.',  'error'); return; }
      if (!checkOut) { pushToast('Please select a check-out date.', 'error'); return; }
      const inDate = new Date(checkIn);
      const outDate = new Date(checkOut);
      if (inDate <= today) {
        pushToast('Check-in date must be a future date.', 'error');
        return;
      }
      if (outDate <= inDate) {
        pushToast('Check-out date must be after check-in date.', 'error');
        return;
      }
    }
    if (bookingQty < 1) { pushToast('Quantity must be at least 1.', 'error'); return; }

    const isTour  = activeTab === 'tours';
    const price   = isTour ? selectedItem.price : selectedItem.pricePerNight;
    const nights  = isTour ? 1 : Math.max(1,
      Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24))
    );
    const total   = price * bookingQty * nights;

    const payload = {
      bookingType:  isTour ? 'Tour'  : 'Hotel',
      tourId:       isTour ? selectedItem.id : null,
      hotelId:      isTour ? null : selectedItem.id,
      travelDate:   isTour ? new Date(travelDate).toISOString() : new Date(checkIn).toISOString(),
      checkInDate:  isTour ? null : new Date(checkIn).toISOString(),
      checkOutDate: isTour ? null : new Date(checkOut).toISOString(),
      quantity:     bookingQty,
      totalAmount:  total
    };

    setBookingLoading(true);
    try {
      const res  = await fetch(API_BOOKINGS, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Accept':        'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        pushToast(
          `âœ… Booking confirmed! Your ${isTour ? 'tour' : 'hotel'} has been reserved.`,
          'success'
        );
        setShowBookingForm(false);
        setSelectedItem(null);
        // Refresh data to reflect updated availability
        if (isTour) fetchTours(); else fetchHotels();
      } else if (res.status === 401) {
        pushToast('Your session has expired. Please sign in again.', 'error');
      } else if (res.status === 400) {
        pushToast(data.message || 'Booking unavailable: no capacity remaining.', 'error');
      } else {
        pushToast(data.message || 'Booking failed. Please try again.', 'error');
      }
    } catch {
      pushToast('Network error. Please check your connection and try again.', 'error');
    } finally {
      setBookingLoading(false);
    }
  };

  // â”€â”€ Filters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const filteredTours = tours.filter(t => {
    const s = searchTerm.toLowerCase();
    return (
      (!searchTerm || t.name.toLowerCase().includes(s) || t.description.toLowerCase().includes(s)) &&
      (!locationFilter || t.destination.toLowerCase().includes(locationFilter.toLowerCase())) &&
      (!maxPrice || t.price <= parseFloat(maxPrice))
    );
  });

  const filteredHotels = hotels.filter(h => {
    const s = searchTerm.toLowerCase();
    return (
      (!searchTerm || h.name.toLowerCase().includes(s) || h.description.toLowerCase().includes(s)) &&
      (!locationFilter || h.location.toLowerCase().includes(locationFilter.toLowerCase())) &&
      (!maxPrice || h.pricePerNight <= parseFloat(maxPrice))
    );
  });

  // â”€â”€ Loading / Error guards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (loading && tours.length === 0 && hotels.length === 0) {
    return (
      <div className="tour-display-container">
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading available {activeTab}...</p>
>>>>>>> Stashed changes
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tour-display-container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Tour Service Error</h3>
          <p>{error}</p>
<<<<<<< Updated upstream
          <button type="button" className="btn-retry" onClick={fetchTours}>
            ↻ Try Again
=======
          <button type="button" className="btn-retry"
            onClick={activeTab === 'tours' ? fetchTours : fetchHotels}>
            <RefreshCw size={16} style={{ marginRight: '4px' }} /> Try Again
>>>>>>> Stashed changes
          </button>
        </div>
      </div>
    );
  }

<<<<<<< Updated upstream
=======
  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
>>>>>>> Stashed changes
  return (
    <div className="tour-display-container">

      {/* Toast notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Header */}
      <div className="tour-header">
<<<<<<< Updated upstream
        <h2 className="tour-title">Explore Our Tours</h2>
        <p className="tour-subtitle">Discover extraordinary journeys and create unforgettable memories</p>
        
        <div className="tour-controls">
          <div className="toggle-switch">
            <button
              type="button"
              className={`toggle-btn ${showActiveOnly ? 'active' : ''}`}
              onClick={() => setShowActiveOnly(true)}
            >
              Active Tours
            </button>
            <button
              type="button"
              className={`toggle-btn ${!showActiveOnly ? 'active' : ''}`}
              onClick={() => setShowActiveOnly(false)}
            >
              All Tours
            </button>
          </div>
          <button type="button" className="btn-refresh" onClick={fetchTours}>
            ↻ Refresh
=======
        <h2 className="tour-title">Explore Our Destinations</h2>
        <p className="tour-subtitle">Discover extraordinary journeys and luxurious stays</p>

        <div className="tour-controls">
          <div className="toggle-switch">
            <button type="button"
              className={"toggle-btn " + (activeTab === 'tours'  ? 'active' : '')}
              onClick={() => { setActiveTab('tours');  setSelectedItem(null); }}>Tours</button>
            <button type="button"
              className={"toggle-btn " + (activeTab === 'hotels' ? 'active' : '')}
              onClick={() => { setActiveTab('hotels'); setSelectedItem(null); }}>Hotels</button>
          </div>
          <button type="button" className="btn-refresh"
            onClick={activeTab === 'tours' ? fetchTours : fetchHotels}>
            <RefreshCw size={16} style={{ marginRight: '4px' }} /> Refresh
>>>>>>> Stashed changes
          </button>
        </div>
      </div>

<<<<<<< Updated upstream
      {tours.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🌍</div>
          <h3>No Tours Available</h3>
          <p>
            {showActiveOnly 
              ? 'There are currently no active tours available.' 
              : 'No tours found in the system.'}
          </p>
        </div>
      ) : (
        <div className="tours-grid">
          {tours.map((tour) => (
            <div 
              key={tour.id} 
              className={`tour-card ${!tour.isActive ? 'tour-inactive' : ''}`}
              onClick={() => handleTourClick(tour)}
            >
              <div className="tour-image">
                {tour.imageUrl ? (
                  <img src={tour.imageUrl} alt={tour.name} />
                ) : (
                  <div className="tour-placeholder">
                    <span className="placeholder-icon">✈️</span>
                  </div>
                )}
                {!tour.isActive && (
                  <div className="tour-badge inactive">Inactive</div>
                )}
              </div>
              
              <div className="tour-content">
                <div className="tour-destination">{tour.destination}</div>
                <h3 className="tour-name">{tour.name}</h3>
                <p className="tour-description">{tour.description}</p>
                
                <div className="tour-details">
                  <div className="tour-detail">
                    <span className="detail-icon">⏱️</span>
                    <span>{tour.durationDays} days</span>
                  </div>
                  <div className="tour-detail">
                    <span className="detail-icon">👥</span>
                    <span>{tour.availableSlots} / {tour.capacity} spots</span>
                  </div>
                </div>
                
                <div className="tour-footer">
                  <div className="tour-price">${tour.price.toLocaleString()}</div>
                  <button 
                    type="button" 
                    className="btn-view-details"
                    disabled={!tour.isActive}
                  >
                    {tour.isActive ? 'View Details' : 'Not Available'}
                  </button>
                </div>
              </div>
            </div>
          ))}
=======
      {/* Filters */}
      <div className="tour-filters">
        <div className="filter-group">
          <Search className="filter-icon" size={18} />
          <input type="text" placeholder="Search name or description..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="filter-input" />
        </div>
        <div className="filter-group">
          <MapPin className="filter-icon" size={18} />
          <input type="text" placeholder="Filter by location..."
            value={locationFilter} onChange={e => setLocationFilter(e.target.value)} className="filter-input" />
>>>>>>> Stashed changes
        </div>
        <div className="filter-group">
          <DollarSign className="filter-icon" size={18} />
          <input type="number" placeholder={`Max price${activeTab === 'hotels' ? ' / night' : ''}`}
            value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="filter-input" min="0" />
        </div>
        <div className="filter-actions">
          <button type="button" className="btn-filter-clear" onClick={resetFilters}>
            <X size={16} /> Clear Filters
          </button>
        </div>
      </div>

<<<<<<< Updated upstream
      {/* Tour Detail Modal */}
      {selectedTour && (
        <div className="tour-modal-overlay" onClick={handleCloseModal}>
          <div className="tour-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={handleCloseModal}>
              ✕
            </button>
            
            <div className="modal-content">
              <div className="modal-header">
                <div className="modal-destination">{selectedTour.destination}</div>
                <h2 className="modal-title">{selectedTour.name}</h2>
                {!selectedTour.isActive && (
                  <div className="modal-badge inactive">Inactive Tour</div>
                )}
              </div>
              
              {selectedTour.imageUrl && (
                <div className="modal-image">
                  <img src={selectedTour.imageUrl} alt={selectedTour.name} />
                </div>
              )}
              
=======
      {/* Grid â€” Tours */}
      {activeTab === 'tours' ? (
        tours.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">ðŸœï¸</div>
            <h3>No Tours Available</h3>
            <p>There are currently no active tours available.</p>
          </div>
        ) : filteredTours.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Search size={48} /></div>
            <h3>No results found</h3>
            <p>We couldn't find any tours matching your criteria.</p>
            <button type="button" className="btn-retry" onClick={resetFilters}>Reset Filters</button>
          </div>
        ) : (
          <div className="tours-grid">
            {filteredTours.map(tour => (
              <div key={tour.id}
                className={"tour-card " + (!tour.isActive ? 'tour-inactive' : '')}
                onClick={() => handleItemClick(tour)}>
                <div className="tour-image">
                  {tour.imageUrl && <img src={tour.imageUrl} alt={tour.name} onError={handleImageError} />}
                  <div className="tour-placeholder" style={{ display: tour.imageUrl ? 'none' : 'flex' }}>
                    <Briefcase size={48} className="placeholder-icon" color="currentColor" />
                  </div>
                </div>
                <div className="tour-content">
                  <div className="tour-destination">{tour.destination}</div>
                  <h3 className="tour-name">{tour.name}</h3>
                  <p className="tour-description">{tour.description}</p>
                  <div className="tour-details">
                    <div className="tour-detail"><Clock className="detail-icon" size={18} /><span>{tour.durationDays} days</span></div>
                    <div className="tour-detail"><Users className="detail-icon" size={18} /><span>{tour.availableSlots} / {tour.capacity} spots</span></div>
                  </div>
                  <div className="tour-footer">
                    <div className="tour-price">${tour.price.toLocaleString()}</div>
                    <button type="button" className="btn-view-details">View Details</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Grid â€” Hotels */
        hotels.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><HotelIcon size={48} /></div>
            <h3>No Hotels Available</h3>
            <p>There are currently no active hotels found in the system.</p>
          </div>
        ) : filteredHotels.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Search size={48} /></div>
            <h3>No results found</h3>
            <p>We couldn't find any hotels matching your criteria.</p>
            <button type="button" className="btn-retry" onClick={resetFilters}>Reset Filters</button>
          </div>
        ) : (
          <div className="tours-grid">
            {filteredHotels.map(hotel => (
              <div key={hotel.id}
                className={"tour-card " + (!hotel.isActive ? 'tour-inactive' : '')}
                onClick={() => handleItemClick(hotel)}>
                <div className="tour-image">
                  {hotel.imageUrl && <img src={hotel.imageUrl} alt={hotel.name} onError={handleImageError} />}
                  <div className="tour-placeholder" style={{ display: hotel.imageUrl ? 'none' : 'flex' }}>
                    <HotelIcon size={48} className="placeholder-icon" color="currentColor" />
                  </div>
                </div>
                <div className="tour-content">
                  <div className="tour-destination">{hotel.location}</div>
                  <h3 className="tour-name">{hotel.name}</h3>
                  <p className="tour-description">{hotel.description}</p>
                  <div className="tour-details" style={{ flexWrap: 'wrap' }}>
                    <div className="tour-detail"><Star className="detail-icon" size={18} /><span>{hotel.rating} / 5.0</span></div>
                    {hotel.amenities && hotel.amenities.split(',').slice(0, 2).map((a, i) => (
                      <div className="tour-detail" key={i}><Sparkles className="detail-icon" size={18} /><span>{a.trim()}</span></div>
                    ))}
                  </div>
                  <div className="tour-footer">
                    <div className="tour-price">${hotel.pricePerNight.toLocaleString()} <span style={{ fontSize: '0.8rem', color: '#64748b' }}>/ night</span></div>
                    <button type="button" className="btn-view-details">View Details</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* â”€â”€ Detail + Booking Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {selectedItem && (
        <div className="tour-modal-overlay" onClick={handleCloseModal}>
          <div className="tour-modal" onClick={e => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={handleCloseModal}>âœ•</button>

            <div className="modal-content">
              <div className="modal-header">
                <div className="modal-destination">
                  {activeTab === 'tours' ? selectedItem.destination : selectedItem.location}
                </div>
                <h2 className="modal-title">{selectedItem.name}</h2>
              </div>

              <div className="modal-image">
                {selectedItem.imageUrl && (
                  <img src={selectedItem.imageUrl} alt={selectedItem.name} onError={handleImageError} />
                )}
                <div className="tour-placeholder"
                  style={{ display: selectedItem.imageUrl ? 'none' : 'flex', minHeight: '300px' }}>
                  <span className="placeholder-icon" style={{ fontSize: '4rem' }}>
                    {activeTab === 'tours' ? 'ðŸ§³' : 'ðŸ¨'}
                  </span>
                </div>
              </div>

>>>>>>> Stashed changes
              <div className="modal-body">
                <div className="modal-description">
                  <h4>About This Tour</h4>
                  <p>{selectedTour.description}</p>
                </div>

                <div className="modal-specs">
<<<<<<< Updated upstream
                  <div className="spec-item">
                    <span className="spec-icon">⏱️</span>
                    <div className="spec-info">
                      <span className="spec-label">Duration</span>
                      <span className="spec-value">{selectedTour.durationDays} days</span>
                    </div>
                  </div>
                  
                  <div className="spec-item">
                    <span className="spec-icon">👥</span>
                    <div className="spec-info">
                      <span className="spec-label">Capacity</span>
                      <span className="spec-value">{selectedTour.capacity} people</span>
                    </div>
                  </div>
                  
                  <div className="spec-item">
                    <span className="spec-icon">🎫</span>
                    <div className="spec-info">
                      <span className="spec-label">Available Spots</span>
                      <span className="spec-value">{selectedTour.availableSlots} remaining</span>
                    </div>
                  </div>
                  
                  <div className="spec-item">
                    <span className="spec-icon">💰</span>
                    <div className="spec-info">
                      <span className="spec-label">Price</span>
                      <span className="spec-value">${selectedTour.price.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer">
                  <div className="tour-id">Tour ID: {selectedTour.id}</div>
                  <div className="tour-dates">
                    <span>Created: {new Date(selectedTour.createdAt).toLocaleDateString()}</span>
                    {selectedTour.updatedAt && (
                      <span>Updated: {new Date(selectedTour.updatedAt).toLocaleDateString()}</span>
=======
                  {activeTab === 'tours' ? (
                    <>
                      <div className="spec-item">
                        <Clock className="spec-icon" size={20} />
                        <div className="spec-info"><span className="spec-label">Duration</span><span className="spec-value">{selectedItem.durationDays} days</span></div>
                      </div>
                      <div className="spec-item">
                        <Users className="spec-icon" size={20} />
                        <div className="spec-info"><span className="spec-label">Capacity</span><span className="spec-value">{selectedItem.capacity} people</span></div>
                      </div>
                      <div className="spec-item">
                        <Ticket className="spec-icon" size={20} />
                        <div className="spec-info"><span className="spec-label">Available Spots</span><span className="spec-value">{selectedItem.availableSlots} remaining</span></div>
                      </div>
                      <div className="spec-item">
                        <Tag className="spec-icon" size={20} />
                        <div className="spec-info"><span className="spec-label">Price</span><span className="spec-value">${selectedItem.price.toLocaleString()}</span></div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="spec-item">
                        <BedSingle className="spec-icon" size={20} />
                        <div className="spec-info"><span className="spec-label">Available Rooms</span><span className="spec-value">{selectedItem.availableRooms} rooms</span></div>
                      </div>
                      <div className="spec-item">
                        <Star className="spec-icon" size={20} />
                        <div className="spec-info"><span className="spec-label">Rating</span><span className="spec-value">{selectedItem.rating} / 5.0</span></div>
                      </div>
                      <div className="spec-item">
                        <Sparkles className="spec-icon" size={20} />
                        <div className="spec-info"><span className="spec-label">Amenities</span><span className="spec-value">{selectedItem.amenities || 'None'}</span></div>
                      </div>
                      <div className="spec-item">
                        <Tag className="spec-icon" size={20} />
                        <div className="spec-info"><span className="spec-label">Price</span><span className="spec-value">${selectedItem.pricePerNight.toLocaleString()} / night</span></div>
                      </div>
                    </>
                  )}
                </div>

                {/* â”€â”€ Booking form (shown after "Book Now" click) â”€â”€ */}
                {showBookingForm ? (
                  <div className="booking-form">
                    <h4 className="booking-form-title">
                      <CalendarDays size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                      Complete Your Booking
                    </h4>

                    {activeTab === 'tours' ? (
                      <div className="booking-field">
                        <label className="booking-label">Travel Date</label>
                        <input
                          type="date"
                          className="booking-input"
                          value={travelDate}
                          min={new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]}
                          onChange={e => setTravelDate(e.target.value)}
                        />
                      </div>
                    ) : (
                      <>
                        <div className="booking-field">
                          <label className="booking-label">Check-In Date</label>
                          <input type="date" className="booking-input" value={checkIn}
                            min={new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]}
                            onChange={e => setCheckIn(e.target.value)} />
                        </div>
                        <div className="booking-field">
                          <label className="booking-label">Check-Out Date</label>
                          <input type="date" className="booking-input" value={checkOut}
                            min={checkIn || new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]}
                            onChange={e => setCheckOut(e.target.value)} />
                        </div>
                      </>
>>>>>>> Stashed changes
                    )}

                    <div className="booking-field">
                      <label className="booking-label">
                        {activeTab === 'tours' ? 'Number of Guests' : 'Number of Rooms'}
                      </label>
                      <input type="number" className="booking-input" value={bookingQty}
                        min="1"
                        max={activeTab === 'tours' ? selectedItem.availableSlots : selectedItem.availableRooms}
                        onChange={e => setBookingQty(Math.max(1, parseInt(e.target.value) || 1))} />
                    </div>

                    {/* Price summary */}
                    <div className="booking-summary" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {activeTab === 'tours' ? (
                        <>
                          {travelDate && <span style={{ fontSize: '0.85rem' }}>Travel Date: {new Date(travelDate).toLocaleDateString('en-GB')}</span>}
                          <span>
                            {bookingQty} × ${(selectedItem.price || 0).toLocaleString()} = <strong>${(bookingQty * selectedItem.price).toLocaleString()}</strong>
                          </span>
                        </>
                      ) : (
                        (() => {
                          const nights = checkIn && checkOut
                            ? Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000))
                            : 1;
                          return (
                            <>
                              {checkIn && checkOut && <span style={{ fontSize: '0.85rem' }}>Stay: {new Date(checkIn).toLocaleDateString('en-GB')} - {new Date(checkOut).toLocaleDateString('en-GB')}</span>}
                              <span>
                                {bookingQty} room{bookingQty > 1 ? 's' : ''} × {nights} night{nights > 1 ? 's' : ''} × ${(selectedItem.pricePerNight || 0).toLocaleString()}
                                {' '}= <strong>${(bookingQty * nights * selectedItem.pricePerNight).toLocaleString()}</strong>
                              </span>
                            </>
                          );
                        })()
                      )}
                    </div>

                    <div className="booking-actions">
                      <button type="button" className="btn-booking-cancel"
                        onClick={() => setShowBookingForm(false)} disabled={bookingLoading}>
                        Back
                      </button>
                      <button type="button" className="btn-booking-confirm"
                        onClick={handleConfirmBooking} disabled={bookingLoading}>
                        {bookingLoading
                          ? <><Loader size={16} className="spin-icon" /> Processing...</>
                          : <><CheckCircle size={16} style={{ marginRight: '6px' }} /> Confirm Booking</>
                        }
                      </button>
                    </div>
                  </div>
<<<<<<< Updated upstream
                </div>
=======
                ) : (
                  <div className="modal-footer"
                    style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <button type="button" className="btn-book-now" onClick={handleBookNowClick}>
                      Book Now
                    </button>
                  </div>
                )}
>>>>>>> Stashed changes
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}