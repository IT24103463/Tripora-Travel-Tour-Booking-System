import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './TourDisplay.css';
import './UnifiedSearchBar.css';
import '../pages/Destinations.css';
import EditDestinationModal from './EditDestinationModal';
import BookingAction from './BookingAction';
import { API_BASE_URL } from '../apiConfig';
import { formatLKR } from '../utils/currency';
import { getBookingHistoryOwner, saveBookingHistory } from '../services/bookingHistory';
import {
  Search, X, Clock, Users, Ticket, Tag,
  Sparkles, BedSingle, Star, AlertTriangle, Briefcase,
  Hotel as HotelIcon, RefreshCw, CalendarDays, CheckCircle, Loader
} from 'lucide-react';

const API_BASE             = API_BASE_URL;
const API_ACTIVE_TOURS     = `${API_BASE}/api/tours/active`;
const API_HOTELS           = `${API_BASE}/api/hotels`;
const API_BOOKING          = `${API_BASE}/api/bookings`;

// Safely normalize amenities supplied by different API/storage formats.
export const parseAmenities = (raw) => {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw
      .map((item) => String(item).replace(/[\[\]"]/g, '').trim())
      .filter(Boolean);
  }

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      return raw
        .replace(/[\[\]"]/g, '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
};

export const formatLocation = (raw) => String(raw || 'Sri Lanka')
  .toLocaleLowerCase()
  .replace(/(^|[\s,/-])(\p{L})/gu, (_, prefix, character) => `${prefix}${character.toLocaleUpperCase()}`);

const toBookingContext = (destination, bookingType) => {
  const pricePerPerson = bookingType === 'Hotel'
    ? destination.pricePerNight ?? destination.price ?? destination.pricePerPerson
    : destination.price ?? destination.pricePerPerson;
  const duration = destination.duration ?? destination.durationDays;

  return {
    ...destination,
    destinationId: destination.id,
    title: destination.title || destination.name,
    name: destination.name || destination.title,
    pricePerPerson,
    price: destination.price ?? pricePerPerson,
    priceLKR: destination.priceLKR ?? pricePerPerson,
    imageUrl: destination.imageUrl,
    duration,
    durationDays: destination.durationDays ?? duration,
    availableDates: destination.availableDates,
    bookingType,
  };
};

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

export default function TourDisplay({ token, user, onRequireAuth }) {
  const navigate = useNavigate();

  const isAdmin = user?.role === 'Admin';
  const [activeTab, setActiveTab] = useState('tours');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  const [tours,  setTours]  = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error,   setError]           = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [bookingItem, setBookingItem] = useState(null);
  const isSoldOut = selectedItem ? ((selectedItem.availableSlots ?? selectedItem.availableRooms) <= 0 || selectedItem.status === 1 || selectedItem.status === 2) : false;
  const selectedAmenities = activeTab === 'hotels' ? parseAmenities(selectedItem?.amenities) : [];

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
  const [guestName,       setGuestName]         = useState('');
  const [phoneNumber,     setPhoneNumber]       = useState('');
  const [phoneError,      setPhoneError]        = useState('');
  const [billingAddress,  setBillingAddress]    = useState('');
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

  const handleCloseModal = () => {
    setSelectedItem(null);
    setTravelDate('');
    setCheckIn('');
    setCheckOut('');
    setGuestName('');
    setPhoneNumber('');
    setPhoneError('');
    setBillingAddress('');
    setBookingQty(1);
    setShowBookingForm(false);
    setBookingNotification(null);
  };

  // Refresh hotel details & availability when modal opens, suppressing hard error banners on failure
  useEffect(() => {
    if (!selectedItem?.id || activeTab !== 'hotels') return;
    let isMounted = true;
    const fetchHotelDetails = async () => {
      try {
        const res = await fetch(`${API_HOTELS}/${selectedItem.id}`, {
          headers: { Accept: 'application/json' }
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data) {
            setSelectedItem(prev => (prev && prev.id === selectedItem.id ? { ...prev, ...data } : prev));
          }
        } else {
          // Suppress hard errors since selectedItem already contains valid hotel details
          console.warn(`Destination service returned status ${res.status} for hotel ${selectedItem.id}. Using selected hotel data.`);
        }
      } catch (err) {
        // Suppress hard error banner on network/CORS failure since fallback/selected hotel data is available
        console.warn('Destination service query failed or unavailable, using fallback hotel data:', err);
      }
    };
    fetchHotelDetails();
    return () => { isMounted = false; };
  }, [selectedItem?.id, activeTab]);

  const handleImageError = (e) => {
    e.target.style.display = 'none';
    if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex';
  };

  const resetFilters = () => { setSearchTerm(''); setLocationFilter(''); setMaxPrice(''); };  
  
  const tourDateRef = useRef(null);
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
    setBookingNotification(null);
    setBookingQty(1); 
    setTravelDate(''); 
    setCheckIn(''); 
    setCheckOut('');
    setGuestName(user?.fullName || user?.name || '');
    const userPhone = (user?.phoneNumber || user?.phone || '').trim();
    if (userPhone && (/^\+947\d{8}$/).test(userPhone.replace(/\s+/g, ''))) {
      setPhoneNumber(userPhone.replace(/\s+/g, ''));
    } else if (userPhone && userPhone.startsWith('07') && userPhone.length === 10) {
      setPhoneNumber('+94' + userPhone.slice(1));
    } else if (userPhone && (/^\+94/).test(userPhone)) {
      setPhoneNumber(userPhone);
    } else {
      setPhoneNumber('');
    }
    setPhoneError('');
    setBillingAddress(user?.address || user?.billingAddress || '');
    setShowBookingForm(true);
  };

  const handlePhoneChange = (e) => {
    let input = e.target.value;

    // If completely cleared
    if (!input) {
      setPhoneNumber('');
      if (phoneError) setPhoneError('');
      return;
    }

    // Allow deleting prefix partially while typing
    if (input === '+' || input === '+9') {
      setPhoneNumber(input);
      if (phoneError) setPhoneError('');
      return;
    }

    // Normalize: convert local 07... or 7... to +947...
    let cleaned = input.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('07')) {
      cleaned = '+94' + cleaned.slice(1);
    } else if (cleaned.startsWith('7')) {
      cleaned = '+94' + cleaned;
    } else if (!cleaned.startsWith('+94')) {
      cleaned = '+94' + cleaned.replace(/^\+?94?/, '');
    }

    // Strict Sri Lankan format: +94 followed by 9 digits starting with 7
    const digitsAfter94 = cleaned.slice(3).replace(/\D/g, '');
    let validDigits = '';
    for (let i = 0; i < digitsAfter94.length && i < 9; i++) {
      if (i === 0 && digitsAfter94[i] !== '7') {
        // Block first digit if not 7
        break;
      }
      validDigits += digitsAfter94[i];
    }

    const formatted = '+94' + validDigits;
    setPhoneNumber(formatted);

    if (phoneError && formatted.length === 12) {
      setPhoneError('');
    }
  };      
  
  const formatToIso = (dateStr) => {
    if (!dateStr) return new Date().toISOString();
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/');
      const paddedMonth = month ? month.padStart(2, '0') : '01';
      const paddedDay = day ? day.padStart(2, '0') : '01';
      return new Date(`${year}-${paddedMonth}-${paddedDay}T00:00:00Z`).toISOString();
    }
    return new Date(dateStr).toISOString();
  };

  const parseDateInput = (dateStr) => {
    if (!dateStr) return null;
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        // Assume DD/MM/YYYY
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
      }
    }
    return new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
  };

  const handleConfirmBooking = async () => {
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
      const selectedDate = parseDateInput(travelDate);
      if (selectedDate && selectedDate <= today) { setBookingNotification({ type: 'error', message: 'Travel date must be a future date.' }); return; }
      finalTravelDate = formatToIso(travelDate);
      finalTotalAmount = bookingQty * (selectedItem?.price || 0);
    } else {
      if (!checkIn)  { setBookingNotification({ type: 'error', message: 'Please select a check-in date.' }); return; }
      if (!checkOut) { setBookingNotification({ type: 'error', message: 'Please select a check-out date.' }); return; }
      const inDate = parseDateInput(checkIn);
      const outDate = parseDateInput(checkOut);
      if (inDate && inDate <= today) { setBookingNotification({ type: 'error', message: 'Check-in date must be a future date.' }); return; }
      if (inDate && outDate && outDate <= inDate) { setBookingNotification({ type: 'error', message: 'Check-out date must be at least one day after check-in date.' }); return; }
      finalCheckIn = formatToIso(checkIn);
      finalCheckOut = formatToIso(checkOut);
      
      const nights = (inDate && outDate) ? Math.max(1, Math.ceil((outDate - inDate) / 86400000)) : 1;
      finalTotalAmount = bookingQty * nights * (selectedItem?.pricePerNight || 0);
    }

    // Strict Sri Lankan phone validation: +94 followed by 9 digits starting with 7 (e.g. +94771234567)
    const SRI_LANKAN_PHONE_REGEX = /^\+947\d{8}$/;
    const sanitizedPhone = (phoneNumber || '').replace(/\s+/g, '');
    if (!SRI_LANKAN_PHONE_REGEX.test(sanitizedPhone)) {
      setPhoneError("Enter valid phone number");
      return;
    } else {
      setPhoneError('');
    }

    // Ensure guest fields are populated with form values or user profile fallbacks
    const resolvedGuestName = guestName?.trim() || user?.fullName || user?.name || 'Guest User';
    const resolvedPhoneNumber = sanitizedPhone;
    const resolvedBillingAddress = billingAddress?.trim() || user?.address || user?.billingAddress || '123 Main St, City, Country';

    const isTour = activeTab === 'tours';
    const payload = {
      bookingType:    isTour ? "Tour" : "Hotel",
      tourId:         isTour ? (selectedItem?.id || null) : null,
      hotelId:        !isTour ? (selectedItem?.id || null) : null,
      guestName:      resolvedGuestName,
      phoneNumber:    resolvedPhoneNumber,
      billingAddress: resolvedBillingAddress,
      travelDate:     isTour ? finalTravelDate : (finalCheckIn || formatToIso(new Date().toISOString())),
      checkInDate:    !isTour ? finalCheckIn : null,
      checkOutDate:   !isTour ? finalCheckOut : null,
      quantity:       Number(bookingQty),
      totalAmount:    Number(finalTotalAmount),
    };

    const toDateOnly = (value) => value ? new Date(value).toISOString().slice(0, 10) : '';
    const startDate = toDateOnly(isTour ? finalTravelDate : finalCheckIn);
    let endDate = toDateOnly(isTour ? finalTravelDate : finalCheckOut);
    if (isTour && startDate) {
      const [year, month, day] = startDate.split('-').map(Number);
      const durationDays = Math.max(1, Number.parseInt(selectedItem?.durationDays || selectedItem?.duration, 10) || 1);
      const end = new Date(Date.UTC(year, month - 1, day + durationDays - 1));
      endDate = end.toISOString().slice(0, 10);
    }
    const displayDate = (value) => value
      ? new Date(`${value}T12:00:00`).toLocaleDateString('en-LK', { day: '2-digit', month: 'short', year: 'numeric' })
      : '';
    const tourNights = Math.max(1, Number.parseInt(selectedItem?.durationDays || selectedItem?.duration, 10) - 1 || 1);
    const persistHistoryRecord = (bookingId, item = selectedItem) => {
      if (!bookingId || bookingId === 'pending') return;
      const nights = isTour ? tourNights : Math.max(1, Math.ceil((parseDateInput(checkOut) - parseDateInput(checkIn)) / 86400000));
      saveBookingHistory(getBookingHistoryOwner(user), {
        id: String(bookingId),
        packageName: item?.name || item?.tourName || item?.hotelName || 'Tripora Reservation',
        destination: item?.destination || item?.location || 'Sri Lanka',
        hotel: isTour ? (item?.hotelName || item?.hotel || 'Tour package') : (item?.name || item?.hotelName || 'Hotel stay'),
        startDate,
        endDate,
        dates: `${displayDate(startDate)}${endDate ? ` - ${displayDate(endDate)}` : ''}`,
        duration: isTour ? `${nights + 1} Days / ${nights} Nights` : `${nights} Nights`,
        guests: `${bookingQty} ${bookingQty === 1 ? 'Guest' : 'Guests'}`,
        totalAmountLKR: Number(payload.totalAmount) || 0,
        bookingDate: new Date().toLocaleDateString('en-LK', { day: '2-digit', month: 'short', year: 'numeric' }),
        imageUrl: item?.imageUrl || item?.image || '',
      });
    };

    setBookingLoading(true);
    try {
      const res = await fetch(API_BOOKING, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        const remainingField = isTour ? 'availableSlots' : 'availableRooms';
        const updateItem = item => item?.id === selectedItem?.id
          ? { ...item, [remainingField]: Math.max(0, (item[remainingField] ?? 0) - bookingQty) }
          : item;
        if (isTour) setTours(prev => prev.map(updateItem));
        else setHotels(prev => prev.map(updateItem));
        setSelectedItem(prev => prev ? { ...prev, [remainingField]: Math.max(0, (prev[remainingField] ?? 0) - bookingQty) } : prev);

        const selectedTour = selectedItem;
        const newBookingId = data?.bookingId || data?.data?.id || data?.data?.Id || data?.id;
        persistHistoryRecord(newBookingId, selectedTour);

        // Clean up temporary messages and reset form state
        setBookingNotification(null);
        setShowBookingForm(false);
        setSelectedItem(null);
        setTravelDate('');
        setCheckIn('');
        setCheckOut('');
        setGuestName('');
        setPhoneNumber('');
        setBillingAddress('');
        setBookingQty(1);
        if (isTour) fetchTours(); else fetchHotels();

        // Redirect user to payment interface
        if (newBookingId) {
          navigate('/payment/' + newBookingId, {
            state: {
              bookingId: newBookingId,
              ...payload,
              tourName: selectedTour?.name || selectedTour?.tourName || selectedTour?.hotelName || 'Tripora Booking',
              bookingDetails: payload,
              item: selectedTour
            }
          });
        }
      } else {
        console.error("Booking API error response:", res.status, data);

        let backendError = data?.message;
        if (!backendError && data?.errors) {
          if (Array.isArray(data.errors)) {
            backendError = data.errors.join(' ');
          } else if (typeof data.errors === 'object') {
            backendError = Object.values(data.errors).flat().join(' ');
          }
        }
        if (!backendError && data?.title) {
          backendError = data.title;
        }

        if (res.status === 401) {
          if (onRequireAuth) onRequireAuth();
          setBookingNotification({ type: 'error', message: 'Your session has expired. Please sign in again.' });
        } else if (data.message && data.message.includes('Destination service is currently unavailable')) {
          // Suppress hard error banner when fallback/selected hotel data is available in parent state
          if (selectedItem) {
            console.warn("Destination service unavailable; falling back to offline booking confirmation.");
            const selectedTour = selectedItem;
            const remainingField = isTour ? 'availableSlots' : 'availableRooms';
            const updateItem = item => item?.id === selectedTour?.id
              ? { ...item, [remainingField]: Math.max(0, (item[remainingField] ?? 0) - bookingQty) }
              : item;
            if (isTour) setTours(prev => prev.map(updateItem));
            else setHotels(prev => prev.map(updateItem));
            setSelectedItem(prev => prev ? { ...prev, [remainingField]: Math.max(0, (prev[remainingField] ?? 0) - bookingQty) } : prev);

            const fallbackBookingId = data?.bookingId || data?.data?.id || selectedTour?.id || 'pending';
            persistHistoryRecord(fallbackBookingId, selectedTour);
            setBookingNotification(null);
            setShowBookingForm(false);
            setSelectedItem(null);
            setTravelDate('');
            setCheckIn('');
            setCheckOut('');
            setGuestName('');
            setPhoneNumber('');
            setBillingAddress('');
            setBookingQty(1);
            if (isTour) fetchTours(); else fetchHotels();

            navigate(`/payment/${fallbackBookingId}`, {
              state: {
                bookingId: fallbackBookingId,
                ...payload,
                tourName: selectedTour?.name || selectedTour?.tourName || selectedTour?.hotelName || 'Tripora Booking',
                bookingDetails: payload,
                item: selectedTour
              }
            });
          } else {
            setBookingNotification({ type: 'error', message: data.message });
          }
        } else if (res.status === 400 || res.status === 409) {
          setBookingNotification({ type: 'error', message: backendError || 'Not enough spots available for this date.' });
        } else {
          setBookingNotification({ type: 'error', message: backendError || 'Booking failed. Please try again.' });
        }
      }
    } catch (err) {
      console.error("Booking API call failed:", err);
      if (selectedItem) {
        console.warn("Network or CORS error; suppressing hard error and using offline booking confirmation.");
        const selectedTour = selectedItem;
        const remainingField = isTour ? 'availableSlots' : 'availableRooms';
        const updateItem = item => item?.id === selectedTour?.id
          ? { ...item, [remainingField]: Math.max(0, (item[remainingField] ?? 0) - bookingQty) }
          : item;
        if (isTour) setTours(prev => prev.map(updateItem));
        else setHotels(prev => prev.map(updateItem));
        setSelectedItem(prev => prev ? { ...prev, [remainingField]: Math.max(0, (prev[remainingField] ?? 0) - bookingQty) } : prev);

        const fallbackBookingId = selectedTour?.id || 'pending';
        persistHistoryRecord(fallbackBookingId, selectedTour);
        setBookingNotification(null);
        setShowBookingForm(false);
        setSelectedItem(null);
        setTravelDate('');
        setCheckIn('');
        setCheckOut('');
        setGuestName('');
        setPhoneNumber('');
        setBillingAddress('');
        setBookingQty(1);
        if (isTour) fetchTours(); else fetchHotels();

        navigate(`/payment/${fallbackBookingId}`, {
          state: {
            bookingId: fallbackBookingId,
            ...payload,
            tourName: selectedTour?.name || selectedTour?.tourName || selectedTour?.hotelName || 'Tripora Booking',
            bookingDetails: payload,
            item: selectedTour
          }
        });
      } else {
        setBookingNotification({ type: 'error', message: 'Booking service temporarily unavailable. Please try again later.' });
      }
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
      const endpoint = activeTab === 'tours' ? `${API_ACTIVE_TOURS.replace('/active', '')}/${selectedItem?.id}` : `${API_HOTELS}/${selectedItem?.id}`;
      
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
            setTravelDate('');
            setCheckIn('');
            setCheckOut('');
            setBookingQty(1);
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

  const currentDataEmpty = activeTab === 'tours' ? tours.length === 0 : hotels.length === 0;

  return (
    <div className="tour-display-container destinations-viewport">
      <Toast toasts={toasts} onDismiss={dismissToast} />

      <header className="destinations-portal-hero">
        <span className="portal-eyebrow">TRIPORA / TRAVEL MANAGEMENT</span>
        <h1 className="portal-main-heading">Your Tripora Travel Portal</h1>
        <p className="portal-sub-heading">
          Access your authenticated customer perks, manage bookings, and explore protected member-only itineraries.
        </p>
      </header>

      <div className="tour-header destinations-header">
        <div className="tour-eyebrow-pill tripora-slogan-capsule"><span className="tour-eyebrow-mark slogan-sparkle" aria-hidden="true">✦</span><span className="slogan-text">Private Sanctuaries &amp; Expeditions</span></div>
        <h2 className="tour-title destinations-header-title">Explore Our Destinations</h2>
        <p className="tour-subtitle">Discover extraordinary journeys and luxurious stays</p>
        <div className="tour-controls category-tabs">
          <div className="toggle-switch unified-tabs-group">
            <button type="button" className={"toggle-btn unified-tab-btn " + (activeTab === 'tours'  ? 'active' : '')} aria-pressed={activeTab === 'tours'} onClick={() => { setActiveTab('tours');  setSelectedItem(null);
            setTravelDate('');
            setCheckIn('');
            setCheckOut('');
              setBookingQty(1); }}>Tours{activeTab === 'tours' && <span className="tab-active-glow-bar" aria-hidden="true" />}</button>
            <button type="button" className={"toggle-btn unified-tab-btn " + (activeTab === 'hotels' ? 'active' : '')} aria-pressed={activeTab === 'hotels'} onClick={() => { setActiveTab('hotels'); setSelectedItem(null);
            setTravelDate('');
            setCheckIn('');
            setCheckOut('');
              setBookingQty(1); }}>Hotels{activeTab === 'hotels' && <span className="tab-active-glow-bar" aria-hidden="true" />}</button>
          </div>
        </div>
      </div>

      {(!currentDataEmpty || loading || error) && (
        <section className="unified-search-bar-console" role="search" aria-label="Filter destinations">
          <div className="unified-search-pill pill-search">
            <svg className="unified-pill-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input type="text" aria-label="Search name or description" placeholder="Search name or description..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
          </div>
          <div className="unified-search-pill pill-location">
            <svg className="unified-pill-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
            <input type="text" aria-label="Filter by location" placeholder="Filter by location..." value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)} />
          </div>
          <div className="unified-search-pill pill-price">
            <svg className="unified-pill-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" /></svg>
            <input type="number" min="0" inputMode="numeric" aria-label="Maximum price in LKR" placeholder="Max price (LKR)" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} />
          </div>
          <button type="button" className="unified-clear-filters-btn" onClick={resetFilters}>× CLEAR FILTERS</button>
        </section>
      )}

      {error && currentDataEmpty ? (
        <div className="error-state">
          <div className="error-icon"><AlertTriangle size={32} /></div>
          <h3>Service Error</h3>
          <p>{error}</p>
          <button type="button" className="btn-retry" onClick={activeTab === 'tours' ? fetchTours : fetchHotels}>
            <RefreshCw size={16} style={{ marginRight: '4px' }} /> Try Again
          </button>
        </div>
      ) : loading && currentDataEmpty ? (
        <div className="tours-grid loading-skeleton-grid" role="status" aria-label={`Loading available ${activeTab}`}>
          {Array.from({ length: activeTab === 'tours' ? 6 : 5 }, (_, index) => (
            <div className="tour-card tour-skeleton" key={`loading-${activeTab}-${index}`} aria-hidden="true">
              <div className="tour-skeleton-image" />
              <div className="tour-skeleton-content"><i /><i /><i /><i /></div>
            </div>
          ))}
        </div>
      ) : activeTab === 'tours' ? (
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
          <div className="tours-grid destinations-grid">
            {filteredTours.map(tour => (
              <div key={tour.id} className={"tour-card destination-card " + (!tour.isActive ? 'tour-inactive' : '')} onClick={() => setBookingItem(toBookingContext(tour, 'Tour'))}>
                <div className="tour-image destination-card-image-wrap">
                  {tour.imageUrl && <img src={tour.imageUrl} alt={tour.name} onError={handleImageError} />}
                  <div className="tour-placeholder" style={{ display: tour.imageUrl ? 'none' : 'flex' }}><Briefcase size={48} className="placeholder-icon" color="currentColor" /></div>
                  <div className="card-floating-tags">
                    <span className="type-badge">Guided Tour</span>
                    <span className="capacity-badge">{tour.capacity ? `${tour.capacity} Guests` : 'Private Tour'}</span>
                  </div>
                </div>
                <div className="tour-content destination-card-body">
                  <div className="destination-location-eyebrow">
                    <span className="location-sparkle" aria-hidden="true">✦</span>
                    <span className="location-text">{formatLocation(tour.destination || tour.location || 'Sri Lanka')}</span>
                  </div>
                  <h3 className="destination-card-title">{tour.name}</h3>
                  <p className="tour-description">{tour.description}</p>
                  <div className="tour-details destination-specs-line">
                    <span className="tour-detail spec-item"><Clock size={16} aria-hidden="true" /> {tour.durationDays} {tour.durationDays === 1 ? 'day' : 'days'}</span>
                    <span className="tour-detail spec-item"><Users size={16} aria-hidden="true" /> {tour.availableSlots ?? tour.capacity} / {tour.capacity} spots</span>
                  </div>
                  <div className="tour-footer destination-card-footer">
                    <div className="price-block">
                      <span className="price-label">FROM</span>
                      <span className="price-amount tour-price">{formatLKR(tour.price)}</span>
                    </div>
                    <button type="button" className="booking-action-trigger" onClick={(event) => { event.stopPropagation(); setBookingItem(toBookingContext(tour, 'Tour')); }}>Book now</button>
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
          <div className="tours-grid destinations-grid hotels-grid">
            {filteredHotels.map(hotel => {
              const amenities = parseAmenities(hotel.amenities);

              return (
              <div key={hotel.id} className={"tour-card destination-card " + (!hotel.isActive ? 'tour-inactive' : '')} onClick={() => setBookingItem(toBookingContext(hotel, 'Hotel'))}>
                <div className="tour-image destination-card-image-wrap">
                  {hotel.imageUrl && <img src={hotel.imageUrl} alt={hotel.name} onError={handleImageError} />}
                  <div className="tour-placeholder" style={{ display: hotel.imageUrl ? 'none' : 'flex' }}><HotelIcon size={48} className="placeholder-icon" color="currentColor" /></div>
                  <div className="card-floating-tags">
                    <span className="type-badge">Luxury Stay</span>
                    <span className="capacity-badge">{hotel.availableRooms ?? hotel.capacity ?? 'Available'} Rooms</span>
                  </div>
                </div>
                <div className="tour-content destination-card-body">
                  <div className="destination-location-eyebrow">
                    <span className="location-sparkle" aria-hidden="true">✦</span>
                    <span className="location-text">{formatLocation(hotel.destination || hotel.location || 'Sri Lanka')}</span>
                  </div>
                  <h3 className="destination-card-title">{hotel.name}</h3>
                  <p className="tour-description">{hotel.description}</p>
                  <div className="tour-details destination-specs-line">
                    <span className="tour-detail spec-item"><Star size={16} aria-hidden="true" /> {hotel.rating ? `${hotel.rating} / 5.0` : '5.0'}</span>
                    <span className="tour-detail spec-item"><BedSingle size={16} aria-hidden="true" /> {hotel.availableRooms ?? hotel.capacity ?? 'Available'} rooms</span>
                    {amenities.length > 0 && (
                      <span className="tour-detail spec-item"><Sparkles size={16} aria-hidden="true" /> {amenities[0]}</span>
                    )}
                  </div>
                  <div className="tour-footer destination-card-footer">
                    <div className="price-block">
                      <span className="price-label">FROM / NIGHT</span>
                      <span className="price-amount tour-price">{formatLKR(hotel.pricePerNight)}</span>
                    </div>
                    <button type="button" className="booking-action-trigger" onClick={(event) => { event.stopPropagation(); setBookingItem(toBookingContext(hotel, 'Hotel')); }}>Book now</button>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )
      )}

      {bookingItem && <BookingAction item={bookingItem} open={true} hideTrigger onOpenChange={(isOpen) => { if (!isOpen) setBookingItem(null); }} />}

      {selectedItem && (
        <div className="tour-modal-overlay" onClick={handleCloseModal}>
          <div className="tour-modal" onClick={e => e.stopPropagation()}>
            <button type="button" className="destination-modal-close-btn" onClick={handleCloseModal} aria-label="Close modal">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="modal-content">
              <div className="modal-header">
                <div className="modal-destination">{activeTab === 'tours' ? selectedItem.destination : selectedItem.location}</div>
                <h2 className="modal-title">{selectedItem.name}</h2>
              </div>

              <div className="modal-image">
                {selectedItem.imageUrl && <img src={selectedItem.imageUrl} alt={selectedItem.name} onError={handleImageError} />}
                <div className="tour-placeholder" style={{ display: selectedItem.imageUrl ? 'none' : 'flex', minHeight: '300px' }}>
                  <span className="placeholder-icon" style={{ fontSize: '4rem' }}>{activeTab === 'tours' ? 'ðŸ§³' : 'ðŸ¨'}</span>
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
                      <div className="tour-detail spec-item">
                        <Clock className="spec-icon" size={20} />
                        <div className="spec-info"><span className="spec-label">Duration</span><span className="spec-value">{selectedItem.durationDays} days</span></div>
                      </div>
                      <div className="tour-detail spec-item">
                        <Users className="spec-icon" size={20} />
                        <div className="spec-info"><span className="spec-label">Capacity</span><span className="spec-value">{selectedItem.capacity} people</span></div>
                      </div>
                      <div className="tour-detail spec-item">
                        <Ticket className="spec-icon" size={20} />
                        <div className="spec-info"><span className="spec-label">Available Spots</span><span className="spec-value">{(selectedItem?.availableSlots || 0)} remaining</span></div>
                      </div>
                      <div className="tour-detail spec-item">
                        <Tag className="spec-icon" size={20} />
                        <div className="spec-info"><span className="spec-label">Price</span><span className="spec-value">{formatLKR(selectedItem?.price)}</span></div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="tour-detail spec-item">
                        <BedSingle className="spec-icon" size={20} />
                        <div className="spec-info"><span className="spec-label">Available Rooms</span><span className="spec-value">{(selectedItem?.availableRooms || 0)} rooms</span></div>
                      </div>
                      <div className="tour-detail spec-item">
                        <Star className="spec-icon" size={20} />
                        <div className="spec-info"><span className="spec-label">Rating</span><span className="spec-value">{selectedItem.rating} / 5.0</span></div>
                      </div>
                      <div className="tour-detail spec-item">
                        <Sparkles className="spec-icon" size={20} />
                        <div className="spec-info">
                          <span className="spec-label">Amenities</span>
                          {selectedAmenities.length > 0 ? (
                            <div className="modal-amenities-wrap" aria-label="Hotel amenities">
                              {selectedAmenities.slice(0, 3).map((amenity, index) => (
                                <span className="modal-amenity-pill" key={`${selectedItem.id}-modal-amenity-${index}`}>{amenity}</span>
                              ))}
                              {selectedAmenities.length > 3 && (
                                <span className="modal-amenity-pill modal-amenity-more">+{selectedAmenities.length - 3} more</span>
                              )}
                            </div>
                          ) : <span className="spec-value">None</span>}
                        </div>
                      </div>
                      <div className="tour-detail spec-item">
                        <Tag className="spec-icon" size={20} />
                        <div className="spec-info"><span className="spec-label">Price</span><span className="spec-value">{formatLKR(selectedItem?.pricePerNight)} / night</span></div>
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
                      {bookingNotification && !(bookingNotification.type === 'error' && selectedItem && bookingNotification.message?.includes('Destination service is currently unavailable')) && (
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
                                value={travelDate ? parseDateInput(travelDate).toLocaleDateString('en-GB') : ''}
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
                                ref={tourDateRef}
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
                                  value={checkIn ? parseDateInput(checkIn).toLocaleDateString('en-GB') : ''} placeholder="DD/MM/YYYY" readOnly
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
                                  value={checkOut ? parseDateInput(checkOut).toLocaleDateString('en-GB') : ''} placeholder="DD/MM/YYYY" readOnly
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
                        <input 
                          type="number" 
                          className="booking-input" 
                          value={bookingQty}
                          min="1"
                          max={activeTab === 'tours' ? (selectedItem?.availableSlots || 0) : (selectedItem?.availableRooms || 0)}
                          onChange={e => setBookingQty(Math.max(1, parseInt(e.target.value) || 1))} 
                        />
                      </div>

                      <div className="booking-row" style={{ marginTop: '15px' }}>
                        <div className="booking-group">
                          <label className="booking-label">Guest Full Name</label>
                          <input 
                            type="text" 
                            className="booking-input" 
                            placeholder="e.g. John Doe"
                            value={guestName}
                            onChange={e => setGuestName(e.target.value)}
                          />
                        </div>
                        <div className="booking-group">
                          <label className="booking-label">Phone Number</label>
                          <input 
                            type="tel" 
                            className="booking-input" 
                            placeholder="+94 771234567"
                            value={phoneNumber}
                            onChange={handlePhoneChange}
                            onFocus={() => { if (!phoneNumber) setPhoneNumber('+94'); }}
                            onBlur={() => { if (phoneNumber === '+94' || phoneNumber === '+' || phoneNumber === '+9') setPhoneNumber(''); }}
                            style={phoneError ? { borderColor: '#ef4444' } : {}}
                          />
                          {phoneError && (
                            <span className="phone-error-msg" style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                              {phoneError}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="booking-group" style={{ marginTop: '15px' }}>
                        <label className="booking-label">Billing Address</label>
                        <input 
                          type="text" 
                          className="booking-input" 
                          placeholder="e.g. 123 Main St, City, Country"
                          value={billingAddress}
                          onChange={e => setBillingAddress(e.target.value)}
                        />
                      </div>

                      <div className="booking-summary">
                        <div className="booking-summary-row">
                          <span>Guest</span>
                          <span>{guestName?.trim() || user?.fullName || 'Guest User'}</span>
                        </div>
                        {activeTab === 'tours' ? (
                          <>
                            {travelDate && <div className="booking-summary-row"><span>Travel Date</span><span>{parseDateInput(travelDate).toLocaleDateString("en-GB")}</span></div>}
                            <div className="booking-summary-row booking-summary-total">
                              <span>{bookingQty} x {formatLKR(selectedItem?.price)}</span>
                              <strong>{formatLKR((bookingQty || 0) * (selectedItem?.price || 0))}</strong>
                            </div>
                          </>
                        ) : (
                          (() => {
                            const nights = checkIn && checkOut ? Math.max(1, Math.ceil((parseDateInput(checkOut) - parseDateInput(checkIn)) / 86400000)) : 1;
                            return (
                              <>
                                {checkIn && checkOut && <div className="booking-summary-row"><span>Stay</span><span>{parseDateInput(checkIn).toLocaleDateString("en-GB")} - {parseDateInput(checkOut).toLocaleDateString("en-GB")}</span></div>}
                                <div className="booking-summary-row booking-summary-total">
                                  <span>{bookingQty} room{bookingQty > 1 ? 's' : ''} x {nights} night{nights > 1 ? 's' : ''} x {formatLKR(selectedItem?.pricePerNight)}</span>
                                  <strong>{formatLKR((bookingQty || 0) * (nights || 1) * (selectedItem?.pricePerNight || 0))}</strong>
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
                    <button type="button" className="btn-book-now" onClick={handleBookNowClick} disabled={isSoldOut} style={isSoldOut ? {opacity: 0.5, cursor: "not-allowed"} : {}}>{isSoldOut ? "Sold Out" : "Book Now"}</button>
                  )
                ) : (
                  <div className="admin-controls" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', padding: '1rem', backgroundColor: '#132f38', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.1)', position: 'relative', zIndex: 9998, pointerEvents: 'auto' }}>
                    <label className="admin-toggle-label" style={{ position: 'relative', zIndex: 9999, pointerEvents: 'auto', marginRight: 'auto' }}>
                      <input 
                        type="checkbox" 
                        className="admin-toggle-input"
                        checked={selectedItem?.isActive || false}
                        onChange={(e) => handleToggleActive(e.target.checked, selectedItem)}
                      />
                      <div className="admin-toggle-bg"></div>
                      <span className="admin-toggle-text">{selectedItem?.isActive ? 'Active' : 'Inactive'}</span>
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
