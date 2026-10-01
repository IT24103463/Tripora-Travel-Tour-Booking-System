import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { isTokenExpired } from '../App.jsx';
import { API_BASE_URL } from '../apiConfig';
import { GOOGLE_CLIENT_ID } from '../googleAuthConfig';
import './LoginForm.css';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const API_LOGIN_ENDPOINT = `${API_BASE_URL}/api/users/login`;
const API_GOOGLE_LOGIN_ENDPOINT = `${API_BASE_URL}/api/users/google-login`;

export default function LoginForm({ onLoginSuccess, onSwitchToRegister, onVerificationRequired, googleClientId }) {
  const resolvedGoogleClientId = googleClientId || GOOGLE_CLIENT_ID;
  const location = useLocation();
  const formRef = useRef(null);
  const emailInputRef = useRef(null);
  const errorBannerRef = useRef(null);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [touched, setTouched] = useState({
    email: false,
    password: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);

  useEffect(() => {
    let focusTimer;
    const scrollTimer = window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      focusTimer = window.setTimeout(() => {
        emailInputRef.current?.focus({ preventScroll: true });
      }, 350);
    }, 150);

    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(focusTimer);
    };
  }, [location.key]);

  useEffect(() => {
    if (!loginError && validationErrors.length === 0) return undefined;
    const timer = window.setTimeout(() => {
      errorBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      errorBannerRef.current?.focus({ preventScroll: true });
    }, 100);
    return () => window.clearTimeout(timer);
  }, [loginError, validationErrors]);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());
  const isPasswordValid = formData.password.length > 0;
  const isFormValid = isEmailValid && isPasswordValid;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setLoginError(null);
    setUnverifiedEmail('');
    setValidationErrors([]);
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    setTouched({ email: true, password: true });

    if (!isFormValid) {
      const errors = [];
      if (!isEmailValid) errors.push('Please enter a valid email address.');
      if (!isPasswordValid) errors.push('Password is required.');
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setLoginError(null);
    setUnverifiedEmail('');
    setValidationErrors([]);

    try {
      const response = await fetch(API_LOGIN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Validate that the received token is not already expired
        if (isTokenExpired(data.data.token)) {
          setLoginError('Received an expired authentication token. Please try logging in again.');
          return;
        }
        
        if (onLoginSuccess) {
          onLoginSuccess(data.data.token, data.data.user);
        }
      } else if (
        response.status === 403
        && (
          data.isUnverified === true
          || /verify your email address before signing in/i.test(data.message || '')
        )
      ) {
        setUnverifiedEmail(data.email || formData.email.trim().toLowerCase());
        setLoginError(data.message || 'Please verify your email address before signing in.');
      } else if (response.status === 401) {
        setLoginError(data.message || 'Incorrect email or password. Please verify your credentials.');
      } else if (response.status === 400) {
        setValidationErrors(data.errors && data.errors.length > 0 ? data.errors : [data.message || 'Validation failed.']);
      } else {
        setLoginError(data.message || 'Authentication service temporarily unavailable. Please retry.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setLoginError('Unable to connect to the authentication service. Please check your connection and retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      setLoginError('Google Sign-In did not return a credential. Please try again.');
      return;
    }

    setIsSubmitting(true);
    setLoginError(null);
    setUnverifiedEmail('');
    setValidationErrors([]);

    try {
      const response = await fetch(API_GOOGLE_LOGIN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: credentialResponse.credential }),
      });
      const responseBody = await response.json();
      const loginData = responseBody?.data;
      if (!response.ok || !responseBody?.success || !loginData?.token || !loginData?.user) {
        throw new Error(responseBody?.message || 'Google Sign-In failed. Please try again.');
      }

      if (isTokenExpired(loginData.token)) {
        throw new Error('Received an expired authentication token. Please try again.');
      }

      onLoginSuccess?.(loginData.token, loginData.user);
    } catch (error) {
      setLoginError(error.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomGoogleLogin = () => {
    const googleIdentity = window.google?.accounts?.id;
    if (!googleIdentity) {
      setLoginError('Google Sign-In is still loading. Please try again.');
      return;
    }

    googleIdentity.initialize({
      client_id: resolvedGoogleClientId,
      callback: handleGoogleSuccess,
      cancel_on_tap_outside: true,
    });
    googleIdentity.prompt();
  };

  return (
    <div ref={formRef} className="tripora-card" id="login-container">
      <div className="card-header">
        <div className="brand-badge">Tripora Security</div>
        <h1 className="card-title">Customer Sign In</h1>
        <p className="card-subtitle">
          Enter your credentials to access your personalized travel dashboard, itineraries, and bookings.
        </p>
      </div>

      {/* Authentication Error Banner */}
      {loginError && (
        <div ref={errorBannerRef} tabIndex={-1} className="alert-banner alert-danger" id="login-error-alert" role="alert">
          <div className="alert-icon"></div>
          <div className="alert-content">
            <strong>{unverifiedEmail ? 'Email verification required' : 'Authentication Failed'}</strong>
            <p>{loginError}</p>
            {unverifiedEmail && (
              <button
                type="button"
                className="btn-verify-email"
                onClick={() => onVerificationRequired?.(unverifiedEmail, {
                  resetLogin: true,
                  initialResendAfter: 0,
                  autoResend: true,
                })}
              >
                Verify Email Now →
              </button>
            )}
            {!unverifiedEmail && <button
              type="button" 
              className="btn-retry" 
              id="btn-retry-login"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Retrying...' : '↻ Try Again'}
            </button>}
          </div>
        </div>
      )}

      {/* Validation Errors Alert */}
      {validationErrors.length > 0 && (
        <div ref={errorBannerRef} tabIndex={-1} className="alert-banner alert-danger" id="login-validation-alert" role="alert">
          <div className="alert-icon"></div>
          <div className="alert-content">
            <strong>Please check your input:</strong>
            <ul className="error-list">
              {validationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="registration-form" id="login-form">
        {/* Email Address */}
        <div className="form-group">
          <label htmlFor="login-email">Email Address <span className="req">*</span></label>
          <div className="input-wrapper">
            <span className="input-icon"></span>
            <input
              ref={emailInputRef}
              type="email"
              id="login-email"
              name="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              onBlur={() => handleBlur('email')}
              className={touched.email && !isEmailValid ? 'input-error' : ''}
              disabled={isSubmitting}
              autoComplete="email"
              required
            />
          </div>
          {touched.email && !isEmailValid && (
            <span className="field-error" id="login-email-error">
              Please enter a valid email address.
            </span>
          )}
        </div>

        {/* Password */}
        <div className="form-group">
          <div className="label-with-link">
            <label htmlFor="login-password">Password <span className="req">*</span></label>
            <span className="helper-hint">Case-sensitive</span>
          </div>
          <div className="input-wrapper">
            <span className="input-icon"></span>
            <input
              type={showPassword ? 'text' : 'password'}
              id="login-password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              onBlur={() => handleBlur('password')}
              className={touched.password && !isPasswordValid ? 'input-error' : ''}
              disabled={isSubmitting}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="toggle-password-btn"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A10.8 10.8 0 0 1 12 5c5.2 0 8.7 4.2 9.8 6.1a1.7 1.7 0 0 1 0 .8 15.3 15.3 0 0 1-3.1 3.8M6.2 6.2C4.1 7.6 2.7 9.5 2.2 11.1a1.7 1.7 0 0 0 0 .8C3.3 13.8 6.8 18 12 18c1 0 2-.2 2.8-.5" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M2.2 12.1C3.3 10.2 6.8 6 12 6s8.7 4.2 9.8 6.1a1.7 1.7 0 0 1 0 .8C20.7 14.8 17.2 19 12 19s-8.7-4.2-9.8-6.1a1.7 1.7 0 0 1 0-.8Z" />
                  <circle cx="12" cy="12.5" r="2.7" />
                </svg>
              )}
            </button>
          </div>
          {touched.password && !isPasswordValid && (
            <span className="field-error" id="login-password-error">
              Password is required.
            </span>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="btn-submit"
          id="btn-login-submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="spinner-wrapper">
              <span className="spinner" /> Authenticating...
            </span>
          ) : (
            'Sign In to Tripora'
          )}
        </button>

        <>
          <div className="auth-divider" aria-hidden="true">
            <div className="divider-line" />
            <span className="divider-text">OR CONTINUE WITH</span>
            <div className="divider-line" />
          </div>
          <button type="button" onClick={handleCustomGoogleLogin} className="obsidian-google-btn" disabled={isSubmitting}>
            <span className="google-icon-wrapper" aria-hidden="true">
              <svg className="google-svg" viewBox="0 0 24 24" width="18" height="18">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
              </svg>
            </span>
            <span className="google-btn-text">Continue with Google</span>
          </button>
        </>

        <div className="form-footer">
          Don't have an account yet?{' '}
          <button 
            type="button" 
            className="link-switch-btn" 
            onClick={onSwitchToRegister}
          >
            Create Customer Account
          </button>
        </div>
      </form>
    </div>
  );
}
