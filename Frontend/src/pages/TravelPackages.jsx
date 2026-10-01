import { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../apiConfig';
import BookingAction from '../components/BookingAction';
import '../components/UnifiedSearchBar.css';
import './TravelPackages.css';

const PACKAGES_ENDPOINT = `${API_BASE_URL}/api/packages`;
const FALLBACK_ENDPOINT = 'http://localhost:5003/api/packages';

const categories = [
  { id: 'ALL', label: 'All Packages' },
  { id: 'DayOut', label: 'Day Out' },
  { id: 'CoupleEscape', label: 'Couple Escapes' },
  { id: 'FriendsHangout', label: 'Friends Hangouts' },
  { id: 'MultiDayTrip', label: 'Multi-Day Trips' },
];

const typeLabels = {
  dayout: 'Day Out',
  coupleescape: 'Couple Escape',
  friendshangout: 'Friends Hangout',
  multidaytrip: 'Multi-Day Odyssey',
};

function normalizePackages(payload) {
  const records = Array.isArray(payload) ? payload : payload?.data ?? payload?.items ?? [];
  if (!Array.isArray(records)) return [];

  return records.map((item) => {
    let inclusions = item.inclusions;
    if (typeof inclusions === 'string') {
      try {
        inclusions = JSON.parse(inclusions);
      } catch {
        inclusions = inclusions ? [inclusions] : [];
      }
    }

    return { ...item, inclusions: Array.isArray(inclusions) ? inclusions : [] };
  });
}

function formatLkr(value) {
  return new Intl.NumberFormat('en-LK', {
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

export default function TravelPackages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedGuests, setSelectedGuests] = useState('ANY');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedBookingItem, setSelectedBookingItem] = useState(null);

  const handleSelectPackage = (item) => {
    const price = item.discountedPrice ?? item.price ?? item.priceLKR;
    setSelectedBookingItem({
      ...item,
      id: item.id || item._id,
      title: item.title || item.name,
      name: item.name || item.title,
      price,
      priceLKR: item.priceLKR ?? price,
      originalPrice: item.originalPrice ?? item.originalPriceLKR ?? null,
      duration: item.duration ?? item.durationDays,
      durationDays: item.durationDays ?? item.duration,
      imageUrl: item.image || item.imageUrl,
      type: 'package',
      bookingType: 'Package',
    });
  };

  useEffect(() => {
    const controller = new AbortController();

    async function fetchPackages() {
      setLoading(true);
      setError('');
      let lastError;

      for (const endpoint of [...new Set([PACKAGES_ENDPOINT, FALLBACK_ENDPOINT])]) {
        try {
          const response = await fetch(endpoint, {
            headers: { Accept: 'application/json' },
            signal: controller.signal,
          });
          if (!response.ok) {
            lastError = new Error(`Request failed with status ${response.status}`);
            continue;
          }

          setPackages(normalizePackages(await response.json()));
          setLoading(false);
          return;
        } catch (fetchError) {
          if (fetchError.name === 'AbortError') return;
          lastError = fetchError;
        }
      }

      console.error('Failed to load travel packages:', lastError);
      setError('Unable to load travel packages. Please ensure the backend is running and try again.');
      setLoading(false);
    }

    fetchPackages();
    return () => controller.abort();
  }, [retryCount]);

  const filteredPackages = useMemo(() => packages.filter((item) => {
    if (selectedType !== 'ALL' && item.packageType?.toLowerCase() !== selectedType.toLowerCase()) return false;

    if (selectedGuests !== 'ANY') {
      const guestCount = Number(selectedGuests);
      const minimum = Number(item.minGuests ?? 1);
      const maximum = Number(item.maxGuests ?? 10);
      if (guestCount < minimum || guestCount > maximum) return false;
    }

    const query = searchQuery.trim().toLowerCase();
    if (query && ![item.name, item.description]
      .some((value) => value?.toLowerCase().includes(query))) return false;

    const location = locationQuery.trim().toLowerCase();
    if (location && !item.destination?.toLowerCase().includes(location)) return false;

    const budget = Number(maxPrice);
    if (maxPrice && budget > 0 && Number(item.priceLKR) > budget) return false;
    return true;
  }), [packages, selectedType, selectedGuests, searchQuery, locationQuery, maxPrice]);

  const handleClearFilters = () => {
    setSelectedType('ALL');
    setSelectedGuests('ANY');
    setSearchQuery('');
    setLocationQuery('');
    setMaxPrice('');
  };

  return (
    <div className="packages-viewport">
      <div className="packages-content-wrapper">
        <section className="packages-header-card packages-header" aria-labelledby="packages-page-title">
          <div className="packages-eyebrow tripora-slogan-capsule">
            <span className="slogan-sparkle" aria-hidden="true">✦</span>
            <span className="slogan-text">Private Sanctuaries &amp; Expeditions</span>
          </div>
          <h1 className="packages-title" id="packages-page-title">Explore Travel Packages</h1>
          <p className="packages-desc">
            Discover bespoke day-outs, romantic escapes, and private group expeditions across Sri Lanka.
          </p>

          <div className="packages-header-actions-row">
              <div className="unified-tabs-group packages-unified-tabs filter-tabs" role="group" aria-label="Filter packages by type">
              {categories.map((category) => (
                <button
                  type="button"
                  key={category.id}
                    className={'unified-tab-btn' + (selectedType === category.id ? ' active' : '')}
                    aria-pressed={selectedType === category.id}
                    onClick={() => setSelectedType(category.id)}
                  >
                    {category.label}
                    {selectedType === category.id && <span className="tab-active-glow-bar" aria-hidden="true" />}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="unified-search-bar-console" role="search" aria-label="Filter travel packages">
          <div className="unified-search-pill pill-search">
            <svg className="unified-pill-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input type="text" aria-label="Search name or description" placeholder="Search name or description..." value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
          </div>
          <div className="unified-search-pill pill-location">
            <svg className="unified-pill-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
            <input type="text" aria-label="Filter by location" placeholder="Filter by location..." value={locationQuery} onChange={(event) => setLocationQuery(event.target.value)} />
          </div>
          <div className="unified-search-pill pill-price">
            <svg className="unified-pill-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" /></svg>
            <input type="number" min="0" inputMode="numeric" aria-label="Maximum price in LKR" placeholder="Max price (LKR)" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} />
          </div>
          <button type="button" className="unified-clear-filters-btn" onClick={handleClearFilters}>× CLEAR FILTERS</button>
        </section>

        {loading ? (
          <div className="packages-state" role="status"><span className="packages-spinner" /><p>Loading curated private packages...</p></div>
        ) : error ? (
          <div className="packages-state packages-error-state" role="alert">
            <h2>Packages are temporarily unavailable</h2>
            <p>{error}</p>
            <button type="button" className="packages-action-btn" onClick={() => setRetryCount((count) => count + 1)}>Try again</button>
          </div>
        ) : filteredPackages.length === 0 ? (
          <div className="packages-state packages-empty-state">
            <h2>No packages match those filters</h2>
            <p>Try another party size, category, or budget.</p>
            <button type="button" className="packages-action-btn" onClick={handleClearFilters}>Show all packages</button>
          </div>
        ) : (
          <section className="packages-results" aria-label="Available private travel packages">
            <div className="packages-results-heading">
              <p>{filteredPackages.length} {filteredPackages.length === 1 ? 'private package' : 'private packages'}</p>
              <span>Capacity checked against your selected party size</span>
            </div>
            <div className="packages-grid">
              {filteredPackages.map((item) => {
                const label = typeLabels[item.packageType?.toLowerCase()] ?? 'Private Package';
                const minGuests = Number(item.minGuests ?? 1);
                const maxGuests = Number(item.maxGuests ?? 10);

                return (
                  <article className="package-card" key={item.id} role="button" tabIndex={0} onClick={() => handleSelectPackage(item)} onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleSelectPackage(item);
                    }
                  }}>
                    <div className="package-card-media" style={{ backgroundImage: `linear-gradient(180deg, rgba(4, 12, 16, 0.12), rgba(4, 12, 16, 0.08) 42%, rgba(4, 12, 16, 0.72)), url("${item.imageUrl}")` }}>
                      <span className="type-badge">{label}</span>
                      <span className="capacity-badge">{minGuests === maxGuests ? `${minGuests} guests` : `${minGuests}-${maxGuests} guests`}</span>
                    </div>
                    <div className="package-card-body">
                      <div className="package-location">
                        <span className="location-symbol" aria-hidden="true">✦</span>
                        <span>{item.destination || 'Sri Lanka'}</span>
                      </div>
                      <h2 className="package-name">{item.name}</h2>
                      <p className="package-description">{item.description}</p>
                      <div className="package-duration-pill">
                        {item.durationDays} {item.durationDays === 1 ? 'day' : 'days'}
                        {Number(item.durationNights) > 0 && ` - ${item.durationNights} ${item.durationNights === 1 ? 'night' : 'nights'}`}
                      </div>
                      {item.inclusions.length > 0 && (
                        <div className="inclusions-wrap" aria-label="Package inclusions">
                          {item.inclusions.slice(0, 3).map((inclusion, index) => <span className="inclusion-pill" key={`${item.id}-inclusion-${index}`}>{inclusion}</span>)}
                          {item.inclusions.length > 3 && <span className="inclusion-pill inclusion-more">+{item.inclusions.length - 3} more</span>}
                        </div>
                      )}
                      <div className="package-card-footer">
                        <div className="price-block"><span className="price-label">PACKAGE PRICE</span><span className="price-amount">LKR {formatLkr(item.priceLKR)}</span></div>
                        <button type="button" className="booking-action-trigger" onClick={(event) => { event.stopPropagation(); handleSelectPackage(item); }}>Book package</button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
        {selectedBookingItem && <BookingAction item={selectedBookingItem} open={true} hideTrigger onOpenChange={(isOpen) => { if (!isOpen) setSelectedBookingItem(null); }} />}
      </div>
    </div>
  );
}
