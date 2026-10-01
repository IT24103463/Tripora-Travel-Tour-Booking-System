import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, Clock3, MessageCircle, Phone, RefreshCw, Search, Trash2 } from 'lucide-react';
import api from '../../api/apiClient';
import CrudModule from './components/CrudModule';
import './AdminDashboard.css';

const NavIcons = {
  pulse: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="rail-svg-icon"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>,
  tours: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="rail-svg-icon"><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></svg>,
  packages: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="rail-svg-icon"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>,
  hotels: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="rail-svg-icon"><path d="M3 21h18M3 7v14M21 7v14M6 11h2M6 15h2M11 11h2M11 15h2M16 11h2M16 15h2M4 7l8-4 8 4" /></svg>,
  offers: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="rail-svg-icon"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>,
  bookings: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="rail-svg-icon"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
  inquiries: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="rail-svg-icon"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
};

const navigation = [
  { id: 'overview', label: 'Command Pulse', icon: NavIcons.pulse, tag: 'Live' },
  { id: 'tours', label: 'Expeditions & Tours', icon: NavIcons.tours },
  { id: 'hotels', label: 'Sanctuaries & Stays', icon: NavIcons.hotels },
  { id: 'packages', label: 'Travel Packages', icon: NavIcons.packages },
  { id: 'offers', label: 'Promotions & Offers', icon: NavIcons.offers, special: true },
  { id: 'bookings', label: 'Reservation Ledger', icon: NavIcons.bookings },
  { id: 'inquiries', label: 'Concierge Desk', icon: NavIcons.inquiries },
];

