import { useState } from 'react';
import { isTokenExpired } from '../App.jsx';
import './LoginForm.css';

const API_LOGIN_ENDPOINT = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace('/register', '/login')
  : 'http://localhost:5001/api/users/login';

export default function LoginForm({ onLoginSuccess, onSwitchToRegister }) {
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
  const [validationErrors, setValidationErrors] = useState([]);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());
  const isPasswordValid = formData.password.length > 0;
  const isFormValid = isEmailValid && isPasswordValid;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setLoginError(null);
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

  return (
    <div className="tripora-card" id="login-container">
      <div className="card-header">
        <div className="brand-badge">Tripora Security</div>
        <h1 className="card-title">Customer Sign In</h1>
        <p className="card-subtitle">
          Enter your credentials to access your personalized travel dashboard, itineraries, and bookings.
        </p>
      </div>

      {/* Authentication Error Banner */}
      {loginError && (
        <div className="alert-banner alert-danger" id="login-error-alert" role="alert">
          <div className="alert-icon"></div>
          <div className="alert-content">
            <strong>Authentication Failed</strong>
            <p>{loginError}</p>
            <button 
              type="button" 
              className="btn-retry" 
              id="btn-retry-login"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Retrying...' : '↻ Try Again'}
            </button>
          </div>
        </div>
      )}

      {/* Validation Errors Alert */}
      {validationErrors.length > 0 && (
        <div className="alert-banner alert-danger" id="login-validation-alert" role="alert">
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
