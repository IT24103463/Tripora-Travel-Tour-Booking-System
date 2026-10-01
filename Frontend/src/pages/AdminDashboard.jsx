import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../apiConfig';
import { adminMockBookings, adminMockTours, adminMockHotels, adminMockDestinations, adminNotifications } from '../components/admin/adminMockData';
import { formatLKR } from '../utils/currency';
import './AdminDashboard.css';

const navItems = [['overview', '▦', 'Overview'], ['packages', '▧', 'Packages & Tours'], ['hotels', '⌂', 'Hotels & Stays'], ['bookings', '▤', 'Bookings Ledger']];

function AdminDashboard({ onLogout, user }) {
  const navigate = useNavigate();
  const [section, setSection] = useState('overview');
  const [tours, setTours] = useState(adminMockTours);
  const [hotels, setHotels] = useState(adminMockHotels);
  const [bookings, setBookings] = useState(adminMockBookings);
  const [search, setSearch] = useState('');
  const [range, setRange] = useState('This Week');
  const [notice, setNotice] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    const load = async (path, setter, fallback) => {
      try {
        const response = await fetch(`${API_BASE_URL}${path}`);
        if (!response.ok) return;
        const data = await response.json();
        const items = Array.isArray(data) ? data : data?.data ?? data?.items ?? [];
        if (items.length) setter(items);
      } catch { setter(fallback); }
    };
    load('/api/tours', setTours, adminMockTours);
    load('/api/hotels?includeInactive=true', setHotels, adminMockHotels);
    load('/api/bookings', setBookings, adminMockBookings);
  }, []);

  const visibleBookings = useMemo(() => bookings.filter((b) => JSON.stringify(b).toLowerCase().includes(search.toLowerCase())), [bookings, search]);
  const visibleTours = useMemo(() => tours.filter((t) => JSON.stringify(t).toLowerCase().includes(search.toLowerCase())), [tours, search]);
  const visibleHotels = useMemo(() => hotels.filter((h) => JSON.stringify(h).toLowerCase().includes(search.toLowerCase())), [hotels, search]);
  const title = navItems.find(([id]) => id === section)?.[2] || 'Overview';

  return <div className="admin-dashboard-layout">
    <aside className="admin-sidebar">
      <button type="button" className="admin-brand admin-brand-button" onClick={() => navigate('/admin')} aria-label="Go to Tripora Admin dashboard"><span className="admin-plane">✈</span><div><strong>Tripora Admin</strong><small><i className="live-dot" /> Live operations</small></div></button>
      <div className="sidebar-label">WORKSPACE</div>
      <nav className="admin-nav">{navItems.map(([id, icon, label]) => <button key={id} className={section === id ? 'active' : ''} onClick={() => setSection(id)}><span>{icon}</span>{label}</button>)}</nav>
      <div className="admin-user-card"><div className="admin-avatar">{(user?.fullName || 'TA').slice(0, 1).toUpperCase()}</div><div className="admin-user-copy"><strong>Tripora Admin</strong><span>Super Admin</span></div><button className="logout-button" onClick={onLogout}>Sign Out</button></div>
    </aside>
    <main className="admin-main">
      <header className="admin-topbar"><div className="admin-search"><span>⌕</span><input aria-label="Search dashboard" placeholder="Search packages, guests, booking IDs..." value={search} onChange={(e) => setSearch(e.target.value)} /></div><div className="topbar-actions"><span className="system-health"><i /> Microservices: Healthy <small>(sub-35ms)</small></span><select aria-label="Date range" value={range} onChange={(e) => setRange(e.target.value)}>{['Today', 'This Week', 'This Month', 'Year-to-Date'].map((r) => <option key={r}>{r}</option>)}</select><button className="notification-button" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((open) => !open)}>♧<b /></button><button className="add-package-button" onClick={() => { setSection('packages'); setNotice('Package editor is ready.'); }}>+ Add Package</button></div>{notificationsOpen && <div className="notification-popover" role="status"><strong>Operations notifications</strong>{adminNotifications.map((item) => <p key={item}>{item}</p>)}</div>}</header>
      <div className="admin-content"><div className="admin-page-heading"><div><span className="eyebrow">TRIPORA / OPERATIONS</span><h1>{title}</h1><p>Welcome back. Here’s what’s happening across your travel business.</p></div><div className="heading-date">Thursday, September 24, 2026</div></div>
        {notice && <div className="admin-notice" role="status">{notice}<button onClick={() => setNotice('')}>×</button></div>}
        {section === 'overview' && <>
          <section className="kpi-grid">
            <article className="kpi-card"><div className="kpi-top"><span>Total Gross Revenue</span><i className="kpi-icon">LKR</i></div><strong>{formatLKR(42850000)}</strong><div className="kpi-foot"><span className="growth-badge">↗ +18.4%</span><small>vs. previous period</small></div></article>
            <article className="kpi-card"><div className="kpi-top"><span>Total Bookings</span><i className="kpi-icon">▣</i></div><strong>1,420</strong><div className="kpi-foot"><span className="growth-badge">↗ +8.2%</span><small>vs. previous period</small></div></article>
            <article className="kpi-card"><div className="kpi-top"><span>Active Travelers</span><i className="kpi-icon">♙</i></div><strong>390</strong><div className="kpi-foot"><small>domestic guests travelling</small></div></article>
            <article className="kpi-card"><div className="kpi-top"><span>Fleet & Stay Capacity</span><i className="kpi-icon">⌂</i></div><strong>84%</strong><div className="capacity-track"><span style={{ width: '84%' }} /></div><div className="kpi-foot"><small>Healthy operating utilization</small></div></article>
          </section>
          <section className="analytics-grid"><article className="admin-panel revenue-panel"><div className="panel-heading"><div><h2>Revenue Velocity</h2><p>Booking volume throughout the week</p></div><span className="panel-legend"><i /> Bookings</span></div><div className="chart-wrap"><div className="chart-y-labels"><span>120</span><span>90</span><span>60</span><span>30</span><span>0</span></div><svg className="revenue-chart" viewBox="0 0 700 210" role="img" aria-label="Weekly booking volume area chart"><defs><linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="rgba(20,184,166,.34)"/><stop offset="100%" stopColor="rgba(20,184,166,0)"/></linearGradient></defs><path className="chart-gridline" d="M0 20H700M0 62H700M0 104H700M0 146H700M0 188H700"/><path d="M0 158 C45 148 55 115 100 125 S165 152 200 110 S265 125 300 82 S365 102 400 70 S465 90 500 48 S565 64 600 34 S665 58 700 18 L700 200 L0 200Z" fill="url(#revenueFill)"/><path className="chart-line" d="M0 158 C45 148 55 115 100 125 S165 152 200 110 S265 125 300 82 S365 102 400 70 S465 90 500 48 S565 64 600 34 S665 58 700 18"/></svg></div><div className="chart-x-labels"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div></article>
            <article className="admin-panel destinations-panel"><div className="panel-heading"><div><h2>Top Destinations</h2><p>Bookings by destination</p></div><button className="more-button" aria-label="More destination options">•••</button></div><div className="destination-list">{adminMockDestinations.map(([name, value], i) => <div className="destination-item" key={name}><div className="destination-line"><span className={`destination-dot dot-${i}`} /> <span>{name}</span><strong>{value}%</strong></div><div className="destination-track"><i className={`destination-fill fill-${i}`} style={{ width: `${value}%` }} /></div></div>)}</div><div className="destinations-total"><span>All destinations</span><strong>1,420 bookings</strong></div></article></section>
          <section className="admin-panel ledger-panel"><div className="panel-heading"><div><h2>Recent Bookings</h2><p>Latest guest reservations and payment status</p></div><button className="view-all-button" onClick={() => setSection('bookings')}>View ledger <span>→</span></button></div><BookingsTable rows={visibleBookings.slice(0, 5)} /></section>
        </>}
        {section === 'packages' && <section className="package-grid">{visibleTours.map((tour, i) => <article className="package-card" key={tour.id || tour._id || i}><div className={`package-image package-image-${i % 3}`} style={{ backgroundImage: tour.image ? `linear-gradient(180deg, transparent, rgba(5,16,20,.65)), url(https://images.unsplash.com/${String(tour.image).replace(' ', '')}?auto=format&fit=crop&w=900&q=80)` : undefined }}><span className="duration-tag">{tour.duration || tour.durationDays || '7 days'}</span><strong>{formatLKR(tour.price || tour.pricePerPerson)} <small>/ person</small></strong></div><div className="package-info"><span className="package-location">{tour.location || tour.destination || 'Curated destination'}</span><h2>{tour.name || tour.title || 'Signature Escape'}</h2><div className="spots-line"><span>♙ {tour.booked || 16}/{tour.capacity || 20} spots booked</span><span>{tour.capacity ? Math.round((tour.booked || 16) / tour.capacity * 100) : 80}%</span></div><div className="spots-track"><i style={{ width: `${tour.capacity ? (tour.booked || 16) / tour.capacity * 100 : 80}%` }} /></div><div className="package-actions"><button onClick={() => setNotice(`Editing ${tour.name || 'package'} is ready.`)}>Edit package</button><button className="delete-action" onClick={() => setNotice('Choose a package from your catalog to delete it.')}>Delete</button></div></div></article>)}</section>}
        {section === 'hotels' && <section className="admin-panel section-panel"><div className="panel-heading"><div><h2>Heritage Stays</h2><p>Room availability and property status</p></div><button className="add-package-button" onClick={() => setNotice('Hotel listing form is ready.')}>+ Add Hotel</button></div><div className="hotel-grid">{visibleHotels.map((hotel, i) => <article className="hotel-card" key={hotel.id || hotel._id || i}><span className="hotel-icon">⌂</span><div className="hotel-card-main"><h3>{hotel.name || hotel.hotelName || 'Boutique Stay'}</h3><p>{hotel.location || hotel.address || 'Sri Lanka'}</p><span>{hotel.availableRooms ?? hotel.rooms ?? 12} rooms available · {formatLKR(hotel.pricePerNight || hotel.price || 0)} / night</span></div><button className={`status-toggle ${(hotel.active ?? hotel.isActive ?? true) ? 'is-active' : ''}`} onClick={(e) => e.currentTarget.classList.toggle('is-active')}>{(hotel.active ?? hotel.isActive ?? true) ? 'Active' : 'Inactive'}</button></article>)}</div></section>}
        {section === 'bookings' && <section className="admin-panel ledger-panel section-panel"><div className="panel-heading"><div><h2>Bookings Ledger</h2><p>Guest records and payment verification</p></div><span className="ledger-count">{visibleBookings.length} records</span></div><BookingsTable rows={visibleBookings} /></section>}
      </div>
    </main>
  </div>;
}

