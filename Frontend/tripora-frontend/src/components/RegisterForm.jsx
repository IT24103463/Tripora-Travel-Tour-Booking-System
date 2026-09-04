import { useState, useMemo } from 'react';
import './RegisterForm.css';

const API_ENDPOINT = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/users/register';

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [isDuplicateEmail, setIsDuplicateEmail] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [registeredUser, setRegisteredUser] = useState(null);

  // Email format check
  const isEmailValid = useMemo(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(formData.email.trim());
  }, [formData.email]);

  // Password requirement criteria checks
  const passwordCriteria = useMemo(() => {
    const p = formData.password;
    return {
      minLength: p.length >= 8,
      hasUpper: /[A-Z]/.test(p),
      hasLower: /[a-z]/.test(p),
      hasNumber: /[0-9]/.test(p),
      hasSpecial: /[^A-Za-z0-9]/.test(p)
    };
  }, [formData.password]);

  const passwordScore = useMemo(() => {
    const passed = Object.values(passwordCriteria).filter(Boolean).length;
    return passed;
  }, [passwordCriteria]);

  const isPasswordValid = passwordScore === 5;
  const isConfirmPasswordValid = formData.confirmPassword.length > 0 && formData.password === formData.confirmPassword;
  const isFullNameValid = formData.fullName.trim().length >= 2;

  const isFormValid = isFullNameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setServerError(null);
    setIsDuplicateEmail(false);
    setValidationErrors([]);
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    setTouched({
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true
    });

    if (!isFormValid) {
      const clientErrors = [];
      if (!isFullNameValid) clientErrors.push('Full Name must be at least 2 characters.');
      if (!isEmailValid) clientErrors.push('A valid email address is required.');
      if (!isPasswordValid) clientErrors.push('Password must satisfy all 5 security requirements.');
      if (!isConfirmPasswordValid) clientErrors.push('Passwords do not match.');
      setValidationErrors(clientErrors);
      return;
    }

    setIsSubmitting(true);
    setServerError(null);
    setIsDuplicateEmail(false);
    setValidationErrors([]);

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.status === 201 && data.success) {
        setRegisteredUser(data.data);
      } else if (response.status === 409) {
        setIsDuplicateEmail(true);
        setServerError('An account with this email address already exists. Please sign in or use a different email.');
      } else if (response.status === 400) {
        setValidationErrors(data.errors && data.errors.length > 0 ? data.errors : [data.message || 'Validation failed.']);
      } else {
        setServerError(data.message || 'Account creation failed. Please check your connection and retry.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setServerError('Unable to reach the server. Please check your connection and retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    setTouched({
      fullName: false,
      email: false,
      password: false,
      confirmPassword: false
    });
    setRegisteredUser(null);
    setServerError(null);
    setIsDuplicateEmail(false);
    setValidationErrors([]);
  };

  if (registeredUser) {
    return (
      <div className="tripora-card success-card" id="registration-success">
        <div className="success-icon-badge">
          <svg viewBox="0 0 24 24" width="36" height="36" stroke="currentColor" strokeWidth="2.5" fill="none">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="success-title">Welcome to Tripora!</h2>
        <p className="success-subtitle">Your account has been created successfully.</p>
        
        <div className="user-details-box">
          <div className="user-detail-row">
            <span className="label">Customer Name:</span>
            <span className="value" id="created-user-name">{registeredUser.fullName}</span>
          </div>
          <div className="user-detail-row">
            <span className="label">Account Email:</span>
            <span className="value" id="created-user-email">{registeredUser.email}</span>
          </div>
          <div className="user-detail-row">
            <span className="label">Account Role:</span>
            <span className="value badge">{registeredUser.role || 'Customer'}</span>
          </div>
        </div>

        <p className="success-description">
          You are now ready to explore exotic destinations, book luxury stays, and plan unforgettable tour packages.
        </p>

        <div className="success-actions">
          <button type="button" className="btn-primary" onClick={resetForm}>
            Register Another Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tripora-card" id="registration-container">
      <div className="card-header">
        <div className="brand-badge">Tripora Travel</div>
        <h1 className="card-title">Create an Account</h1>
        <p className="card-subtitle">
          Join Tripora to unlock exclusive travel deals, book custom tours, and manage your journeys.
        </p>
      </div>

      {/* Duplicate Email Alert */}
      {isDuplicateEmail && (
        <div className="alert-banner alert-warning" id="duplicate-email-alert" role="alert">
          <div className="alert-icon">⚠️</div>
          <div className="alert-content">
            <strong>Email Already Registered</strong>
            <p>An account with <em>{formData.email}</em> already exists. Please sign in or use a different email.</p>
          </div>
        </div>
      )}

      {/* General / Server Error Alert with Retry */}
      {serverError && !isDuplicateEmail && (
        <div className="alert-banner alert-danger" id="server-error-alert" role="alert">
          <div className="alert-icon">❌</div>
          <div className="alert-content">
            <strong>Something Went Wrong</strong>
            <p>{serverError}</p>
            <button 
              type="button" 
              className="btn-retry" 
              id="btn-retry-registration"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Retrying...' : '↻ Try Again'}
            </button>
          </div>
        </div>
      )}

      {/* Validation Errors List */}
      {validationErrors.length > 0 && (
        <div className="alert-banner alert-danger" id="validation-errors-alert" role="alert">
          <div className="alert-icon">⚠️</div>
          <div className="alert-content">
            <strong>Please correct the following:</strong>
            <ul className="error-list">
              {validationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="registration-form" id="register-form">
        {/* Full Name */}
        <div className="form-group">
          <label htmlFor="fullName">Full Name <span className="req">*</span></label>
          <div className="input-wrapper">
            <span className="input-icon">👤</span>
            <input
              type="text"
              id="fullName"
              name="fullName"
              placeholder="e.g. Eleanor Vance"
              value={formData.fullName}
              onChange={handleChange}
              onBlur={() => handleBlur('fullName')}
              className={touched.fullName && !isFullNameValid ? 'input-error' : ''}
              disabled={isSubmitting}
              autoComplete="name"
              required
            />
          </div>
          {touched.fullName && !isFullNameValid && (
            <span className="field-error" id="fullName-error">
              Full Name must be between 2 and 100 characters.
            </span>
          )}
        </div>

        {/* Email Address */}
        <div className="form-group">
          <label htmlFor="email">Email Address <span className="req">*</span></label>
          <div className="input-wrapper">
            <span className="input-icon">✉️</span>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              onBlur={() => handleBlur('email')}
              className={(touched.email && !isEmailValid) || isDuplicateEmail ? 'input-error' : ''}
              disabled={isSubmitting}
              autoComplete="email"
              required
            />
          </div>
          {touched.email && !isEmailValid && (
            <span className="field-error" id="email-error">
              Please enter a valid email address (e.g. traveler@tripora.com).
            </span>
          )}
        </div>

        {/* Password */}
        <div className="form-group">
          <label htmlFor="password">Password <span className="req">*</span></label>
          <div className="input-wrapper">
            <span className="input-icon">🔒</span>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={handleChange}
              onBlur={() => handleBlur('password')}
              className={touched.password && !isPasswordValid ? 'input-error' : ''}
              disabled={isSubmitting}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              className="toggle-password-btn"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '👁️' : '🙈'}
            </button>
          </div>

          {/* Password Strength Meter */}
          {formData.password.length > 0 && (
            <div className="password-strength-container" id="password-strength-indicator">
              <div className="strength-header">
                <span>Password Strength:</span>
                <span className={`strength-label strength-${passwordScore}`}>
                  {passwordScore <= 2 ? 'Weak' : passwordScore <= 4 ? 'Moderate' : 'Strong & Secure'}
                </span>
              </div>
              <div className="strength-bar-track">
                <div 
                  className={`strength-bar-fill strength-fill-${passwordScore}`} 
                  style={{ width: `${(passwordScore / 5) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Password Security Requirements Checklist */}
          <div className="requirements-checklist" id="password-requirements">
            <div className="requirements-title">Password must satisfy:</div>
            <div className={`req-item ${passwordCriteria.minLength ? 'met' : ''}`}>
              <span className="req-icon">{passwordCriteria.minLength ? '✓' : '○'}</span>
              <span>At least 8 characters</span>
            </div>
            <div className={`req-item ${passwordCriteria.hasUpper ? 'met' : ''}`}>
              <span className="req-icon">{passwordCriteria.hasUpper ? '✓' : '○'}</span>
              <span>At least 1 uppercase letter (A-Z)</span>
            </div>
            <div className={`req-item ${passwordCriteria.hasLower ? 'met' : ''}`}>
              <span className="req-icon">{passwordCriteria.hasLower ? '✓' : '○'}</span>
              <span>At least 1 lowercase letter (a-z)</span>
            </div>
            <div className={`req-item ${passwordCriteria.hasNumber ? 'met' : ''}`}>
              <span className="req-icon">{passwordCriteria.hasNumber ? '✓' : '○'}</span>
              <span>At least 1 number (0-9)</span>
            </div>
            <div className={`req-item ${passwordCriteria.hasSpecial ? 'met' : ''}`}>
              <span className="req-icon">{passwordCriteria.hasSpecial ? '✓' : '○'}</span>
              <span>At least 1 special character (!@#$%^&*)</span>
            </div>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password <span className="req">*</span></label>
          <div className="input-wrapper">
            <span className="input-icon">🛡️</span>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              onBlur={() => handleBlur('confirmPassword')}
              className={touched.confirmPassword && !isConfirmPasswordValid ? 'input-error' : ''}
              disabled={isSubmitting}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              className="toggle-password-btn"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              tabIndex={-1}
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirmPassword ? '👁️' : '🙈'}
            </button>
          </div>
          {touched.confirmPassword && formData.confirmPassword && !isConfirmPasswordValid && (
            <span className="field-error" id="confirmPassword-error">
              Passwords do not match.
            </span>
          )}
          {formData.confirmPassword && isConfirmPasswordValid && (
            <span className="field-success" id="confirmPassword-success">
              ✓ Passwords match
            </span>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="btn-submit"
          id="btn-register-submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="spinner-wrapper">
              <span className="spinner" /> Creating Account...
            </span>
          ) : (
            'Create Customer Account'
          )}
        </button>

        <div className="form-footer">
          Already registered? <a href="#signin" className="link-signin">Sign in to Tripora</a>
        </div>
      </form>
    </div>
  );
}
