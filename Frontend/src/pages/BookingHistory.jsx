import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Clock3, MapPin, Users, X } from 'lucide-react';
import { formatLKR } from '../utils/currency';
import { API_BASE_URL } from '../apiConfig';
import { computeBookingStatus } from '../services/bookingHistory';
import './BookingHistory.css';

const FILTERS = [
  ['ALL', 'All Expeditions'],
  ['ONGOING', 'Ongoing'],
  ['FINISHED', 'Finished'],
];

const unwrapList = (payload) => {
  const list = Array.isArray(payload) ? payload : (payload?.data || payload?.items || []);
  return Array.isArray(list) ? list : [];
};
const itemId = (item) => String(item?.id ?? item?.Id ?? item?._id ?? '');
const prettyDate = (value) => {
  if (!value) return '';
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-LK', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function BookingHistory({ token }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('ALL');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const loadBookings = async (silent = false) => {
      if (!silent) setLoading(true);
      setError('');
      try {
        if (!token) throw new Error('Sign in to view your bookings.');
        const headers = { Accept: 'application/json', Authorization: `Bearer ${token}` };
        const [response, toursResult, hotelsResult, packagesResult] = await Promise.all([
          fetch(`${API_BASE_URL}/api/bookings/my-history`, { headers }),
          fetch(`${API_BASE_URL}/api/tours/active`, { headers }).then((res) => res.ok ? res.json() : []).catch(() => []),
          fetch(`${API_BASE_URL}/api/hotels?includeInactive=true`, { headers }).then((res) => res.ok ? res.json() : []).catch(() => []),
          fetch(`${API_BASE_URL}/api/packages`, { headers }).then((res) => res.ok ? res.json() : []).catch(() => []),
        ]);
        const payload = await response.json().catch(() => []);
        if (!response.ok) throw new Error(payload?.message || 'Unable to load your booking history.');
        const tours = unwrapList(toursResult);
        const hotels = unwrapList(hotelsResult);
        const packages = unwrapList(packagesResult);
        const records = unwrapList(payload).map((record) => {
          const bookingType = String(record.bookingType || '').toLowerCase();
          const isHotel = bookingType === 'hotel' || Boolean(record.hotelId);
          const isPackage = bookingType === 'package' || Boolean(record.packageId);
          const catalogId = isHotel ? record.hotelId : isPackage ? (record.packageId || record.itemId) : (record.tourId || record.itemId);
          const catalog = (isHotel ? hotels : isPackage ? packages : tours).find((item) => itemId(item).toLowerCase() === String(catalogId || '').toLowerCase());
          const startDate = record.startDate || record.checkInDate || record.travelDate;
          const packageDays = Math.max(1, Number(catalog?.durationDays) || 1);
          const packageEndDate = isPackage && startDate
            ? new Date(new Date(`${String(startDate).slice(0, 10)}T00:00:00Z`).getTime() + (packageDays - 1) * 86400000).toISOString().slice(0, 10)
            : null;
          const endDate = packageEndDate || record.endDate || record.checkOutDate || startDate;
          const title = catalog?.name || catalog?.title || catalog?.tourName || catalog?.packageName || catalog?.hotelName || record.title || (isHotel ? 'Hotel reservation' : isPackage ? 'Travel package reservation' : 'Tour reservation');
          const location = catalog?.destination || catalog?.destinationName || catalog?.location || record.location || 'Sri Lanka';
          const nights = Math.max(1, Math.ceil((new Date(`${String(endDate).slice(0, 10)}T00:00:00`) - new Date(`${String(startDate).slice(0, 10)}T00:00:00`)) / 86400000));
          return {
            ...record,
            id: record.id || record.bookingId,
            packageName: title,
            destination: location,
            hotel: isHotel ? title : (record.hotel || (isPackage ? 'Private travel package' : 'Tour package')),
            startDate: String(startDate || '').slice(0, 10),
            endDate: String(endDate || '').slice(0, 10),
            dates: record.dates || `${prettyDate(startDate)} - ${prettyDate(endDate)}`,
            duration: isPackage
              ? `${packageDays} Days${Number(catalog?.durationNights) ? ` / ${catalog.durationNights} Nights` : ''}`
              : record.duration || (isHotel ? `${nights} Nights` : `${nights + 1} Days`),
            guests: record.guests || `${record.quantity || 1} ${(record.quantity || 1) === 1 ? 'Guest' : 'Guests'}`,
            totalAmountLKR: record.totalAmountLKR ?? record.totalAmount ?? 0,
            bookingDate: record.bookingDate || prettyDate(record.createdAt),
            imageUrl: catalog?.imageUrl || catalog?.coverImageUrl || catalog?.image || record.imageUrl || '/sri-lanka-path.jpg',
          };
        });
        if (active) setBookings(records);
      } catch (loadError) {
        if (active) setError(loadError.message || 'Unable to load your booking history.');
      } finally {
        if (active) setLoading(false);
      }
    };
    loadBookings();
    const onFocus = () => loadBookings(true);
    window.addEventListener('focus', onFocus);
    const timer = window.setInterval(() => loadBookings(true), 60_000);
    return () => {
      active = false;
      window.removeEventListener('focus', onFocus);
      window.clearInterval(timer);
    };
  }, [token]);

  const resolvedBookings = useMemo(() => bookings.map((booking) => ({
    ...booking,
    status: computeBookingStatus(booking.startDate, booking.endDate),
  })), [bookings]);

  const filteredBookings = resolvedBookings.filter((booking) =>
    filter === 'ALL' || booking.status.toUpperCase() === filter,
  );

  return (
    <div className="booking-history-viewport">
      <section className="booking-history-stage" aria-labelledby="history-title">
        <header className="history-header">
          <div className="history-eyebrow">TRIPORA PRIVILEGE / MEMBER ARCHIVE</div>
          <div className="history-header-split">
            <div>
              <h1 className="history-title" id="history-title">Curated Journey Archive</h1>
              <p className="history-subtitle">Review your reservations and revisit your Sri Lankan escapes.</p>
            </div>
            <button type="button" className="explore-new-btn" onClick={() => navigate('/packages')}>+ Plan New Journey</button>
          </div>
        </header>

        <div className="history-filter-bar">
          <div className="filter-pill-group" role="group" aria-label="Filter bookings">
            {FILTERS.map(([value, label]) => (
              <button
                type="button"
                aria-pressed={filter === value}
                key={value}
                className={`filter-pill-btn ${filter === value ? 'active' : ''}`}
                onClick={() => setFilter(value)}
              >{label}</button>
            ))}
          </div>
          <div className="bookings-count-badge">{loading ? 'Loading reservations...' : `Showing ${filteredBookings.length} ${filteredBookings.length === 1 ? 'record' : 'records'}`}</div>
        </div>

        <div className="history-cards-container">
          {loading ? (
            Array.from({ length: 3 }, (_, index) => <div className="history-loading-card" key={`booking-skeleton-${index}`} aria-hidden="true"><div /><section><i /><i /><i /></section><aside /></div>)
          ) : error ? (
            <div className="empty-history-state"><CalendarDays size={34} aria-hidden="true" /><h2>Booking history unavailable</h2><p>{error}</p></div>
          ) : filteredBookings.length === 0 ? (
            <div className="empty-history-state">
              <CalendarDays size={34} aria-hidden="true" />
              <h2>No bookings found</h2>
              <p>You have no recorded journeys in this category.</p>
            </div>
          ) : filteredBookings.map((booking) => (
            <article className="history-card" key={booking.id}>
              <div className="history-card-thumbnail" style={{ backgroundImage: `url("${booking.imageUrl}")` }}>
                <span className={`history-status-pill ${booking.status.toLowerCase()}`}>{booking.status}</span>
              </div>
              <div className="history-card-body">
                <div className="card-top-row"><span className="booking-ref-code">{booking.id}</span><span className="booking-registered-date">Booked {booking.bookingDate}</span></div>
                <h2 className="card-package-name">{booking.packageName}</h2>
                <div className="card-destination-tag"><MapPin size={15} /><span>{booking.destination} <i>/</i> {booking.hotel}</span></div>
                <div className="card-meta-grid">
                  <div className="meta-item"><CalendarDays size={15} /><span className="meta-label">DATES</span><span className="meta-value">{booking.dates}</span></div>
                  <div className="meta-item"><Users size={15} /><span className="meta-label">PARTY</span><span className="meta-value">{booking.guests}</span></div>
                  <div className="meta-item"><span className="meta-label">TOTAL</span><span className="meta-value price-lkr">{formatLKR(booking.totalAmountLKR)}</span></div>
                </div>
              </div>
              <div className="history-card-actions">
                <button type="button" className="history-action-btn primary-action" onClick={() => setSelectedBooking(booking)}>View Details</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {selectedBooking && (
        <div className="booking-modal-overlay" onClick={() => setSelectedBooking(null)}>
          <section className="booking-modal-card" role="dialog" aria-modal="true" aria-labelledby="booking-modal-title" onClick={(event) => event.stopPropagation()}>
            <header className="booking-modal-header">
              <div><span className="history-eyebrow">RESERVATION DETAILS</span><h2 id="booking-modal-title">{selectedBooking.id}</h2></div>
              <button type="button" className="modal-close-btn" onClick={() => setSelectedBooking(null)} aria-label="Close booking details"><X size={19} /></button>
            </header>
            <div className="booking-modal-content">
              <h3>{selectedBooking.packageName}</h3>
              <p>{selectedBooking.hotel} / {selectedBooking.destination}</p>
              <div className="booking-detail-list">
                <div><span>Travel window</span><strong>{selectedBooking.dates}</strong></div>
                <div><span>Duration</span><strong><Clock3 size={14} /> {selectedBooking.duration}</strong></div>
                <div><span>Guests</span><strong>{selectedBooking.guests}</strong></div>
                <div><span>Status</span><strong className={`history-status-pill ${selectedBooking.status.toLowerCase()}`}>{selectedBooking.status}</strong></div>
                <div className="booking-total-row"><span>Total paid</span><strong>{formatLKR(selectedBooking.totalAmountLKR)}</strong></div>
              </div>
            </div>
            <footer className="booking-modal-footer">
              <button type="button" className="history-action-btn secondary-action" onClick={() => setSelectedBooking(null)}>Close</button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}
