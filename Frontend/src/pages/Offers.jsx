import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../apiConfig';
import BookingAction from '../components/BookingAction';
import './Offers.css';

const OFFERS_ENDPOINT = `${API_BASE_URL}/api/offers?includeUpcoming=true`;
const FALLBACK_ENDPOINT = 'http://localhost:5003/api/offers?includeUpcoming=true';

const categoryTabs = [
  { id: 'ALL', label: 'All Offers' },
  { id: 'Tour', label: 'Tours' },
  { id: 'Hotel', label: 'Hotels' },
  { id: 'Package', label: 'Travel Packages' },
];

const fallbackOfferImages = [
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=85',
];

function resolveOfferImage(offer, fallbackIndex = 0) {
  const storedUrl = String(offer.imageUrl || offer.image || '').trim();
  if (storedUrl) return storedUrl;

  const offerText = `${offer.title || ''} ${offer.category || ''} ${offer.badgeText || ''}`.toLowerCase();
  if (/(yala|safari|leopard|wildlife|elephant)/.test(offerText)) return fallbackOfferImages[1];
  if (/(knuckles|ella|mountain|mist|highland|hiking)/.test(offerText)) return fallbackOfferImages[2];
  if (/(trincomalee|catamaran|beach|coast|ocean|sea|lagoon)/.test(offerText)) return fallbackOfferImages[0];

  return fallbackOfferImages[fallbackIndex % fallbackOfferImages.length];
}

function normalizeOffers(payload) {
  const records = Array.isArray(payload) ? payload : payload?.data ?? payload?.items ?? [];
  return Array.isArray(records) ? records : [];
}

