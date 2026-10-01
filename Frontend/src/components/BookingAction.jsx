import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../apiConfig';
import { ModalIcons } from './common/ModalIcons';
import GlassDatePicker from './common/GlassDatePicker';
import './BookingAction.css';

const FALLBACK_COVER_IMAGE = 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80';

function toDisplayDate(date) {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

function parseDisplayDate(value) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value || '');
  if (!match) return null;
  const date = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
  return date.getFullYear() === Number(match[3]) && date.getMonth() === Number(match[2]) - 1 && date.getDate() === Number(match[1]) ? date : null;
}

function toBookingDateTime(value) {
  const date = parseDisplayDate(value);
  return date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T00:00:00` : null;
}

const MIN_TRAVEL_DATE = (() => { const date = new Date(); date.setDate(date.getDate() + 1); date.setHours(0, 0, 0, 0); return toDisplayDate(date); })();

export default function BookingAction({ item, offer, label = 'Book now', open: controlledOpen, onOpenChange, hideTrigger = false }) {
  const navigate = useNavigate();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const [guests, setGuests] = useState(Number(item.minGuests) || 1);
  const [travelDate, setTravelDate] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guestName, setGuestName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [resolvedItem, setResolvedItem] = useState(item);

  const setOpen = useCallback((nextOpen) => {
    if (controlledOpen === undefined) setUncontrolledOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }, [controlledOpen, onOpenChange]);

  useEffect(() => {
    if (!open || String(offer?.category || '').toLowerCase() !== 'package' || !offer?.targetId) return;
    const controller = new AbortController();
    fetch(`${API_BASE_URL}/api/packages/${offer.targetId}`, { signal: controller.signal, headers: { Accept: 'application/json' } })
      .then((response) => response.ok ? response.json() : null)
      .then((packageInfo) => {
        if (packageInfo) {
          setResolvedItem(packageInfo);
          setGuests((current) => Math.min(Number(packageInfo.maxGuests) || 10, Math.max(Number(packageInfo.minGuests) || 1, current)));
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [open, offer?.category, offer?.targetId]);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event) => { if (event.key === 'Escape' && !busy) setOpen(false); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, busy, setOpen]);

  const kind = String(offer?.category || resolvedItem.packageType && 'Package' || resolvedItem.bookingType || 'Package');
  const itemId = offer?.targetId || resolvedItem.id;
  const isPackage = kind.toLowerCase() === 'package';
  const isHotel = kind.toLowerCase() === 'hotel';
  const minGuests = Number(resolvedItem.minGuests ?? 1);
  const maxGuests = Number(resolvedItem.maxGuests ?? 10);
  const price = Number(offer?.offerPriceLKR ?? resolvedItem.priceLKR ?? resolvedItem.price ?? 0);
  const duration = Number(resolvedItem.durationDays ?? resolvedItem.duration ?? 1) || 1;
  const capacityCount = Number(resolvedItem.capacity ?? resolvedItem.groupSize ?? 0);
  const capacity = isPackage
    ? `${minGuests}${minGuests === maxGuests ? '' : `-${maxGuests}`} guests`
    : capacityCount ? `${capacityCount} people` : '2-6 guests';
  const availableSlots = resolvedItem.availableSlots ?? resolvedItem.availableRooms ?? resolvedItem.availableSlotsCount;
  const coverImage = offer?.imageUrl
    || offer?.image
    || offer?.target?.imageUrl
    || resolvedItem.imageUrl
    || resolvedItem.image
    || resolvedItem.tour?.imageUrl
    || resolvedItem.package?.imageUrl
    || FALLBACK_COVER_IMAGE;

  async function submit(event) {
    event.preventDefault();
    const token = localStorage.getItem('tripora_token');
    if (!token) {
      const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      sessionStorage.setItem('redirectAfterLogin', returnTo);
      navigate('/login', { state: { from: returnTo } });
      return;
    }
    const travelDateValue = parseDisplayDate(travelDate);
    const checkInValue = parseDisplayDate(checkIn);
    const checkOutValue = parseDisplayDate(checkOut);
    if (!isHotel && !travelDateValue) { setError('Choose a travel date.'); return; }
    if (isHotel && (!checkInValue || !checkOutValue || checkOutValue <= checkInValue)) { setError('Choose valid check-in and check-out dates.'); return; }
    if (isPackage && (guests < minGuests || guests > maxGuests)) { setError(`This package accepts ${minGuests} to ${maxGuests} guests.`); return; }

    const amount = price;
    const payload = {
      bookingType: kind,
      tourId: kind.toLowerCase() === 'tour' ? itemId : null,
      hotelId: isHotel ? itemId : null,
      packageId: isPackage ? itemId : null,
      offerId: offer?.id || null,
      guestName: guestName.trim(),
      phoneNumber: phone.trim(),
      billingAddress: address.trim(),
      quantity: Number(guests),
      travelDate: isHotel ? toBookingDateTime(checkIn) : toBookingDateTime(travelDate),
      checkInDate: isHotel ? toBookingDateTime(checkIn) : null,
      checkOutDate: isHotel ? toBookingDateTime(checkOut) : null,
      totalAmount: isHotel ? amount * Number(guests) * Math.max(1, Math.ceil((checkOutValue - checkInValue) / 86400000)) : isPackage ? amount : amount * Number(guests),
    };

    setBusy(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || 'Unable to create this booking.');
      const bookingId = result.bookingId || result.data?.id;
      if (!bookingId) throw new Error('The booking service did not return a booking reference.');
      navigate(`/payment/${bookingId}`, { state: { ...payload, bookingId, tourName: offer?.title || resolvedItem.name || resolvedItem.title, item: resolvedItem, totalAmount: Number(result.data?.totalAmount ?? payload.totalAmount) } });
    } catch (submitError) {
      setError(submitError.message || 'Unable to create this booking.');
    } finally {
      setBusy(false);
    }
  }

  function closeModal(event) {
    event?.preventDefault();
    event?.stopPropagation();
    if (!busy) {
      setOpen(false);
      setError('');
    }
  }

  function closeFromBackdrop(event) {
    if (event.target !== event.currentTarget) return;
    closeModal(event);
  }

  return <>
    {!hideTrigger && <button
      type="button"
      className="booking-action-trigger"
      aria-haspopup="dialog"
      aria-expanded={open}
      onClick={(event) => {
        event.stopPropagation();
        setError('');
        setOpen(true);
      }}
    >
      {label}
    </button>}
    {open && createPortal(<div className="unified-modal-overlay" role="presentation" onMouseDown={closeFromBackdrop} onClick={closeFromBackdrop}>
      <form className="unified-booking-modal split-booking-modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}>
        <button className="modal-docked-close-btn" type="button" onClick={closeModal} aria-label="Close booking form">×</button>
        {/* Retired inline booking form retained temporarily for CSS migration.
        <button className="booking-action-close" type="button" onClick={closeModal} aria-label="Close booking form">Close</button>
        <p className="booking-action-eyebrow">RESERVATION REQUEST</p>
        <h2>{offer?.title || resolvedItem.name || resolvedItem.title}</h2>
        <p className="booking-action-capacity">{isPackage ? `Private package capacity: ${minGuests}–${maxGuests} guests` : 'Your reservation will be validated by Tripora.'}</p>
        {isPackage && <label>Guests<input type="number" min={minGuests} max={maxGuests} value={guests} onChange={(event) => setGuests(Number(event.target.value))} required /></label>}
        {!isHotel && <label>Travel date<GlassDatePicker value={travelDate} onChange={setTravelDate} minDate={MIN_TRAVEL_DATE} required /></label>}
        {isHotel && <div className="booking-action-dates"><label>Check-in<GlassDatePicker value={checkIn} onChange={setCheckIn} minDate={MIN_TRAVEL_DATE} required /></label><label>Check-out<GlassDatePicker value={checkOut} onChange={setCheckOut} minDate={MIN_TRAVEL_DATE} required /></label></div>}
        <label>Lead guest<input value={guestName} onChange={(event) => setGuestName(event.target.value)} autoComplete="name" required /></label>
        <label>Phone<input value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" required /></label>
        <label>Billing address<input value={address} onChange={(event) => setAddress(event.target.value)} autoComplete="street-address" required /></label>
        {error && <p className="booking-action-error" role="alert">{error}</p>}
        <button className="booking-action-submit" type="submit" disabled={busy}>{busy ? 'Submitting…' : 'Continue to payment'}</button>
        */}
        <div className="modal-hero-cover modal-left-visual">
          <img className="modal-visual-img" src={coverImage} alt={offer?.title || resolvedItem.name || resolvedItem.title || 'Tripora booking'} onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = FALLBACK_COVER_IMAGE;
          }} />
          <div className="modal-category-tag modal-top-tag"><span className="modal-badge-mark" aria-hidden="true">✦</span><span>{offer?.category || 'Tripora Reservation'}</span></div>
          <div className="modal-visual-scrim modal-scrim-footer">
            <h2 className="modal-hero-title modal-scrim-title">{offer?.title || resolvedItem.name || resolvedItem.title}</h2>
            {(resolvedItem.destination || resolvedItem.location) && <p className="modal-hero-subtitle modal-scrim-location">{ModalIcons.pin}<span>{resolvedItem.destination || resolvedItem.location}</span></p>}
          </div>
        </div>
        <div className="modal-scroll-body modal-right-body">
          <section className="modal-section-intro modal-header-intro">
            <h3 className="modal-about-heading">About This {offer ? 'Offer' : 'Package'}</h3>
            <p className="modal-about-description">{offer?.description || resolvedItem.description || 'A thoughtfully arranged Tripora experience.'}</p>
          </section>
          <section className="modal-spec-grid-2x2 modal-specs-grid" aria-label="Reservation details">
            <div className="spec-card-cell spec-cell"><span className="spec-icon spec-cell-icon" aria-hidden="true">{ModalIcons.duration}</span><div className="spec-info spec-cell-text"><span className="spec-label spec-cell-label">DURATION</span><span className="spec-value spec-cell-val">{duration} {duration === 1 ? 'day' : 'days'}</span></div></div>
            <div className="spec-card-cell spec-cell"><span className="spec-icon spec-cell-icon" aria-hidden="true">{ModalIcons.capacity}</span><div className="spec-info spec-cell-text"><span className="spec-label spec-cell-label">CAPACITY</span><span className="spec-value spec-cell-val">{capacity}</span></div></div>
            <div className="spec-card-cell spec-cell"><span className="spec-icon spec-cell-icon" aria-hidden="true">{ModalIcons.spots}</span><div className="spec-info spec-cell-text"><span className="spec-label spec-cell-label">AVAILABLE SPOTS</span><span className="spec-value spec-cell-val">{availableSlots === undefined || availableSlots === null ? 'Available' : `${availableSlots} remaining`}</span></div></div>
            <div className="spec-card-cell spec-cell"><span className="spec-icon spec-cell-icon" aria-hidden="true">{ModalIcons.price}</span><div className="spec-info spec-cell-text"><span className="spec-label spec-cell-label">PRICE</span><span className="spec-value spec-cell-val price-highlight">LKR {new Intl.NumberFormat('en-LK', { maximumFractionDigits: 0 }).format(price)}</span></div></div>
          </section>
          <section className="modal-booking-form-section modal-form-section" aria-labelledby="booking-form-heading">
            <div className="booking-form-header form-legend-title"><span className="calendar-icon" aria-hidden="true">{ModalIcons.bookingHeader}</span><h3 id="booking-form-heading">Complete Your Booking</h3></div>
            {error && <div className="booking-modal-alert-danger" role="alert"><span>{error}</span><button type="button" onClick={() => setError('')} aria-label="Dismiss booking error">×</button></div>}
            <div className="booking-modal-form modal-form-stack">
              {!isHotel && <div className="fields-split-row"><div className="form-field field-group"><label id="booking-travel-date-label">TRAVEL DATE</label><div id="booking-travel-date"><GlassDatePicker value={travelDate} onChange={setTravelDate} minDate={MIN_TRAVEL_DATE} required labelledBy="booking-travel-date-label" /></div></div><div className="form-field field-group"><label htmlFor="booking-participants">NUMBER OF PARTICIPANTS</label><input id="booking-participants" className="modal-dark-input glass-text-input" type="number" min={minGuests} max={maxGuests} value={guests} onChange={(event) => setGuests(Number(event.target.value))} required /></div></div>}
              {isHotel && <div className="form-group-duo field-group-row"><div className="form-field field-group"><label id="booking-check-in-label">CHECK-IN</label><div id="booking-check-in"><GlassDatePicker value={checkIn} onChange={setCheckIn} minDate={MIN_TRAVEL_DATE} required labelledBy="booking-check-in-label" /></div></div><div className="form-field field-group"><label id="booking-check-out-label">CHECK-OUT</label><div id="booking-check-out"><GlassDatePicker value={checkOut} onChange={setCheckOut} minDate={MIN_TRAVEL_DATE} required labelledBy="booking-check-out-label" /></div></div></div>}
              {isHotel && <div className="form-group-full field-group"><label htmlFor="booking-participants">NUMBER OF PARTICIPANTS</label><input id="booking-participants" className="modal-dark-input glass-text-input" type="number" min={minGuests} max={maxGuests} value={guests} onChange={(event) => setGuests(Number(event.target.value))} required /></div>}
              <div className="form-group-duo field-group-row"><div className="form-field field-group"><label htmlFor="booking-guest-name">GUEST FULL NAME</label><input id="booking-guest-name" className="modal-dark-input glass-text-input" value={guestName} onChange={(event) => setGuestName(event.target.value)} autoComplete="name" required /></div><div className="form-field field-group"><label htmlFor="booking-phone">PHONE NUMBER</label><input id="booking-phone" className="modal-dark-input glass-text-input" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" required /></div></div>
              <div className="form-group-full field-group"><label htmlFor="booking-address">BILLING ADDRESS</label><input id="booking-address" className="modal-dark-input glass-text-input" value={address} onChange={(event) => setAddress(event.target.value)} autoComplete="street-address" required /></div>
              <button className="modal-primary-submit-btn modal-submit-cta" type="submit" disabled={busy}>{busy ? 'Securing Reservation...' : 'Book Now'}</button>
            </div>
          </section>
        </div>
      </form>
    </div>, document.body)}
  </>;
}
