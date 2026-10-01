import { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, Compass, Headset, MapPin, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/apiClient';
import './CustomerHome.css';

const curatedOfferPhotos = [
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
];

const unwrapOffers = (payload) => {
  const records = Array.isArray(payload) ? payload : payload?.data ?? payload?.items ?? [];
  return Array.isArray(records) ? records : [];
};
const savings = (offer) => Math.max(0, (Number(offer.originalPriceLKR) || 0) - (Number(offer.offerPriceLKR) || 0));
const inclusionsText = (value) => Array.isArray(value) ? value.filter(Boolean).join(' · ') : value;
const getOfferPhoto = (offer, index, offers) => {
  const suppliedPhoto = String(offer.imageUrl || offer.image || '').trim();
  const photoIsRepeated = suppliedPhoto && offers.filter((item) => String(item.imageUrl || item.image || '').trim() === suppliedPhoto).length > 1;
  if (suppliedPhoto && !suppliedPhoto.includes('default') && !photoIsRepeated) return suppliedPhoto;

  const offerText = `${offer.title || ''} ${offer.category || ''}`.toLowerCase();
  if (/(trincomalee|catamaran|sea|beach|coast)/.test(offerText)) return curatedOfferPhotos[0];
  if (/(yala|ruhuna|safari|leopard|wildlife)/.test(offerText)) return curatedOfferPhotos[1];
  if (/(knuckles|forest|valley|mist|mountain)/.test(offerText)) return curatedOfferPhotos[2];
  return curatedOfferPhotos[index % curatedOfferPhotos.length];
};

function FeaturedOffersSection() {
  const [topOffers, setTopOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchTopOffers() {
      try {
        const response = await api.get('/offers');
        const rankedOffers = unwrapOffers(response.data)
          .filter((offer) => offer.isActive !== false)
          .sort((left, right) => savings(right) - savings(left) || Number(right.discountPercentage || 0) - Number(left.discountPercentage || 0))
          .slice(0, 3);
        if (active) setTopOffers(rankedOffers);
      } catch (error) {
        console.error('Failed to load featured offers:', error);
        if (active) setTopOffers([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchTopOffers();
    return () => { active = false; };
  }, []);

  return <section className="member-offers-section" aria-labelledby="featured-offers-title">
    <div className="member-section-heading"><div><span className="member-eyebrow">CURATED PRIVILEGES</span><h2 id="featured-offers-title">Exclusive Expeditions &amp; Privileges</h2><p>Handcrafted escapes with thoughtful upgrades and seasonal inclusions.</p></div><Link className="member-text-link" to="/offers">Explore more offers <ArrowUpRight size={16} /></Link></div>
    <div className="member-offers-grid">
      {loading ? <div className="member-offers-state" role="status">Loading curated privileges...</div> : topOffers.length === 0 ? <div className="member-offers-state">New curated privileges are arriving soon.</div> : topOffers.map((offer, index) => {
        const discount = Number(offer.discountPercentage || 0);
        const image = getOfferPhoto(offer, index, topOffers);
        const inclusions = inclusionsText(offer.specialInclusions);
        return <Link key={offer.id} className={`member-offer-card ${offer.isExclusive ? 'member-offer-exclusive' : ''}`} to="/offers" aria-label={`Explore ${offer.title}`}>
          <div className="member-offer-image"><img className="member-offer-img" src={image} alt={offer.title} referrerPolicy="no-referrer" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/images/admin-bg.jpg'; }} /><div className="member-offer-scrim" aria-hidden="true" />
            <div className="member-offer-badges">{offer.isExclusive && <span className="member-exclusive-badge"><i /> EXCLUSIVE</span>}{discount > 0 && <span className="member-discount-badge">{Math.round(discount)}% OFF</span>}</div>
          </div>
          <div className="member-offer-copy"><span className="member-offer-category">{offer.category || 'Tours'}</span><h3>{offer.title}</h3>{inclusions && <p className="member-offer-inclusions">✦ {inclusions}</p>}</div>
        </Link>;
      })}
    </div>
  </section>;
}

export default function CustomerHome({ user, onNavigate }) {
  const firstName = user?.fullName?.trim().split(/\s+/)[0] || 'Traveler';

  return (
    <div className="member-home" id="customer-home">
      <div className="member-home-inner">
        <section className="member-welcome page-hero-header">
          <div>
            <span className="member-eyebrow tripora-slogan-capsule">
              <span className="slogan-sparkle" aria-hidden="true">✦</span>
              <span className="slogan-text">Your Tripora Member Portal</span>
            </span>
            <h1>Welcome back, <em>{firstName}</em></h1>
            <p>Your next extraordinary escape is closer than you think.</p>
          </div>
          <div className="member-welcome-badge"><span><Sparkles size={17} /></span><div><strong>Tripora Privilege</strong><small>Member access active</small></div><ShieldCheck size={17} className="member-verified" /></div>
        </section>

        <section className="member-hero hero-feature-card" aria-label="Featured Sri Lankan escape">
          <div className="member-hero-photo" aria-hidden="true" />
          <div className="member-hero-content">
            <span className="member-hero-kicker"><MapPin size={13} /> A PRIVATE COLLECTION · SRI LANKA</span>
            <h2>The island,<br />beyond the expected.</h2>
            <p>From mist-wrapped tea estates to the stillness of the southern coast, discover a more personal way to travel.</p>
            <button type="button" className="member-primary-cta" onClick={() => onNavigate('tours')}>Explore curated journeys <ArrowRight size={16} /></button>
          </div>
          <div className="member-hero-caption"><span>01 / 03</span><i /><span>CURATED FOR THE CURIOUS</span></div>
        </section>

        <FeaturedOffersSection />

        <section className="member-service-row">
          <div className="member-service-copy"><Link aria-label="Contact your personal travel desk" className="service-icon service-icon-link" title="Contact our travel desk" to="/contact"><Headset size={19} aria-hidden="true" /></Link><div><strong>Your personal travel desk</strong><p>Questions, changes, or a little inspiration? We’re here to help shape your next journey.</p></div></div>
          <div className="member-service-actions"><button type="button" onClick={() => onNavigate('profile')}><UserRound size={15} /> Your profile</button><button type="button" onClick={() => onNavigate('tours')}>Plan a journey <ArrowRight size={15} /></button></div>
        </section>

        <footer className="member-home-footer">
          <span>TRIPORA <i>·</i> TRAVEL, THOUGHTFULLY ARRANGED</span>
          <div className="welcome-banner-header text-center">
            <span className="welcome-eyebrow">Welcome to your member experience</span>
          </div>
          <Compass size={16} />
        </footer>
      </div>
    </div>
  );
}