function BookingsTable({ rows }) {
  const value = (row, keys, fallback = '—') => keys.map((key) => row[key]).find((v) => v !== undefined && v !== null) ?? fallback;
  return <div className="table-scroll"><table className="admin-table"><thead><tr><th>Booking Ref</th><th>Guest Name</th><th>Destination / Package</th><th>Date</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map((row, i) => { const status = value(row, ['status', 'bookingStatus'], 'Confirmed'); const statusText = String(status).toLowerCase(); const statusClass = statusText.includes('pending') ? 'pending' : statusText.includes('cancel') ? 'cancelled' : 'confirmed'; return <tr key={row.id || row._id || i}><td className="booking-ref">{value(row, ['id', 'bookingReference', 'bookingId', '_id'])}</td><td>{value(row, ['guest', 'guestName', 'customerName', 'fullName'])}</td><td>{value(row, ['destination', 'packageName', 'tourName'])}</td><td>{String(value(row, ['date', 'bookingDate', 'createdAt'])).slice(0, 10)}</td><td className="amount-cell">{formatLKR(value(row, ['amount', 'totalAmount', 'price'], 0))}</td><td><span className={`status-badge ${statusClass}`}>{status}</span></td><td><button className="row-action" aria-label={`Actions for booking ${i + 1}`}>•••</button></td></tr>; })}</tbody></table>{rows.length === 0 && <div className="empty-state">No matching records found.</div>}</div>;
}

export default AdminDashboard;
