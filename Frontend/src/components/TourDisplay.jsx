import { useState, useEffect, useCallback, useRef } from 'react';
import './TourDisplay.css';
import EditDestinationModal from './EditDestinationModal';
import {
  Search, MapPin, DollarSign, X, Clock, Users, Ticket, Tag,
  Sparkles, BedSingle, Star, AlertTriangle, Briefcase,
  Hotel as HotelIcon, RefreshCw, CalendarDays, CheckCircle, Loader
} from 'lucide-react';

const API_BASE             = 'http://localhost:5120';
const API_ACTIVE_TOURS     = `${API_BASE}/api/tours/active`;
const API_HOTELS           = `${API_BASE}/api/hotels`;
const API_BOOKINGS         = `${API_BASE}/api/bookings`;

function Toast({ toasts, onDismiss }) {
  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span className="toast-msg">{t.message}</span>
          <button type="button" className="toast-close" onClick={() => onDismiss(t.id)} aria-label="Dismiss">✕</button>
        </div>
      ))}
    </div>
  );
}

let toastCounter = 0;

export default function TourDisplay({ token, user, onRequireAuth }) {
  const isAdmin = user?.role === 'Admin';
      const [activeTab, setActiveTab] = useState('tours');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  const [tours,  setTours]  = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error,   setError]           = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  // Filters
  const [searchTerm,     setSearchTerm]     = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [maxPrice,       setMaxPrice]       = useState('');

  // Booking sub-modal state
  const [showBookingForm, setShowBookingForm]   = useState(false);
  const [bookingQty,      setBookingQty]        = useState(1);
  const [travelDate,      setTravelDate]        = useState('');
  const [checkIn,         setCheckIn]           = useState('');
  const [checkOut,        setCheckOut]          = useState('');
    const [bookingLoading,  setBookingLoading]    = useState(false);
  const [bookingNotification, setBookingNotification] = useState(null);

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

  useEffect(() => {
    if (activeTab === 'tours') fetchTours();
    else fetchHotels();
  }, [activeTab]);

  const fetchTours = async () => {
    setLoading(true); setError(null);
    try {
      const res  = await fetch(API_ACTIVE_TOURS, { headers: { Accept: 'application/json' } });
      const data = await res.json();
      if (res.ok) {
        if (Array.isArray(data)) setTours(data);
        else if (data && data.success !== undefined) {
          if (data.success) setTours(data.data || []);
          else { setError(data.message || 'Failed to retrieve tours.'); pushToast('Failed to retrieve tours.', 'error'); }
        } else if (data && data.data && Array.isArray(data.data)) setTours(data.data);
        else setTours([]);
      } else { setError(data.message || 'Failed to retrieve tours.'); pushToast('Failed to retrieve tours.', 'error'); }
    } catch (err) {
      console.error("Destination fetch failed:", err);
      setError('Unable to connect to the tour service. Please check your connection.');
      pushToast('Network error: Unable to connect to the tour service.', 'error');
    } finally { setLoading(false); }
  };

  const fetchHotels = async () => {
    setLoading(true); setError(null);
    try {
      const res  = await fetch(API_HOTELS, { headers: { Accept: 'application/json' } });
      const data = await res.json();
      if (res.ok) {
        if (Array.isArray(data)) setHotels(data);
        else if (data && data.success !== undefined) {
          if (data.success) setHotels(data.data || []);
          else { setError(data.message || 'Failed to retrieve hotels.'); pushToast('Failed to retrieve hotels.', 'error'); }
        } else if (data && data.data && Array.isArray(data.data)) setHotels(data.data);
        else setHotels([]);
      } else { setError('Failed to retrieve hotels.'); pushToast('Failed to retrieve hotels.', 'error'); }
    } catch (err) {
      console.error("Destination fetch failed:", err);
      setError('Unable to connect to the hotel service. Please check your connection.');
      pushToast('Network error: Unable to connect to the hotel service.', 'error');
    } finally { setLoading(false); }
  };

  const handleItemClick  = (item) => { setSelectedItem(item); setShowBookingForm(false); };
  const handleCloseModal = () => { setSelectedItem(null); setShowBookingForm(false); };
  const handleImageError = (e) => {
    e.target.style.display = 'none';
    if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex';
  };
  const resetFilters = () => { setSearchTerm(''); setLocationFilter(''); setMaxPrice(''); };  const tourDateRef = useRef(null);
  const checkInRef = useRef(null);
  const checkOutRef = useRef(null);

  const openCalendar = (ref) => {
    if (ref && ref.current) {
      if (typeof ref.current.showPicker === 'function') {
        try { ref.current.showPicker(); } catch (e) { ref.current.focus(); }
      } else {
        ref.current.focus();
      }
    }
  };

    const getNextDay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    date.setDate(date.getDate() + 1);
    return date.toLocaleDateString('en-CA');
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateString = tomorrow.toLocaleDateString('en-CA');

    const handleCheckInChange = (newCheckIn) => {
    setCheckIn(newCheckIn);
    if (checkOut && new Date(newCheckIn) >= new Date(checkOut)) {
      setCheckOut(getNextDay(newCheckIn));
    }
  };

  const handleBookNowClick = () => {
    if (!token || !user) {
      if (onRequireAuth) onRequireAuth();
      else pushToast('Please sign in to make a booking.', 'warning');
      return;
    }
    setBookingQty(1); setTravelDate(''); setCheckIn(''); setCheckOut('');
    setShowBookingForm(true);
  };  const handleConfirmBooking = async () => {
    if (!token || !user) {
      if (onRequireAuth) onRequireAuth();
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setBookingNotification(null);

    let finalTravelDate = null;
    let finalCheckIn = null;
    let finalCheckOut = null;
    let finalTotalAmount = 0;

    if (activeTab === 'tours') {
      if (!travelDate) { setBookingNotification({ type: 'error', message: 'Please select a travel date.' }); return; }
      const selectedDate = new Date(travelDate + 'T00:00:00');
      if (selectedDate <= today) { setBookingNotification({ type: 'error', message: 'Travel date must be a future date.' }); return; }
      finalTravelDate = selectedDate.toISOString();
      finalTotalAmount = bookingQty * selectedItem.price;
    } else {
      if (!checkIn)  { setBookingNotification({ type: 'error', message: 'Please select a check-in date.' }); return; }
      if (!checkOut) { setBookingNotification({ type: 'error', message: 'Please select a check-out date.' }); return; }
      const inDate = new Date(checkIn + 'T00:00:00');
      const outDate = new Date(checkOut + 'T00:00:00');
      if (inDate <= today) { setBookingNotification({ type: 'error', message: 'Check-in date must be a future date.' }); return; }
      if (outDate <= inDate) { setBookingNotification({ type: 'error', message: 'Check-out date must be at least one day after check-in date.' }); return; }
      finalCheckIn = inDate.toISOString();
      finalCheckOut = outDate.toISOString();
      
      const nights = Math.max(1, Math.ceil((outDate - inDate) / 86400000));
      finalTotalAmount = bookingQty * nights * selectedItem.pricePerNight;
    }

    const isTour = activeTab === 'tours';
    const payload = {
      bookingType:  isTour ? "Tour" : "Hotel",
      tourId:       isTour ? selectedItem.id : null,
      hotelId:      !isTour ? selectedItem.id : null,
      travelDate:   isTour ? finalTravelDate : finalCheckIn,
      checkInDate:  !isTour ? finalCheckIn : null,
      checkOutDate: !isTour ? finalCheckOut : null,
      quantity:     bookingQty,
      totalAmount:  finalTotalAmount
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
        setBookingNotification({ type: 'success', message: 'Booking request submitted successfully! Status: Pending. (Proceeding to payment integration soon...)' });
        setTimeout(() => {
          setBookingNotification(null);
          setShowBookingForm(false);
          setSelectedItem(null);
          if (isTour) fetchTours(); else fetchHotels();
        }, 3500);
      } else if (res.status === 401) setBookingNotification({ type: 'error', message: 'Your session has expired. Please sign in again.' });
      else if (res.status === 400 || res.status === 409) setBookingNotification({ type: 'error', message: data.message || 'Not enough spots available for this date.' });
      else setBookingNotification({ type: 'error', message: data.message || 'Booking failed. Please try again.' });
    } catch (err) {
      console.error("Destination fetch failed:", err);
      setBookingNotification({ type: 'error', message: 'Booking service temporarily unavailable. Please try again later.' });
    } finally { setBookingLoading(false); }
  };

  const openEditModal = (item) => {
    console.log("Button clicked! Edit:", item?.id || item?._id);
    setEditFormData({
      name: item?.name || '',
      description: item?.description || '',
      price: item?.price || item?.pricePerNight || 0,
      capacity: item?.capacity || item?.availableRooms || 0,
      imageUrl: item?.imageUrl || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const endpoint = activeTab === 'tours' ? `${API_ACTIVE_TOURS.replace('/active', '')}/${selectedItem.id}` : `${API_HOTELS}/${selectedItem.id}`;
      
      const payload = { ...selectedItem, ...editFormData };
      if (activeTab === 'tours') {
        payload.price = parseFloat(editFormData.price);
        payload.capacity = parseInt(editFormData.capacity, 10);
      } else {
        payload.pricePerNight = parseFloat(editFormData.price);
        payload.availableRooms = parseInt(editFormData.capacity, 10);
      }

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        pushToast('Successfully updated.', 'success');
        setIsEditModalOpen(false);
        setSelectedItem(payload);
        if (activeTab === 'tours') fetchTours();
        else fetchHotels();
      } else {
        pushToast('Failed to update.', 'error');
      }
    } catch (err) {
      console.error("Update failed:", err);
      pushToast('Network error while updating.', 'error');
    }
  };

  const handleDelete = async (itemId) => {
    console.log("Button clicked! Delete:", itemId);
    if (!window.confirm(`Are you sure you want to delete this ${activeTab === 'tours' ? 'tour' : 'hotel'}?`)) return;
    
    try {
      const endpoint = activeTab === 'tours' ? `${API_ACTIVE_TOURS.replace('/active', '')}/${itemId}` : `${API_HOTELS}/${itemId}`;
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        pushToast('Successfully deleted.', 'success');
        setSelectedItem(null);
        if (activeTab === 'tours') fetchTours();
        else fetchHotels();
        window.location.hash = '#admin';
      } else {
        pushToast('Failed to delete destination.', 'error');
      }
    } catch (err) {
      console.error("Delete failed:", err);
      pushToast('Network error while deleting.', 'error');
    }
  };

  const handleToggleActive = async (checked, item) => {
    console.log("Button clicked! Toggle:", checked, item?.id || item?._id);
    try {
      const endpoint = activeTab === 'tours' ? `${API_ACTIVE_TOURS.replace('/active', '')}/${item.id}` : `${API_HOTELS}/${item.id}`;
      const payload = {
        ...item,
        isActive: checked
      };
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        pushToast(`Successfully marked as ${payload.isActive ? 'Active' : 'Inactive'}`, 'success');
        setSelectedItem(payload);
        if (activeTab === 'tours') fetchTours();
        else fetchHotels();
      } else {
        pushToast('Failed to update status', 'error');
      }
    } catch (err) {
      console.error("Toggle failed:", err);
      pushToast('Network error updating status', 'error');
    }
  };

  const filteredTours = tours.filter(t => {
    const s = searchTerm.toLowerCase();
    return ((!searchTerm || t.name.toLowerCase().includes(s) || t.description.toLowerCase().includes(s)) &&
      (!locationFilter || t.destination.toLowerCase().includes(locationFilter.toLowerCase())) &&
      (!maxPrice || t.price <= parseFloat(maxPrice)));
  });

  const filteredHotels = hotels.filter(h => {
    const s = searchTerm.toLowerCase();
    return ((!searchTerm || h.name.toLowerCase().includes(s) || h.description.toLowerCase().includes(s)) &&
      (!locationFilter || h.location.toLowerCase().includes(locationFilter.toLowerCase())) &&
      (!maxPrice || h.pricePerNight <= parseFloat(maxPrice)));
  });

  if (loading && tours.length === 0 && hotels.length === 0) {
    return (
      <div className="tour-display-container">
        <div className="loading-state">
          <div className="spinner" />
          <p>Loading available {activeTab}...</p>
        </div>
      </div>
    );
  }

  if (error && tours.length === 0 && hotels.length === 0) {
    return (
      <div className="tour-display-container">
        <div className="error-state">
          <div className="error-icon"><AlertTriangle size={32} /></div>
          <h3>Service Error</h3>
          <p>{error}</p>
          <button type="button" className="btn-retry" onClick={activeTab === 'tours' ? fetchTours : fetchHotels}>
            <RefreshCw size={16} style={{ marginRight: '4px' }} /> Try Again
          </button>
        </div>
      </div>
    );
  }

  const currentDataEmpty = activeTab === 'tours' ? tours.length === 0 : hotels.length === 0;

  return (
    <div className="tour-display-container">
      <Toast toasts={toasts} onDismiss={dismissToast} />

      <div className="tour-header">
        <h2 className="tour-title">Explore Our Destinations</h2>
        <p className="tour-subtitle">Discover extraordinary journeys and luxurious stays</p>
        <div className="tour-controls">
          <div className="toggle-switch">
            <button type="button" className={"toggle-btn " + (activeTab === 'tours'  ? 'active' : '')} onClick={() => { setActiveTab('tours');  setSelectedItem(null); }}>Tours</button>
            <button type="button" className={"toggle-btn " + (activeTab === 'hotels' ? 'active' : '')} onClick={() => { setActiveTab('hotels'); setSelectedItem(null); }}>Hotels</button>
          </div>
          <button type="button" className="btn-refresh" onClick={activeTab === 'tours' ? fetchTours : fetchHotels}>
            <RefreshCw size={16} style={{ marginRight: '4px' }} /> Refresh
          </button>
        </div>
      </div>

      {!currentDataEmpty && (
        <div className="tour-filters">
          <div className="filter-group">
            <Search className="filter-icon" size={18} />
            <input type="text" placeholder="Search name or description..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="filter-input" />
          </div>
          <div className="filter-group">
            <MapPin className="filter-icon" size={18} />
            <input type="text" placeholder="Filter by location..." value={locationFilter} onChange={e => setLocationFilter(e.target.value)} className="filter-input" />
          </div>
          <div className="filter-group">
            <DollarSign className="filter-icon" size={18} />
            <input type="number" placeholder={`Max price${activeTab === 'hotels' ? ' / night' : ''}`} value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="filter-input" min="0" />
          </div>
          <div className="filter-actions">
            <button type="button" className="btn-filter-clear" onClick={resetFilters}><X size={16} /> Clear Filters</button>
          </div>
        </div>
      )}

      {activeTab === 'tours' ? (
        tours.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏜️</div>
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
              <div key={tour.id} className={"tour-card " + (!tour.isActive ? 'tour-inactive' : '')} onClick={() => handleItemClick(tour)}>
                <div className="tour-image">
                  {tour.imageUrl && <img src={tour.imageUrl} alt={tour.name} onError={handleImageError} />}
                  <div className="tour-placeholder" style={{ display: tour.imageUrl ? 'none' : 'flex' }}><Briefcase size={48} className="placeholder-icon" color="currentColor" /></div>
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
              <div key={hotel.id} className={"tour-card " + (!hotel.isActive ? 'tour-inactive' : '')} onClick={() => handleItemClick(hotel)}>
                <div className="tour-image">
                  {hotel.imageUrl && <img src={hotel.imageUrl} alt={hotel.name} onError={handleImageError} />}
                  <div className="tour-placeholder" style={{ display: hotel.imageUrl ? 'none' : 'flex' }}><HotelIcon size={48} className="placeholder-icon" color="currentColor" /></div>
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

      {selectedItem && (
        <div className="tour-modal-overlay" onClick={handleCloseModal}>
          <div className="tour-modal" onClick={e => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={handleCloseModal}>✕</button>

            <div className="modal-content">
              <div className="modal-header">
                <div className="modal-destination">{activeTab === 'tours' ? selectedItem.destination : selectedItem.location}</div>
                <h2 className="modal-title">{selectedItem.name}</h2>
              </div>

              <div className="modal-image">
                {selectedItem.imageUrl && <img src={selectedItem.imageUrl} alt={selectedItem.name} onError={handleImageError} />}
                <div className="tour-placeholder" style={{ display: selectedItem.imageUrl ? 'none' : 'flex', minHeight: '300px' }}>
                  <span className="placeholder-icon" style={{ fontSize: '4rem' }}>{activeTab === 'tours' ? '🧳' : '🏨'}</span>
                </div>
              </div>

              <div className="modal-body">
                <div className="modal-description">
                  <h4>About This {activeTab === 'tours' ? 'Tour' : 'Hotel'}</h4>
                  <p>{selectedItem.description}</p>
                </div>

                <div className="modal-specs">
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

                                  {!isAdmin ? (
                    showBookingForm ? (
                      <div className="booking-form">
                        <h4 className="booking-form-title">
                          <CalendarDays size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                          Complete Your Booking
                        </h4>
                        {bookingNotification && (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', marginBottom: '16px', borderRadius: '8px',
                            backgroundColor: bookingNotification.type === 'success' ? 'rgba(5, 150, 105, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            border: `1px solid ${bookingNotification.type === 'success' ? '#10b981' : '#ef4444'}`,
                            color: bookingNotification.type === 'success' ? '#a7f3d0' : '#fecaca',
                            fontSize: '14px'
                          }}>
                            {bookingNotification.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                            <span>{bookingNotification.message}</span>
                            <button type="button" onClick={() => setBookingNotification(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
                              <X size={16} />
                            </button>
                          </div>
                        )}
                        <div className="booking-row">
                          {activeTab === 'tours' && (
                            <div className="booking-group">
                              <label className="booking-label">Travel Date</label>
                              <div style={{ position: 'relative' }}>
                                <input 
                                  type="text" 
                                  className="booking-input" 
                                  value={travelDate ? new Date(travelDate + "T00:00:00").toLocaleDateString('en-GB') : ''}
                                  placeholder="DD/MM/YYYY"
                                  readOnly
                                  style={{ backgroundColor: '#132f38', color: '#fff', cursor: 'pointer' }}
                                  onClick={(e) => {
                                    const next = e.target.nextElementSibling;
                                    if (next && next.showPicker) next.showPicker();
                                  }}
                                />
                                <input
                                  type="date"
                                  ref={datePickerRef}
                                  min={(() => {
                                    const d = new Date();
                                    d.setDate(d.getDate() + 1);
                                    return d.toLocaleDateString('en-CA');
                                  })()}
                                  value={travelDate}
                                  onChange={e => setTravelDate(e.target.value)}
                                  style={{
                                    position: 'absolute', top: 0, left: 0, width: 0, height: 0, opacity: 0, pointerEvents: 'none', margin: 0, padding: 0, border: 'none'
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {activeTab === 'hotels' && (
                            <>
                              <div className="booking-group">
                                <label className="booking-label">Check-in</label>
                                <div style={{ position: 'relative' }}>
                                  <input 
                                    type="text" className="booking-input" 
                                    value={checkIn ? new Date(checkIn + "T00:00:00").toLocaleDateString('en-GB') : ''} placeholder="DD/MM/YYYY" readOnly
                                    style={{ backgroundColor: '#132f38', color: '#fff', cursor: 'pointer' }}
                                    onClick={(e) => { const next = e.target.nextElementSibling; if (next && next.showPicker) next.showPicker(); }}
                                  />
                                  <input type="date"
                                    min={(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toLocaleDateString('en-CA'); })()}
                                    value={checkIn}
                                    onChange={e => {
                                      setCheckIn(e.target.value);
                                      if (checkOut && e.target.value >= checkOut) {
                                        const d = new Date(e.target.value);
                                        d.setDate(d.getDate() + 1);
                                        setCheckOut(d.toLocaleDateString('en-CA'));
                                      }
                                    }}
                                    style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}
                                  />
                                </div>
                              </div>
                              <div className="booking-group">
                                <label className="booking-label">Check-out</label>
                                <div style={{ position: 'relative' }}>
                                  <input 
                                    type="text" className="booking-input" 
                                    value={checkOut ? new Date(checkOut + "T00:00:00").toLocaleDateString('en-GB') : ''} placeholder="DD/MM/YYYY" readOnly
                                    style={{ backgroundColor: '#132f38', color: '#fff', cursor: 'pointer' }}
                                    onClick={(e) => { const next = e.target.nextElementSibling; if (next && next.showPicker) next.showPicker(); }}
                                  />
                                  <input type="date"
                                    min={checkIn ? (() => { const d = new Date(checkIn); d.setDate(d.getDate() + 1); return d.toLocaleDateString('en-CA'); })() : ''}
                                    value={checkOut}
                                    onChange={e => setCheckOut(e.target.value)}
                                    style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}
                                  />
                                </div>
                              </div>
                            </>
                          )}
                        </div>

                        <div className="booking-group" style={{ marginTop: '15px' }}>
                          <label className="booking-label">{activeTab === 'tours' ? 'Number of Participants' : 'Number of Rooms'}</label>
                          <input type="number" className="booking-input" value={bookingQty}
                            min="1"
                            max={activeTab === 'tours' ? selectedItem.availableSlots : selectedItem.availableRooms}
                            onChange={e => setBookingQty(Math.max(1, parseInt(e.target.value) || 1))} />
                        </div>

                        <div className="booking-summary">
                          {activeTab === 'tours' ? (
                            <>
                              {travelDate && <div className="booking-summary-row"><span>Travel Date</span><span>{new Date(travelDate + "T00:00:00").toLocaleDateString("en-GB")}</span></div>}
                              <div className="booking-summary-row booking-summary-total">
                                <span>{bookingQty} x ${(selectedItem.price || 0).toLocaleString()}</span>
                                <strong>${(bookingQty * selectedItem.price).toLocaleString()}</strong>
                              </div>
                            </>
                          ) : (
                            (() => {
                              const nights = checkIn && checkOut ? Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000)) : 1;
                              return (
                                <>
                                  {checkIn && checkOut && <div className="booking-summary-row"><span>Stay</span><span>{new Date(checkIn + "T00:00:00").toLocaleDateString("en-GB")} - {new Date(checkOut + "T00:00:00").toLocaleDateString("en-GB")}</span></div>}
                                  <div className="booking-summary-row booking-summary-total">
                                    <span>{bookingQty} room{bookingQty > 1 ? 's' : ''} x {nights} night{nights > 1 ? 's' : ''} x ${(selectedItem.pricePerNight || 0).toLocaleString()}</span>
                                    <strong>${(bookingQty * nights * selectedItem.pricePerNight).toLocaleString()}</strong>
                                  </div>
                                </>
                              );
                            })()
                )}
              </div>

              <div className="booking-actions">
                <button type="button" className="btn-booking-cancel" onClick={() => setShowBookingForm(false)} disabled={bookingLoading}>Back</button>
                <button type="button" className="btn-booking-confirm" onClick={handleConfirmBooking} disabled={bookingLoading}>
                  {bookingLoading ? <><Loader size={16} className="spin-icon" style={{marginRight:'6px'}}/> Processing...</> : <><CheckCircle size={16} style={{ marginRight: '6px' }} /> Confirm Booking</>}
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="btn-book-now" onClick={handleBookNowClick}>Book Now</button>
          )
        ) : (
          <div className="admin-controls" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', padding: '1rem', backgroundColor: '#132f38', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)', position: 'relative', zIndex: 9998, pointerEvents: 'auto' }}>
            <label className="admin-toggle-label" style={{ position: 'relative', zIndex: 9999, pointerEvents: 'auto', marginRight: 'auto' }}>
              <input 
                type="checkbox" 
                className="admin-toggle-input"
                checked={selectedItem.isActive || false}
                onChange={(e) => handleToggleActive(e.target.checked, selectedItem)}
              />
              <div className="admin-toggle-bg"></div>
              <span className="admin-toggle-text">{selectedItem.isActive ? 'Active' : 'Inactive'}</span>
            </label>

            <button onClick={() => setIsEditModalOpen(true)} style={{ position: 'relative', zIndex: 9999, pointerEvents: 'auto', backgroundColor: '#0d9488', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.25rem', border: 'none', cursor: 'pointer' }}>
              Edit Details
            </button>
            
            <button onClick={() => handleDelete(selectedItem?.id || selectedItem?._id)} style={{ position: 'relative', zIndex: 9999, pointerEvents: 'auto', border: '1px solid #ef4444', color: '#f87171', backgroundColor: 'transparent', padding: '0.5rem 1rem', borderRadius: '0.25rem', cursor: 'pointer' }}>
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
</div>
)}

{/* Render Edit Modal for Admins */}
{isEditModalOpen && selectedItem && (
  <EditDestinationModal 
    item={selectedItem}
    activeTab={activeTab}
    token={token}
    onClose={() => setIsEditModalOpen(false)}
    onUpdate={(updatedData) => {
      setSelectedItem(updatedData);
      setIsEditModalOpen(false);
      pushToast('Successfully updated.', 'success');
      if (activeTab === 'tours') fetchTours();
      else fetchHotels();
    }}
  />
)}
</div>
);
}