const emptyMetrics = { confirmedExpeditions: 0, activeOffers: 0, openInquiries: 0, loading: true, lastUpdated: null };
const emptyCellStyle = { textAlign: 'center', padding: '36px', color: '#94a3b8' };
const money = (amount) => `LKR ${Number(amount || 0).toLocaleString()}`;
const formatLedgerDate = (value) => {
  if (!value) return 'Pending';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
const activeStatus = (value) => <span className={value ? 'status-badge-live' : 'status-badge-pending'}>{value ? 'Active' : 'Inactive'}</span>;
const toNumber = (value) => Number(value || 0);
const listValue = (value) => Array.isArray(value) ? value : String(value || '').split(/[\n,]/).map((item) => item.trim()).filter(Boolean);
const basePayload = (form, numberFields) => Object.fromEntries(Object.entries(form).map(([key, value]) => [key, numberFields.includes(key) ? toNumber(value) : value]));
const fallbackBookings = [
  { id: 'fallback-1', guestName: 'Amaya Perera', email: 'amaya@example.com', itemTitle: 'Yala Private Safari', travelDate: '2026-10-14', guests: 2, totalPrice: 1450, status: 'CONFIRMED' },
  { id: 'fallback-2', guestName: 'Liam Fernando', email: 'liam@example.com', itemTitle: 'Sigiriya Sunrise Escape', travelDate: '2026-10-18', guests: 4, totalPrice: 2280, status: 'CONFIRMED' },
  { id: 'fallback-3', guestName: 'Nethmi Silva', email: 'nethmi@example.com', itemTitle: 'Ella Highlands Retreat', travelDate: '2026-10-21', guests: 2, totalPrice: 1680, status: 'CONFIRMED' },
  { id: 'fallback-4', guestName: 'Daniel Jayasuriya', email: 'daniel@example.com', itemTitle: 'Galle Coastline Journey', travelDate: '2026-10-23', guests: 3, totalPrice: 1925, status: 'CONFIRMED' },
  { id: 'fallback-5', guestName: 'Kavindi Dias', email: 'kavindi@example.com', itemTitle: 'Kandy Heritage Circuit', travelDate: '2026-10-26', guests: 2, totalPrice: 1320, status: 'CONFIRMED' },
  { id: 'fallback-6', guestName: 'Owen Wickramasinghe', email: 'owen@example.com', itemTitle: 'Mirissa Whale Watching', travelDate: '2026-10-29', guests: 5, totalPrice: 2450, status: 'CONFIRMED' },
];
const bookingField = (booking, keys, fallback = '—') => keys.map((key) => booking?.[key]).find((value) => value !== undefined && value !== null && value !== '') ?? fallback;
const bookingStatus = (booking) => String(bookingField(booking, ['status', 'bookingStatus'], 'PENDING')).toUpperCase();
const bookingStatusClass = (status) => status.includes('CANCEL') ? 'cancelled' : status.includes('PEND') ? 'pending' : 'confirmed';

function BookingsModule() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usingFallback, setUsingFallback] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const loadBookings = async () => {
    setLoading(true);
    setError('');
    setUsingFallback(false);
    try {
      const response = await api.get('/bookings');
      setBookings(Array.isArray(response.data) ? response.data : []);
    } catch {
      setBookings(fallbackBookings);
      setUsingFallback(true);
      setError('Showing temporary expedition records while the bookings service reconnects.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBookings(); }, []);

  return <div className="stage-module-wrap bookings-module">
    <div className="stage-banner-row"><div><h2 className="stage-title">Expedition Reservations</h2><p className="stage-subtitle">Live guest reservations, travel dates, and confirmation status.</p></div><button className="stage-primary-btn" type="button" onClick={loadBookings} disabled={loading}><RefreshCw size={15} aria-hidden="true" /> Refresh</button></div>
    <section className="ledger-container bookings-ledger" aria-labelledby="bookings-ledger-title"><div className="ledger-header-row"><div><h3 className="ledger-title" id="bookings-ledger-title">Reservation ledger</h3><p className="stage-subtitle">{loading ? 'Syncing expedition records...' : `${bookings.length} ${bookings.length === 1 ? 'reservation' : 'reservations'}${usingFallback ? ' · temporary view' : ''}`}</p></div></div>
      {error && <p className="crud-error bookings-fallback-notice" role="alert">{error}</p>}
      <div className="bookings-table-wrap"><table className="crystalline-table bookings-table" aria-label="Expedition reservations"><thead><tr><th>Guest</th><th>Expedition</th><th>Travel date</th><th>Party</th><th>Total</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{loading ? <tr><td colSpan="7" style={emptyCellStyle}>Retrieving expedition reservations...</td></tr> : bookings.length === 0 ? <tr><td colSpan="7" style={emptyCellStyle}>No confirmed expeditions found.</td></tr> : bookings.map((booking, index) => { const status = bookingStatus(booking); const guests = bookingField(booking, ['guests', 'guestCount', 'partySize', 'numberOfGuests'], 1); return <tr key={booking.id || booking._id || index}><td><strong>{bookingField(booking, ['guestName', 'customerName', 'name', 'fullName'], 'Private Traveler')}</strong><span className="cell-subtext">{bookingField(booking, ['email', 'userEmail', 'guestEmail'])}</span></td><td>{bookingField(booking, ['itemTitle', 'tourName', 'packageName', 'destination'], 'Expedition')}</td><td>{formatLedgerDate(bookingField(booking, ['travelDate', 'dates', 'date', 'createdAt'], ''))}</td><td>{`${guests} ${Number(guests) === 1 ? 'Guest' : 'Guests'}`}</td><td>{money(bookingField(booking, ['totalPrice', 'amount', 'totalLKR', 'totalAmount'], 0))}</td><td><span className={`booking-status-badge ${bookingStatusClass(status)}`}>{status.charAt(0) + status.slice(1).toLowerCase()}</span></td><td><button className="row-action-btn" type="button" onClick={() => setSelectedBooking(booking)}>View</button></td></tr>; })}</tbody></table></div>
    </section>
    {selectedBooking && <div className="crud-modal-backdrop" onClick={() => setSelectedBooking(null)}><section className="crud-modal booking-detail-modal" role="dialog" aria-modal="true" aria-labelledby="booking-detail-title" onClick={(event) => event.stopPropagation()}><div className="crud-modal-header"><h3 id="booking-detail-title">Reservation details</h3><button className="crud-close" type="button" onClick={() => setSelectedBooking(null)} aria-label="Close reservation details">×</button></div><dl className="booking-detail-grid"><div><dt>Guest</dt><dd>{bookingField(selectedBooking, ['guestName', 'customerName', 'name', 'fullName'], 'Private Traveler')}</dd></div><div><dt>Email</dt><dd>{bookingField(selectedBooking, ['email', 'userEmail', 'guestEmail'])}</dd></div><div><dt>Expedition</dt><dd>{bookingField(selectedBooking, ['itemTitle', 'tourName', 'packageName', 'destination'], 'Expedition')}</dd></div><div><dt>Travel date</dt><dd>{formatLedgerDate(bookingField(selectedBooking, ['travelDate', 'dates', 'date', 'createdAt'], ''))}</dd></div><div><dt>Party size</dt><dd>{`${bookingField(selectedBooking, ['guests', 'guestCount', 'partySize', 'numberOfGuests'], 1)} guests`}</dd></div><div><dt>Total</dt><dd>{money(bookingField(selectedBooking, ['totalPrice', 'amount', 'totalLKR', 'totalAmount'], 0))}</dd></div></dl></section></div>}
  </div>;
}

function InquiriesModule({ onChanged }) {
  const [inquiries, setInquiries] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [selectedInquiry, setSelectedInquiry] = useState(null);

  const loadInquiries = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/inquiries');
      setInquiries(Array.isArray(response.data) ? response.data : []);
    } catch {
      setError('Concierge inquiries could not be loaded. Check your access and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInquiries(); }, []);

  useEffect(() => {
    if (!selectedInquiry) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSelectedInquiry(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedInquiry]);

  const updateStatus = async (inquiry) => {
    const status = inquiry.status === 'RESOLVED' ? 'UNREAD' : 'RESOLVED';
    setBusyId(inquiry.id);
    setError('');
    try {
      const response = await api.patch(`/inquiries/${inquiry.id}/status`, { status });
      setInquiries((current) => current.map((item) => item.id === inquiry.id ? response.data : item));
      onChanged();
    } catch {
      setError(`Could not update ${inquiry.name}'s inquiry. Please try again.`);
    } finally {
      setBusyId(null);
    }
  };

  const deleteInquiry = async (inquiry) => {
    if (!window.confirm(`Delete the inquiry from ${inquiry.name}? This cannot be undone.`)) return;
    setBusyId(inquiry.id);
    setError('');
    try {
      await api.delete(`/inquiries/${inquiry.id}`);
      setInquiries((current) => current.filter((item) => item.id !== inquiry.id));
      onChanged();
    } catch {
      setError(`Could not delete ${inquiry.name}'s inquiry. Please try again.`);
    } finally {
      setBusyId(null);
    }
  };

  const query = filter.trim().toLowerCase();
  const filtered = inquiries.filter((item) => [item.name, item.phoneNumber, item.reason, item.message].some((value) => value?.toLowerCase().includes(query)));
  const unreadCount = inquiries.filter((item) => item.status === 'UNREAD').length;

  return <div className="stage-module-wrap concierge-module">
    <div className="stage-banner-row"><div><h2 className="stage-title">Concierge Desk</h2><p className="stage-subtitle">Guest messages, direct contact, and resolution tracking.</p></div><button className="stage-primary-btn" type="button" onClick={loadInquiries} disabled={loading}><RefreshCw size={15} aria-hidden="true" /> Refresh</button></div>
    <section className="ledger-container concierge-ledger" aria-labelledby="concierge-ledger-title">
      <div className="ledger-header-row"><div><h3 className="ledger-title" id="concierge-ledger-title">Guest inquiries <span className="concierge-count">{unreadCount} unread</span></h3><p className="stage-subtitle">{inquiries.length} total {inquiries.length === 1 ? 'message' : 'messages'}</p></div><label className="concierge-search"><Search size={15} aria-hidden="true" /><span className="sr-only">Search inquiries</span><input type="search" placeholder="Search guest, phone, or message..." value={filter} onChange={(event) => setFilter(event.target.value)} /></label></div>
      {error && <p className="crud-error" role="alert">{error}</p>}
      <div className="concierge-list" aria-live="polite">
        {loading ? <div className="crud-empty">Loading guest inquiries...</div> : filtered.length === 0 ? <div className="crud-empty">{inquiries.length ? 'No inquiries match your search.' : 'No guest inquiries yet.'}</div> : filtered.map((inquiry) => {
          const phoneDigits = String(inquiry.phoneNumber || '').replace(/\D/g, '');
          const phoneLink = String(inquiry.phoneNumber || '').replace(/[^\d+]/g, '');
          const resolved = inquiry.status === 'RESOLVED';
          return <article className={`concierge-entry ${resolved ? 'is-resolved' : 'is-unread'}`} key={inquiry.id} role="button" tabIndex={0} onClick={() => setSelectedInquiry(inquiry)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedInquiry(inquiry); } }}>
            <div className="concierge-entry-main"><div className="concierge-entry-heading"><div><h4>{inquiry.name}</h4><span className="concierge-reason">{inquiry.reason}</span></div><span className={`concierge-status ${resolved ? 'resolved' : 'unread'}`}>{resolved ? 'RESOLVED' : 'UNREAD'}</span></div><p className="concierge-message">{inquiry.message}</p><div className="concierge-entry-meta"><span>{inquiry.phoneNumber}</span><time dateTime={inquiry.createdAt}>{inquiry.createdAt ? new Date(inquiry.createdAt).toLocaleString() : 'Date unavailable'}</time></div></div>
            <div className="concierge-entry-actions" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}><a className="concierge-icon-btn" href={`tel:${phoneLink}`} aria-label={`Call ${inquiry.name}`} title="Call guest"><Phone size={16} aria-hidden="true" /></a><a className="concierge-icon-btn whatsapp" href={`https://wa.me/${phoneDigits}`} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${inquiry.name}`} title="WhatsApp guest"><MessageCircle size={16} aria-hidden="true" /></a><button className="concierge-icon-btn status-action" type="button" onClick={() => updateStatus(inquiry)} disabled={busyId === inquiry.id} aria-label={resolved ? 'Mark unread' : 'Mark resolved'} title={resolved ? 'Mark unread' : 'Mark resolved'}>{resolved ? <Clock3 size={16} aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}</button><button className="concierge-icon-btn delete-action" type="button" onClick={() => deleteInquiry(inquiry)} disabled={busyId === inquiry.id} aria-label={`Delete inquiry from ${inquiry.name}`} title="Delete inquiry"><Trash2 size={16} aria-hidden="true" /></button></div>
          </article>;
        })}
      </div>
    </section>
    {selectedInquiry && <div className="inquiry-detail-backdrop" onClick={() => setSelectedInquiry(null)}><section className="inquiry-detail-modal" role="dialog" aria-modal="true" aria-labelledby="inquiry-detail-title" onClick={(event) => event.stopPropagation()}><button className="inquiry-detail-close" type="button" onClick={() => setSelectedInquiry(null)} aria-label="Close inquiry details">×</button><span className="inquiry-detail-eyebrow">Guest inquiry</span><h3 id="inquiry-detail-title">Inquiry from {selectedInquiry.name}</h3><div className="inquiry-detail-status-row"><span className={`concierge-status ${selectedInquiry.status === 'RESOLVED' ? 'resolved' : 'unread'}`}>{selectedInquiry.status === 'RESOLVED' ? 'RESOLVED' : 'UNREAD'}</span><span className="inquiry-detail-reason">{selectedInquiry.reason || 'General inquiry'}</span></div><p className="inquiry-detail-message">{selectedInquiry.message || 'No message was provided.'}</p><dl className="inquiry-detail-meta"><div><dt>Phone</dt><dd>{selectedInquiry.phoneNumber || 'Not provided'}</dd></div><div><dt>Received</dt><dd>{selectedInquiry.createdAt ? new Date(selectedInquiry.createdAt).toLocaleString() : 'Date unavailable'}</dd></div></dl></section></div>}
  </div>;
}

const moduleConfigs = {
  tours: {
    id: 'tours', title: 'Expeditions & Tours', plural: 'Tours', singular: 'Tour', endpoint: '/tours', deleteDescription: 'permanently remove this tour from the catalogue.',
    fields: [
      { name: 'name', label: 'Tour name', required: true }, { name: 'destination', label: 'Destination', required: true },
      { name: 'price', label: 'Price (LKR)', type: 'number', min: '0.01', step: '0.01', required: true }, { name: 'durationDays', label: 'Duration (days)', type: 'number', min: '1', required: true },
      { name: 'capacity', label: 'Capacity', type: 'number', min: '1', required: true }, { name: 'imageUrl', label: 'Image URL', type: 'url' },
      { name: 'description', label: 'Description', type: 'textarea', fullWidth: true, required: true }, { name: 'isActive', label: 'Available for booking', type: 'checkbox', defaultValue: true },
    ],
    columns: [{ label: 'Tour', render: (item) => <><strong>{item.name}</strong><span className="cell-subtext">{item.destination}</span></> }, { label: 'Duration', render: (item) => `${item.durationDays} days` }, { label: 'Capacity', render: (item) => item.availableSlots ?? item.capacity }, { label: 'Rate', render: (item) => money(item.price) }, { label: 'Status', render: (item) => activeStatus(item.isActive) }],
    toPayload: (form) => basePayload(form, ['price', 'durationDays', 'capacity']),
  },
  packages: {
    id: 'packages', title: 'Travel Packages', plural: 'Packages', singular: 'Package', endpoint: '/packages', deleteDescription: 'deactivate it so it is no longer publicly available.',
    fields: [
      { name: 'name', label: 'Package name', required: true }, { name: 'packageType', label: 'Package type', options: ['DayOut', 'CoupleEscape', 'FriendsHangout', 'MultiDayTrip'], required: true },
      { name: 'destination', label: 'Destination', required: true }, { name: 'priceLKR', label: 'Price (LKR)', type: 'number', min: '0.01', step: '0.01', required: true },
      { name: 'minGuests', label: 'Minimum guests', type: 'number', min: '1', required: true }, { name: 'maxGuests', label: 'Maximum guests', type: 'number', min: '1', required: true },
      { name: 'durationDays', label: 'Duration (days)', type: 'number', min: '1', required: true }, { name: 'durationNights', label: 'Nights', type: 'number', min: '0', required: true },
      { name: 'imageUrl', label: 'Image URL', type: 'url', required: true }, { name: 'inclusions', label: 'Inclusions (comma separated)', type: 'textarea', fullWidth: true },
      { name: 'description', label: 'Description', type: 'textarea', fullWidth: true, required: true }, { name: 'isActive', label: 'Available for booking', type: 'checkbox', defaultValue: true },
    ],
    columns: [{ label: 'Package', render: (item) => <><strong>{item.name}</strong><span className="cell-subtext">{item.destination}</span></> }, { label: 'Type', render: (item) => item.packageType }, { label: 'Guests', render: (item) => `${item.minGuests}–${item.maxGuests}` }, { label: 'Duration', render: (item) => `${item.durationDays}d / ${item.durationNights}n` }, { label: 'Rate', render: (item) => money(item.priceLKR) }, { label: 'Status', render: (item) => activeStatus(item.isActive) }],
    toPayload: (form) => ({ ...basePayload(form, ['priceLKR', 'minGuests', 'maxGuests', 'durationDays', 'durationNights']), inclusions: listValue(form.inclusions) }),
  },
  hotels: {
    id: 'hotels', title: 'Sanctuaries & Stays', plural: 'Hotels', singular: 'Hotel', endpoint: '/hotels', deleteDescription: 'permanently remove this hotel and its inventory.',
    fields: [
      { name: 'name', label: 'Hotel name', required: true }, { name: 'location', label: 'Location', required: true },
      { name: 'pricePerNight', label: 'Rate per night (LKR)', type: 'number', min: '0.01', step: '0.01', required: true }, { name: 'totalRooms', label: 'Total rooms', type: 'number', min: '0', required: true },
      { name: 'availableRooms', label: 'Available rooms', type: 'number', min: '0', required: true }, { name: 'rating', label: 'Rating', type: 'number', min: '0', max: '5', step: '0.1', required: true },
      { name: 'imageUrl', label: 'Image URL', type: 'url' }, { name: 'amenities', label: 'Amenities', type: 'textarea', fullWidth: true },
      { name: 'description', label: 'Description', type: 'textarea', fullWidth: true, required: true }, { name: 'isActive', label: 'Available for booking', type: 'checkbox', defaultValue: true },
    ],
    columns: [{ label: 'Stay', render: (item) => <><strong>{item.name}</strong><span className="cell-subtext">{item.location}</span></> }, { label: 'Available rooms', render: (item) => `${item.availableRooms}/${item.totalRooms}` }, { label: 'Rating', render: (item) => item.rating }, { label: 'Nightly rate', render: (item) => money(item.pricePerNight) }, { label: 'Status', render: (item) => activeStatus(item.isActive) }],
    toPayload: (form) => basePayload(form, ['pricePerNight', 'totalRooms', 'availableRooms', 'rating']),
  },
  offers: {
    id: 'offers', title: 'Curated Promotional Offers', plural: 'Offers', singular: 'Offer', endpoint: '/offers', deleteDescription: 'deactivate it so it is no longer publicly available.',
    fields: [
      { name: 'title', label: 'Offer title', required: true }, { name: 'category', label: 'Category', options: ['Tour', 'Hotel', 'Package'], required: true },
      { name: 'targetId', label: 'Target record ID', required: true }, { name: 'discountPercentage', label: 'Discount (%)', type: 'number', min: '0', max: '100', required: true },
      { name: 'originalPriceLKR', label: 'Original price (LKR)', type: 'number', min: '0.01', step: '0.01', required: true }, { name: 'offerPriceLKR', label: 'Offer price (LKR)', type: 'number', min: '0.01', step: '0.01', required: true },
      { name: 'badgeText', label: 'Badge text', required: true }, { name: 'imageUrl', label: 'Image URL', type: 'url', fullWidth: true }, { name: 'startDate', label: 'Start date', type: 'date', required: true }, { name: 'endDate', label: 'End date', type: 'date', required: true },
      { name: 'specialInclusions', label: 'Special inclusions', type: 'textarea', fullWidth: true }, { name: 'isActive', label: 'Available for booking', type: 'checkbox', defaultValue: true },
    ],
    columns: [{ label: 'Offer', render: (item) => <><strong>{item.title}</strong><span className="cell-subtext">{item.badgeText}</span></> }, { label: 'Category', render: (item) => item.category }, { label: 'Original rate', render: (item) => money(item.originalPriceLKR) }, { label: 'Offer rate', render: (item) => money(item.offerPriceLKR) }, { label: 'Status', render: (item) => activeStatus(item.isActive) }],
    toPayload: (form) => basePayload(form, ['discountPercentage', 'originalPriceLKR', 'offerPriceLKR']),
  },
};

export default function AdminDashboard() {
  const location = useLocation();
  const [activeModule, setActiveModule] = useState(location.state?.activeModule || 'overview');
  const [clock, setClock] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const [metrics, setMetrics] = useState(emptyMetrics);
  const [recentBookings, setRecentBookings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const updateTime = () => setClock(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setMetrics((current) => ({ ...current, loading: true }));
    const [bookingsResult, offersResult, inquiriesResult] = await Promise.allSettled([api.get('/bookings'), api.get('/offers'), api.get('/inquiries')]);
    const bookings = bookingsResult.status === 'fulfilled' && Array.isArray(bookingsResult.value.data) ? bookingsResult.value.data : [];
    const offers = offersResult.status === 'fulfilled' && Array.isArray(offersResult.value.data) ? offersResult.value.data : [];
    const inquiries = inquiriesResult.status === 'fulfilled' && Array.isArray(inquiriesResult.value.data) ? inquiriesResult.value.data : [];
    const confirmed = bookings.filter((booking) => booking.status?.toLowerCase() === 'confirmed');
    setRecentBookings(bookings);
    setMetrics({ confirmedExpeditions: confirmed.length, activeOffers: offers.filter((offer) => offer.isActive).length, openInquiries: inquiries.filter((inquiry) => inquiry.status === 'UNREAD').length, loading: false, lastUpdated: new Date().toISOString() });
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);
  const filteredBookings = recentBookings.filter((booking) => {
    const query = filterQuery.toLowerCase();
    return (booking.guestName || booking.customerName || booking.userEmail || '').toLowerCase().includes(query) || (booking.itemTitle || booking.packageName || booking.tourTitle || '').toLowerCase().includes(query);
  });

  const handleSignOut = () => {
    localStorage.removeItem('tripora_token');
    localStorage.removeItem('tripora_user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();
    window.location.replace('/login');
  };

  return <div className="crystalline-viewport">
    <div className="crystalline-bg-canvas"><img src="/images/admin-bg.jpg" alt="Sanctuary Vista" className="canvas-img" /><div className="canvas-tint-scrim" /></div>
    <div className="admin-master-shell">
      <header className="floating-top-island">
        <div className="island-col-left"><button className="admin-brand-group" type="button" onClick={() => navigate('/admin')} aria-label="Return to Admin Landing"><span className="brand-icon-circle" aria-hidden="true"><svg className="brand-plane-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z" /></svg></span><span className="brand-text-stack"><span className="brand-title-serif">Tripora</span><span className="brand-subtitle-italic">Travel &amp; Tours</span></span><span className="brand-console-divider" /><span className="admin-badge-terminal">Management Console</span></button></div>
        <div className="island-col-center"><div className="island-center-telemetry"><span className="telemetry-pill"><span className="status-flare" /><span>Sri Lanka Desk Active</span></span><span className="telemetry-sep">/</span><span className="telemetry-time">{clock}</span></div></div>
        <div className="island-col-right"><button className="island-btn-signout" type="button" onClick={handleSignOut}>Sign Out</button></div>
      </header>
    <div className="crystalline-deck-layout"><aside className="floating-nav-rail"><div><div className="rail-header-label">System Modules</div><nav className="rail-menu" aria-label="Admin dashboard modules">{navigation.map((item) => <button key={item.id} type="button" className={`rail-btn ${activeModule === item.id ? 'active' : ''} ${item.special ? 'special-gold' : ''}`} onClick={() => setActiveModule(item.id)}><span className="rail-btn-icon">{item.icon}</span><span className="rail-btn-text">{item.label}</span>{item.tag && <span className="rail-tag-teal">{item.tag}</span>}</button>)}</nav></div><div className="rail-footer-meta"><div className="meta-row"><span>DB Sync</span><span className="teal-text">{metrics.loading ? 'Syncing...' : 'Connected'}</span></div></div></aside>
      <main className="floating-stage-panel">
        {activeModule === 'overview' && <div className="stage-module-wrap"><div className="stage-banner-row"><div><h2 className="stage-title">Executive Command Pulse</h2><p className="stage-subtitle">Real-time telemetry and confirmed sanctuary reservations.</p></div><button className="stage-primary-btn" type="button" onClick={fetchDashboardData}>↻ Refresh Feed</button></div><div className="bento-metric-grid"><div className="bento-glass-card"><span className="bento-eyebrow">Confirmed Expeditions</span><div className="bento-hero-number">{metrics.confirmedExpeditions}</div><span className="delta-pill-teal">Active records</span></div><div className="bento-glass-card card-accent-gold"><span className="bento-eyebrow">Active Offers</span><div className="bento-hero-number gold-glow">{metrics.activeOffers} Active</div><span className="delta-pill-gold">Live in DB</span></div><div className="bento-glass-card"><span className="bento-eyebrow">Concierge Inquiries</span><div className="bento-hero-number">{metrics.openInquiries} Open</div><span className="delta-note">{metrics.lastUpdated ? `Updated ${new Date(metrics.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Awaiting sync'}</span></div></div><section className="ledger-container" aria-labelledby="ledger-title"><div className="ledger-header-row"><h3 className="ledger-title" id="ledger-title">Recent Expedition Ledger</h3><input type="text" placeholder="Search guest or destination..." className="ledger-glass-search" value={filterQuery} onChange={(event) => setFilterQuery(event.target.value)} /></div><div className="ledger-table-wrap"><table className="crystalline-table" aria-label="Recent expedition ledger"><thead><tr><th>Code / ID</th><th>Guest Details</th><th>Expedition / Stay</th><th>Dates</th><th>Valuation</th><th>Status</th></tr></thead><tbody>{metrics.loading ? <tr><td colSpan="6" style={emptyCellStyle}>Retrieving live ledger records...</td></tr> : filteredBookings.length === 0 ? <tr><td colSpan="6" style={emptyCellStyle}>No reservations recorded in the database yet.</td></tr> : filteredBookings.map((booking) => <tr key={booking.id || booking._id}><td><span className="code-pill">{booking.bookingCode || booking.id?.substring(0, 8) || 'RES'}</span></td><td><strong>{booking.guestName || booking.customerName || 'Private Traveler'}</strong><span className="cell-subtext">{booking.email || booking.userEmail || '—'}</span></td><td>{booking.itemTitle || booking.tourName || booking.packageName || 'Expedition'}</td><td>{formatLedgerDate(booking.dates || booking.travelDate || booking.createdAt)}</td><td>{money(booking.totalPrice || booking.amount || booking.totalLKR)}</td><td>{activeStatus(booking.status?.toLowerCase() === 'confirmed')}</td></tr>)}</tbody></table></div></section></div>}
        {moduleConfigs[activeModule] && <CrudModule config={moduleConfigs[activeModule]} />}
        {activeModule === 'bookings' && <BookingsModule />}
        {activeModule === 'inquiries' && <InquiriesModule onChanged={fetchDashboardData} />}
      </main>
      </div>
    </div>
  </div>;
}
