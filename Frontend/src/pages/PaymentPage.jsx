import { API_BASE_URL } from '../apiConfig';
import { useState, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Lock,
  Calendar,
  User,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  Printer,
  FileCheck
} from 'lucide-react';
import {
  validateLuhn,
  getCardBrand,
  formatCardNumber,
  validateCardNumber,
  formatExpiryDate,
  validateExpiryDate,
  validateCvv,
  validateCardholderName
} from '../utils/paymentValidation';
import { formatBookingRef } from '../utils/formatters';
import './PaymentPage.css';

function toGuid(id) {
  if (!id) return '00000000-0000-0000-0000-000000000001';
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (guidRegex.test(id)) return id;
  const clean = String(id).replace(/[^0-9a-f]/gi, '');
  const padded = (clean + '000000000000').slice(0, 12);
  return `00000000-0000-0000-0000-${padded}`;
}

export default function PaymentPage() {
  const { bookingId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const navState = location.state || {};

  const effectiveBookingId = bookingId || navState.bookingId || 'BK-' + Math.floor(100000 + Math.random() * 900000);
  const guestName = navState.guestName || 'Valued Traveler';
  const tourName = navState.tourName || navState.item?.name || navState.item?.tourName || navState.item?.hotelName || 'Tripora Adventure Package';
  const totalAmount = Number(navState.totalAmount || navState.item?.price || 1500);
  const bookingType = navState.bookingType || (navState.hotelId ? 'Hotel' : 'Tour');
  const travelDate = navState.travelDate ? new Date(navState.travelDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Upcoming';
  const quantity = navState.quantity || 1;

  // Form State
  const [cardholderName, setCardholderName] = useState(guestName !== 'Valued Traveler' ? guestName : '');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  // Touched state for inline validation errors
  const [touched, setTouched] = useState({
    cardholderName: false,
    cardNumber: false,
    expiryDate: false,
    cvv: false
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorBanner, setErrorBanner] = useState('');
  const [warningBanner, setWarningBanner] = useState('');

  // Payment Confirmation State
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [confirmationData, setConfirmationData] = useState(null);

  // Card formatting helpers
  // Derived card brand
  const cardBrand = useMemo(() => {
    const raw = cardNumber.replace(/\D/g, '');
    return getCardBrand(raw);
  }, [cardNumber]);

  // Real-time client-side validation
  const errors = useMemo(() => {
    const nameResult = validateCardholderName(cardholderName);
    const cardResult = validateCardNumber(cardNumber);
    const expiryResult = validateExpiryDate(expiryDate);
    const cvvResult = validateCvv(cvv, cardBrand);

    return {
      cardholderName: nameResult.isValid ? '' : nameResult.error,
      cardNumber: cardResult.isValid ? '' : cardResult.error,
      expiryDate: expiryResult.isValid ? '' : expiryResult.error,
      cvv: cvvResult.isValid ? '' : cvvResult.error
    };
  }, [cardholderName, cardNumber, expiryDate, cvv, cardBrand]);

  const isFormValid = useMemo(() => {
    return (
      !errors.cardholderName &&
      !errors.cardNumber &&
      !errors.expiryDate &&
      !errors.cvv &&
      Boolean(cardholderName.trim()) &&
      Boolean(cardNumber.trim()) &&
      Boolean(expiryDate.trim()) &&
      Boolean(cvv.trim())
    );
  }, [errors, cardholderName, cardNumber, expiryDate, cvv]);

  // Handle Input Changes
  const handleCardholderNameChange = (e) => {
    setCardholderName(e.target.value);
    if (errorBanner) setErrorBanner('');
    if (warningBanner) setWarningBanner('');
  };

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
    if (error) setError('');
    if (errorBanner) setErrorBanner('');
    if (warningBanner) setWarningBanner('');
  };

  const handleExpiryChange = (e) => {
    const formatted = formatExpiryDate(e.target.value);
    setExpiryDate(formatted);
    if (errorBanner) setErrorBanner('');
    if (warningBanner) setWarningBanner('');
  };

  const handleCvvChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCvv(raw);
    if (error) setError('');
    if (errorBanner) setErrorBanner('');
    if (warningBanner) setWarningBanner('');
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    setError('');
    setErrorBanner('');
    setWarningBanner('');

    if (!cardholderName.trim()) {
      setError('Please enter the cardholder name.');
    }

    // Mark all fields touched
    setTouched({
      cardholderName: true,
      cardNumber: true,
      expiryDate: true,
      cvv: true
    });

    if (!isFormValid || !cardholderName.trim()) {
      return;
    }

    const cleanCard = cardNumber.replace(/\s+/g, '');
    if (cleanCard.length < 15) {
      setError('Please enter a valid 15 or 16-digit card number.');
      return;
    }
    if (!expiryDate || expiryDate.length < 5) {
      setError('Please enter expiry date in MM/YY format.');
      return;
    }
    if (!cvv || cvv.length < 3) {
      setError('Please enter a valid 3 or 4-digit CVV security code.');
      return;
    }

    setLoading(true);

    const payload = {
      bookingId: toGuid(effectiveBookingId),
      userId: navState.userId || 'GuestUser',
      amount: totalAmount,
      paymentMethod: 'CreditCard',
      cardNumber: cleanCard,
      expiryDate,
      cvv
    };

    // Prepare auth headers if available
    const token = localStorage.getItem('tripora_token');
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      // Abort after 15 seconds to handle network timeouts
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`${API_BASE_URL}/api/payments/process`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        const refId = data.transactionId || `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        setConfirmationData({
          referenceId: refId,
          bookingId: effectiveBookingId,
          tourName,
          guestName: cardholderName,
          amountPaid: totalAmount,
          last4: cleanCard.slice(-4),
          paidAt: new Date().toLocaleString()
        });
        // Clear sensitive card data from form state upon success
        setCardNumber('');
        setCvv('');
        setExpiryDate('');
        setPaymentSuccess(true);
      } else {
        // Declined / Failed response from payment provider
        const declineMsg = data?.message || data?.title || 'Payment declined by payment provider. Please check your card details or try a different payment method.';
        setErrorBanner(declineMsg);
      }
    } catch (err) {
      if (err?.name === 'AbortError' || err?.message?.toLowerCase().includes('network')) {
        setWarningBanner('Network timeout or connection issue. Please do not refresh the page. Check your internet connection and try again.');
      } else {
        const errMsg = err?.response?.data?.message || err?.message || 'Unable to communicate with the payment gateway. Please check your connection or try again later.';
        setErrorBanner(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="payment-page-container">
      {/* Header */}
      <header className="payment-header">
        <div className="payment-header-inner">
          <button
            type="button"
            className="payment-back-btn"
            onClick={() => navigate('/')}
            aria-label="Back to Tripora Home"
          >
            <ArrowLeft size={16} /> Back to Home
          </button>

          <div className="payment-brand">
            <span className="payment-brand-mark">✈</span>
            <span>Tripora</span>
          </div>

          <div className="payment-security-badge">
            <ShieldCheck size={16} />
            <span>Secure 256-Bit SSL</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="payment-main">
        {paymentSuccess && confirmationData ? (
          /* Payment Confirmed Success Screen */
          <div className="payment-success-card" role="region" aria-label="Payment Confirmation">
            <div className="success-icon-wrapper">
              <CheckCircle2 size={48} />
            </div>

            <h1 className="success-title">Payment Confirmed!</h1>
            <p className="success-subtitle">
              Thank you for choosing Tripora. Your reservation is finalized and an official booking receipt has been generated below.
            </p>

            <div className="success-receipt">
              <div className="receipt-row">
                <span className="receipt-label">Payment Transaction ID</span>
                <span className="receipt-reference">{confirmationData.referenceId}</span>
              </div>

              <div className="receipt-row">
                <span className="receipt-label">Booking Reference</span>
                <span className="receipt-reference">{formatBookingRef(confirmationData.bookingId)}</span>
              </div>

              <div className="receipt-row">
                <span className="receipt-label">Travel Experience</span>
                <span className="receipt-value">{confirmationData.tourName}</span>
              </div>

              <div className="receipt-row">
                <span className="receipt-label">Cardholder Name</span>
                <span className="receipt-value">{confirmationData.guestName}</span>
              </div>

              <div className="receipt-row">
                <span className="receipt-label">Payment Method</span>
                <span className="receipt-value">Credit Card (•••• {confirmationData.last4})</span>
              </div>

              <div className="receipt-row">
                <span className="receipt-label">Date & Time</span>
                <span className="receipt-value">{confirmationData.paidAt}</span>
              </div>

              <div className="receipt-row">
                <span className="receipt-label">Status</span>
                <span className="receipt-badge-paid">PAID & CONFIRMED</span>
              </div>

              <div className="receipt-row" style={{ paddingTop: '0.5rem', borderTop: '1px dashed rgba(255,255,255,0.15)' }}>
                <span className="receipt-label" style={{ fontWeight: 700, color: '#fff' }}>Total Paid</span>
                <span className="receipt-value" style={{ fontSize: '1.25rem', color: '#9be4d8' }}>
                  ${confirmationData.amountPaid.toLocaleString()} USD
                </span>
              </div>
            </div>

            <div className="receipt-confirmation-note">
              <FileCheck size={18} color="#9be4d8" />
              <span>A confirmation email with full itinerary details and receipt has been issued to your registered address.</span>
            </div>

            <div className="success-actions">
              <button
                type="button"
                className="btn-success-home"
                onClick={() => navigate('/')}
              >
                Return to Home
              </button>

              <button
                type="button"
                className="btn-success-print"
                onClick={handlePrintReceipt}
              >
                <Printer size={16} /> Print Receipt
              </button>
            </div>
          </div>
        ) : (
          /* Payment Processing Layout */
          /* Checkout & Payment Processing Layout */
          <>
            <div className="payment-title-area">
              <span className="payment-pill">TRIPORA / SECURE CHECKOUT</span>
              <h1 className="payment-title">Complete Your Reservation</h1>
              <p className="payment-subtitle">
                Review your booking summary and finalize payment using encrypted checkout.
              </p>
            </div>

            <div className="payment-grid">
              {/* Left Column: Booking Summary */}
              <div className="payment-summary-card">
                <div className="summary-header">
                  <h3>Booking Summary</h3>
                  <span className="booking-badge">{bookingType}</span>
                </div>

                <h2 className="summary-item-name">{tourName}</h2>

                <div className="summary-details-list">
                  <div className="summary-detail-row">
                    <span className="detail-label"><User size={14} /> Guest Name</span>
                    <span className="detail-value">{guestName}</span>
                  </div>

                  <div className="summary-detail-row">
                    <span className="detail-label"><Calendar size={14} /> Travel Date</span>
                    <span className="detail-value">{travelDate}</span>
                  </div>

                  <div className="summary-detail-row">
                    <span className="detail-label"><Clock size={14} /> Quantity / Guests</span>
                    <span className="detail-value">{quantity} {bookingType === 'Tour' ? 'Participant(s)' : 'Room(s)'}</span>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="price-breakdown">
                  <div className="price-row">
                    <span>Base Fare</span>
                    <span>${totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="price-row">
                    <span>Taxes & Service Charges</span>
                    <span>Included</span>
                  </div>
                  <div className="price-row total-row">
                    <span>Total Amount</span>
                    <span className="total-amount">${totalAmount.toLocaleString()} USD</span>
                  </div>
                </div>

                <div className="summary-guarantee">
                  <ShieldCheck size={18} color="#9be4d8" />
                  <span>Free cancellation up to 48 hours prior to journey. Instant booking confirmation.</span>
                </div>
              </div>

              {/* Right Column: Card Payment Inputs */}
              <div className="payment-form-card">
                <div className="form-header">
                  <h3>Credit / Debit Card</h3>
                  <div className="card-brands" aria-label="Accepted card brands">
                    <span className={`card-brand-pill ${cardBrand === 'VISA' ? 'active' : ''}`}>VISA</span>
                    <span className={`card-brand-pill ${cardBrand === 'MC' ? 'active' : ''}`}>MC</span>
                    <span className={`card-brand-pill ${cardBrand === 'AMEX' ? 'active' : ''}`}>AMEX</span>
                    <span className={`card-brand-pill ${cardBrand === 'DISCOVER' ? 'active' : ''}`}>DISC</span>
                  </div>
                </div>

                <form className="payment-form" onSubmit={handleSubmitPayment} noValidate>
                  {errorBanner && (
                    <div className="payment-error-banner" role="alert">
                      <AlertCircle size={18} />
                      <span>{errorBanner}</span>
                    </div>
                  )}

                  {warningBanner && (
                    <div className="payment-warning-banner" role="alert">
                      <AlertTriangle size={18} />
                      <span>{warningBanner}</span>
                    </div>
                  )}

                  {/* Cardholder Name */}
                  <div className="form-group">
                    <label htmlFor="cardholderName">Cardholder Name</label>
                    <div className={`input-with-icon ${touched.cardholderName && errors.cardholderName ? 'has-error' : ''}`}>
                      <span className="input-icon"><User size={16} /></span>
                      <input
                        id="cardholderName"
                        type="text"
                        placeholder="e.g. John Doe"
                        value={cardholderName}
                        required
                        onChange={handleCardholderNameChange}
                        onBlur={() => handleBlur('cardholderName')}
                        aria-invalid={touched.cardholderName && Boolean(errors.cardholderName)}
                        aria-describedby={touched.cardholderName && errors.cardholderName ? 'cardholderName-error' : undefined}
                      />
                    </div>
                    {touched.cardholderName && errors.cardholderName && (
                      <span id="cardholderName-error" className="field-error" role="alert">
                        <AlertCircle size={12} /> {errors.cardholderName}
                      </span>
                    )}
                  </div>

                  {/* Card Number */}
                  <div className="form-group">
                    <label htmlFor="cardNumber">Card Number</label>
                    <div className={`input-with-icon ${touched.cardNumber && errors.cardNumber ? 'has-error' : ''}`}>
                      <span className="input-icon"><CreditCard size={16} /></span>
                      <input
                        id="cardNumber"
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        onBlur={() => handleBlur('cardNumber')}
                        maxLength={19}
                        required
                        aria-invalid={touched.cardNumber && Boolean(errors.cardNumber)}
                        aria-describedby={touched.cardNumber && errors.cardNumber ? 'cardNumber-error' : undefined}
                      />
                    </div>
                    {touched.cardNumber && errors.cardNumber && (
                      <span id="cardNumber-error" className="field-error" role="alert">
                        <AlertCircle size={12} /> {errors.cardNumber}
                      </span>
                    )}
                  </div>

                  <div className="form-row">
                    {/* Expiry Date */}
                    <div className="form-group">
                      <label htmlFor="expiryDate">Expiry Date</label>
                      <div className={`input-with-icon ${touched.expiryDate && errors.expiryDate ? 'has-error' : ''}`}>
                        <span className="input-icon"><Calendar size={16} /></span>
                        <input
                          id="expiryDate"
                          type="text"
                          placeholder="MM/YY"
                          value={expiryDate}
                          onChange={handleExpiryChange}
                          onBlur={() => handleBlur('expiryDate')}
                          maxLength={5}
                          required
                          aria-invalid={touched.expiryDate && Boolean(errors.expiryDate)}
                          aria-describedby={touched.expiryDate && errors.expiryDate ? 'expiryDate-error' : undefined}
                        />
                      </div>
                      {touched.expiryDate && errors.expiryDate && (
                        <span id="expiryDate-error" className="field-error" role="alert">
                          <AlertCircle size={12} /> {errors.expiryDate}
                        </span>
                      )}
                    </div>

                    {/* CVV */}
                    <div className="form-group">
                      <label htmlFor="cvv">CVV / CVC</label>
                      <div className={`input-with-icon ${touched.cvv && errors.cvv ? 'has-error' : ''}`}>
                        <span className="input-icon"><Lock size={16} /></span>
                        <input
                          id="cvv"
                          type="password"
                          placeholder="123"
                          value={cvv}
                          onChange={handleCvvChange}
                          onBlur={() => handleBlur('cvv')}
                          maxLength={4}
                          required
                          aria-invalid={touched.cvv && Boolean(errors.cvv)}
                          aria-describedby={touched.cvv && errors.cvv ? 'cvv-error' : undefined}
                        />
                      </div>
                      {touched.cvv && errors.cvv && (
                        <span id="cvv-error" className="field-error" role="alert">
                          <AlertCircle size={12} /> {errors.cvv}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-pay-now"
                    disabled={!isFormValid || loading}
                    aria-label={`Pay $${totalAmount.toLocaleString()} USD`}
                  >
                    {loading ? (
                      <span>Processing Payment...</span>
                    ) : (
                      <>
                        <Lock size={16} /> Pay ${totalAmount.toLocaleString()} USD
                      </>
                    )}
                  </button>

                  <div className="payment-footnote">
                    <Lock size={12} />
                    <span>Your payment is secured with 256-bit encryption. Card details are never stored.</span>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

