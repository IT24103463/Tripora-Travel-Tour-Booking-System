import { useState } from 'react';
import api from '../api/apiClient';
import './Contact.css';

const INITIAL_FORM = {
  name: '', phoneNumber: '', reason: 'Curated Tour Expedition', message: '',
};

const hubs = [
  { title: 'Colombo Executive Headquarters', address: 'Galle Face Terrace, Colombo 03, Western Province', phone: '+94 11 289 4400', hours: '08:30 - 19:30 SLST', icon: 'colombo' },
  { title: 'Galle Fort Coastal Outpost', address: 'Pedlar Street, Historic Dutch Fort, Galle', phone: '+94 91 432 8810', hours: 'Marine and charter desk', icon: 'galle' },
  { title: 'Ella Highlands Concierge', address: 'Passara Road, Ella, Uva Province', phone: '+94 57 222 3901', hours: 'Mountain expeditions', icon: 'ella' },
];

function HubIcon({ type }) {
  if (type === 'galle') return <path d="M3 21h18M5 21V7l7-4 7 4v14M9 10h.01M15 10h.01" />;
  if (type === 'ella') return <path d="M2 20 9 8l4 6 3-4 6 10H2zM12 4h.01" />;
  return <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></>;
}

export default function Contact() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const handleChange = (event) => {
    setFormData((previous) => ({ ...previous, [event.target.name]: event.target.value }));
    setNotice('');
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setNotice('');
    try {
      await api.post('/inquiries', formData);
      setFormData(INITIAL_FORM);
      setNotice('Your inquiry has been received. Our concierge team will contact you soon.');
    } catch {
      setNotice('We could not send your inquiry right now. Please try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="contact-viewport">
      <main className="contact-content-wrapper">
        <header className="contact-header-capsule page-hero-header">
          <div className="contact-eyebrow tripora-slogan-capsule">
            <span className="slogan-sparkle" aria-hidden="true">✦</span>
            <span className="slogan-text">Island Concierge / Bespoke Advisory</span>
          </div>
          <h1 className="contact-title">Begin your private voyage through Ceylon.</h1>
          <p className="contact-subtitle">From an unhurried rail journey through Ella’s tea valleys to a Geoffrey Bawa sanctuary or a private ocean charter, our Colombo and regional concierges are here to help shape your stay.</p>
        </header>

        <div className="contact-grid">
          <aside className="contact-info-pod" aria-labelledby="concierge-hubs-title">
            <div className="info-section-title"><span className="contact-sub-badge">DIRECT ACCESS</span><h2 id="concierge-hubs-title">Private Concierge Hubs</h2><p>Speak with a local specialist who knows the island and its seasons.</p></div>
            <div className="outpost-list">
              {hubs.map((hub) => (
                <section className="outpost-card" key={hub.title}>
                  <div className="outpost-header">
                    <span className="outpost-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><HubIcon type={hub.icon} /></svg></span>
                    <div className="outpost-copy"><h3>{hub.title}</h3><p>{hub.address}</p></div>
                  </div>
                  <div className="outpost-meta"><a href={`tel:${hub.phone.replaceAll(' ', '')}`}>{hub.phone}</a><span>{hub.hours}</span></div>
                </section>
              ))}
            </div>
            <div className="instant-channels-strip">
              <div className="channel-box"><span className="channel-label">WHATSAPP CONCIERGE</span><a className="channel-value" href="https://wa.me/94771234567" target="_blank" rel="noreferrer">+94 77 123 4567 <span aria-hidden="true">↗</span></a></div>
              <div className="channel-box"><span className="channel-label">DIRECT INQUIRIES</span><a className="channel-value" href="mailto:concierge@tripora.lk">concierge@tripora.lk</a></div>
              <p className="operating-hours">Concierge availability: daily, 08:30-19:30 Sri Lanka time.</p>
            </div>
          </aside>

          <section className="contact-form-pod" aria-labelledby="inquiry-form-title">
            <div className="contact-form-heading"><span className="contact-sub-badge">CONSULTATION FORM</span><h2 id="inquiry-form-title">Tailor your experience</h2><p>Share a few details and our island concierge can begin shaping your journey.</p></div>
            <form className="bespoke-form" onSubmit={handleSubmit}>
              <div className="contact-form-row">
                <div className="contact-field"><label htmlFor="contact-full-name">Name</label><input id="contact-full-name" name="name" autoComplete="name" maxLength="150" value={formData.name} onChange={handleChange} placeholder="Your name" required /></div>
                <div className="contact-field"><label htmlFor="contact-phone">Phone number</label><input id="contact-phone" name="phoneNumber" type="tel" autoComplete="tel" maxLength="50" value={formData.phoneNumber} onChange={handleChange} placeholder="+94 ..." required /></div>
              </div>
              <div className="contact-field"><label htmlFor="contact-inquiry-type">Reason</label><select id="contact-inquiry-type" name="reason" maxLength="100" value={formData.reason} onChange={handleChange} required><option>Curated Tour Expedition</option><option>Heritage Stay</option><option>Private Rail Journey</option><option>Coastal Charter</option><option>Safari & Nature</option><option>Other</option></select></div>
              <div className="contact-field contact-message-field"><label htmlFor="contact-message">Message</label><textarea id="contact-message" name="message" rows="5" value={formData.message} onChange={handleChange} placeholder="How can our concierge help?" required /></div>
              {notice && <p className="contact-form-notice" role="status">{notice}</p>}
              <div className="contact-submit-row"><span>Your message goes directly to our concierge desk.</span><button type="submit" className="contact-submit-button" disabled={submitting}>{submitting ? 'Sending...' : 'Send inquiry'} <span aria-hidden="true">↗</span></button></div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
