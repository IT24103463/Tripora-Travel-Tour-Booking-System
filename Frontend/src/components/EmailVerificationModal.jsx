import { useEffect, useRef, useState } from 'react';
import api from '../api/apiClient';
import './EmailVerificationModal.css';

const OTP_LENGTH = 6;

export default function EmailVerificationModal({ email, onVerified, onClose, initialResendAfter = 0, autoResend = false }) {
  const [digits, setDigits] = useState(() => Array(OTP_LENGTH).fill(''));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [resendAfter, setResendAfter] = useState(initialResendAfter);
  const inputRefs = useRef([]);
  const automaticResendRequested = useRef(false);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendAfter <= 0) return undefined;
    const timer = window.setTimeout(() => setResendAfter((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendAfter]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const setDigit = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    setError('');
    setDigits((current) => current.map((item, itemIndex) => itemIndex === index ? digit : item));
    if (digit && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (event, index) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pastedDigits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
    if (!pastedDigits.length) return;
    setError('');
    setDigits(Array.from({ length: OTP_LENGTH }, (_, index) => pastedDigits[index] || ''));
    inputRefs.current[Math.min(pastedDigits.length, OTP_LENGTH) - 1]?.focus();
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    const code = digits.join('');
    if (code.length !== OTP_LENGTH) {
      setError('Enter all six digits from your verification email.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const response = await api.post('/users/verify-email', { email, code });
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Unable to verify this code.');
      }
      const session = response.data?.data;
      if (!session?.token || !session?.user) {
        throw new Error('Verification succeeded but no authentication session was returned. Please sign in again.');
      }
      onVerified(session);
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to verify this code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendAfter > 0 || isResending) return;
    setIsResending(true);
    setError('');
    setNotice('');
    try {
      const response = await api.post('/users/resend-verification', { email });
      const retryAfterSeconds = Number(response.data?.data?.retryAfterSeconds) || 60;
      setResendAfter(retryAfterSeconds);
      setNotice('A new verification code has been requested. Check your inbox and Spam or Junk folder.');
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch (requestError) {
      const retryAfterSeconds = Number(requestError.response?.data?.data?.retryAfterSeconds);
      if (retryAfterSeconds > 0) setResendAfter(retryAfterSeconds);
      setError(requestError.response?.data?.message || 'Unable to resend a verification code.');
    } finally {
      setIsResending(false);
    }
  };

  useEffect(() => {
    if (!autoResend || automaticResendRequested.current) return;
    automaticResendRequested.current = true;
    void handleResend();
  }, [autoResend]);

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div className="email-verification-backdrop" onClick={handleBackdropClick} role="presentation">
      <section className="email-verification-modal" role="dialog" aria-modal="true" aria-labelledby="verification-title" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="email-verification-close" aria-label="Close verification" onClick={(event) => { event.preventDefault(); event.stopPropagation(); onClose(); }}>
          ×
        </button>
        <div className="email-verification-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
          </svg>
        </div>
        <span className="email-verification-eyebrow">EMAIL SECURITY</span>
        <h2 id="verification-title">Verify your email</h2>
        <p className="email-verification-copy">Enter the six-digit code sent to <strong>{email}</strong>.</p>
        <p className="email-verification-spam-hint">If it is not in your inbox, check your Spam or Junk folder.</p>

        <form onSubmit={handleVerify}>
          <div className="otp-input-row" aria-label="Six digit verification code">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(element) => { inputRefs.current[index] = element; }}
                aria-label={`Verification digit ${index + 1}`}
                className="otp-digit-input"
                inputMode="numeric"
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                maxLength={1}
                value={digit}
                onChange={(event) => setDigit(index, event.target.value)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                onPaste={handlePaste}
              />
            ))}
          </div>

          {error && <p className="email-verification-message error" role="alert">{error}</p>}
          {notice && <p className="email-verification-message notice" role="status">{notice}</p>}

          <button type="submit" className="email-verification-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Verifying...' : 'Verify email'}
          </button>
        </form>

        <div className="email-verification-resend">
          <span>Did not receive a code?</span>
          <button type="button" onClick={handleResend} disabled={resendAfter > 0 || isResending}>
            {isResending ? 'Requesting...' : resendAfter > 0 ? `Resend in ${resendAfter}s` : 'Resend code'}
          </button>
        </div>
      </section>
    </div>
  );
}