function formatLkr(value) {
  return new Intl.NumberFormat('en-LK', { maximumFractionDigits: 0 }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return 'Limited time';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Limited time';
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function isUpcoming(startDate) {
  if (!startDate) return false;
  const date = new Date(startDate);
  return !Number.isNaN(date.getTime()) && date.getTime() > Date.now();
}

function categoryLabel(category) {
  switch (category?.toLowerCase()) {
    case 'tour': return 'Tour privilege';
    case 'hotel': return 'Hotel sanctuary';
    case 'package': return 'Private package';
    default: return 'Tripora privilege';
  }
}

export default function Offers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [retryCount, setRetryCount] = useState(0);
  const [selectedBookingItem, setSelectedBookingItem] = useState(null);

  const handleSelectOffer = (offer, imageUrl) => {
    const price = offer.discountedPrice ?? offer.offerPriceLKR ?? offer.price;
    setSelectedBookingItem({
      ...offer,
      id: offer.targetId || offer.id || offer._id,
      targetId: offer.targetId || offer.id || offer._id,
      title: offer.title || offer.name,
      name: offer.name || offer.title,
      price,
      priceLKR: price,
      originalPrice: offer.originalPrice ?? offer.originalPriceLKR ?? null,
      duration: offer.duration ?? offer.durationDays,
      durationDays: offer.durationDays ?? offer.duration,
      imageUrl: offer.image || offer.imageUrl || imageUrl,
      type: 'offer',
      bookingType: offer.category,
    });
  };

  useEffect(() => {
    const controller = new AbortController();

    async function fetchOffers() {
      setLoading(true);
      setError('');
      let lastError;

      for (const endpoint of [...new Set([OFFERS_ENDPOINT, FALLBACK_ENDPOINT])]) {
        try {
          const response = await fetch(endpoint, {
            headers: { Accept: 'application/json' },
            signal: controller.signal,
          });
          if (!response.ok) {
            lastError = new Error(`Request failed with status ${response.status}`);
            continue;
          }

          setOffers(normalizeOffers(await response.json()));
          setLoading(false);
          return;
        } catch (fetchError) {
          if (fetchError.name === 'AbortError') return;
          lastError = fetchError;
        }
      }

      console.error('Failed to fetch offers:', lastError);
      setError('Unable to load seasonal offers. Check that the Tripora backend is running and try again.');
      setLoading(false);
    }

    fetchOffers();
    return () => controller.abort();
  }, [retryCount]);

  const categoryOffers = (category) => offers.filter((offer) => offer.category?.toLowerCase() === category.toLowerCase());
  const filteredOffers = activeCategory === 'ALL' ? offers : categoryOffers(activeCategory);

  return (
    <div className="offers-viewport">
      <div className="offers-content-wrapper">
        <header className="offers-header-capsule offers-header" aria-labelledby="offers-page-title">
          <div className="offers-eyebrow tripora-slogan-capsule">
            <span className="slogan-sparkle" aria-hidden="true">✦</span>
            <span className="slogan-text">Exclusive Privileges · Limited-Time Tariffs</span>
          </div>
          <h1 className="offers-main-title" id="offers-page-title">Curated Seasonal Offers &amp; Island Perks</h1>
          <p className="offers-description">
            Discover special rates across private journeys, considered stays, and tailor-made escapes, each paired with a thoughtful island experience.
          </p>
            <div className="unified-tabs-group offers-unified-tabs offer-tabs" role="group" aria-label="Filter offers by category">
            {categoryTabs.map((tab) => (
              <button
                type="button"
                key={tab.id}
                  className={`unified-tab-btn ${activeCategory === tab.id ? 'active' : ''}`}
                aria-pressed={activeCategory === tab.id}
                onClick={() => setActiveCategory(tab.id)}
              >
                  {tab.label}<span className="tab-counter">{tab.id === 'ALL' ? offers.length : categoryOffers(tab.id).length}</span>
                  {activeCategory === tab.id && <span className="tab-active-glow-bar" aria-hidden="true" />}
              </button>
            ))}
          </div>
        </header>

        {loading ? (
          <div className="offers-state" role="status"><span className="offers-spinner" /><p>Retrieving exclusive privileges…</p></div>
        ) : error ? (
          <div className="offers-state" role="alert">
            <h2>Offers are temporarily unavailable</h2>
            <p>{error}</p>
            <button type="button" className="offers-action-btn" onClick={() => setRetryCount((count) => count + 1)}>Try again</button>
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="offers-state offers-empty-state">
            <h2>No offers in this category right now</h2>
            <p>Seasonal privileges are refreshed throughout the year. Browse all offers to see what is coming up.</p>
            {activeCategory !== 'ALL' && <button type="button" className="offers-action-btn" onClick={() => setActiveCategory('ALL')}>Show all offers</button>}
          </div>
        ) : (
          <section className="offers-results" aria-label="Available offers">
            <div className="offers-results-heading">
              <p>{filteredOffers.length} {filteredOffers.length === 1 ? 'privilege' : 'privileges'}</p>
              <span>Offer dates and savings shown in local currency</span>
            </div>
            <div className="offers-cards-grid">
              {filteredOffers.map((offer, index) => {
                const category = offer.category?.toLowerCase() || 'tour';
                const savings = Math.max(0, Number(offer.originalPriceLKR || 0) - Number(offer.offerPriceLKR || 0));
                const upcoming = isUpcoming(offer.startDate);
                const offerImage = resolveOfferImage(offer, index);

                return (
                  <article key={offer.id} className="offer-privilege-card" role="button" tabIndex={0} onClick={() => handleSelectOffer(offer, offerImage)} onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleSelectOffer(offer, offerImage);
                    }
                  }}>
                    <div className="offer-card-media" style={{ backgroundImage: `linear-gradient(180deg, rgba(4, 12, 16, 0.12), rgba(4, 12, 16, 0.08) 35%, rgba(4, 12, 16, 0.76)), url("${offerImage}")` }}>
                      <span className="offer-badge-ribbon">{offer.badgeText || `${offer.discountPercentage ?? 0}% OFFER`}</span>
                      <span className={`offer-validity-tag ${upcoming ? 'upcoming' : ''}`}>
                        {upcoming ? `Starts ${formatDate(offer.startDate)}` : `Valid through ${formatDate(offer.endDate)}`}
                      </span>
                    </div>

                    <div className="offer-card-body">
                      <div className="offer-type-row">
                        <span className="offer-cat-pill">{categoryLabel(offer.category)}</span>
                        {savings > 0 && <span className="offer-savings-pill">Save LKR {formatLkr(savings)}</span>}
                      </div>
                      <h2 className="offer-title">{offer.title}</h2>

                      {offer.specialInclusions && (
                        <div className="offer-perks-box">
                          <div className="perks-badge"><span aria-hidden="true">✦</span> INCLUDED BONUS PERK</div>
                          <p className="perks-text">{offer.specialInclusions}</p>
                        </div>
                      )}

                      <div className="offer-card-footer">
                        <div className="offer-pricing-block">
                          <div className="original-price-wrap"><span className="was-label">WAS</span><span className="strikethrough-price">LKR {formatLkr(offer.originalPriceLKR)}</span></div>
                          <div className="offer-price-wrap"><span className="now-label">OFFER PRICE</span><span className="highlight-price">LKR {formatLkr(offer.offerPriceLKR)}</span></div>
                        </div>
                        <button type="button" className="booking-action-trigger" onClick={(event) => { event.stopPropagation(); handleSelectOffer(offer, offerImage); }}>Claim offer</button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
        {selectedBookingItem && <BookingAction item={selectedBookingItem} offer={selectedBookingItem} open={true} hideTrigger onOpenChange={(isOpen) => { if (!isOpen) setSelectedBookingItem(null); }} />}
      </div>
    </div>
  );
}
