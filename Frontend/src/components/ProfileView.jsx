import { useState, useEffect } from 'react';
import { isTokenExpired } from '../App.jsx';
import { API_BASE_URL } from '../apiConfig';
import { Link } from 'react-router-dom';
import './ProfileView.css';
import { AlertTriangle, User, LogOut } from 'lucide-react';

const API_PROFILE_ENDPOINT = `${API_BASE_URL}/api/users/me`;

export default function ProfileView({ token, onSessionExpired, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!token) {
      setError('Authentication required. Please log in to view your profile.');
      setLoading(false);
      return;
    }

    if (isTokenExpired(token)) {
      if (onSessionExpired) {
        onSessionExpired();
      }
      setError('Your session has expired. Please log in again.');
      setLoading(false);
      return;
    }

    fetchProfile();
  }, [token, retryCount]);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(API_PROFILE_ENDPOINT, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setProfile(data.data);
      } else if (response.status === 401) {
        if (onSessionExpired) {
          onSessionExpired();
        }
        setError('Authentication failed. Please log in again.');
      } else if (response.status === 404) {
        setError('Profile not found. Your account may have been deleted.');
      } else {
        setError(data.message || 'Failed to retrieve profile information.');
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
      setError('Unable to connect to the server. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="tripora-card profile-card">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your profile information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tripora-card profile-card">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Profile Error</h3>
          <p>{error}</p>
          <button 
            type="button" 
            className="btn-retry" 
            onClick={handleRetry}
          >
            ↻ Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="tripora-card profile-card">
        <div className="error-state">
          <div className="error-icon"><User size={32} /></div>
          <h3>No Profile Data</h3>
          <p>Unable to load profile information.</p>
          <button 
            type="button" 
            className="btn-retry" 
            onClick={handleRetry}
          >
            ↻ Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tripora-card profile-card">
      <div className="profile-brand-row profile-header">
        <Link className="tripora-brand-lockup profile-nav-brand" to="/" aria-label="Tripora home">
          <span className="brand-icon-circle" aria-hidden="true">
            <svg className="brand-plane-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z" />
            </svg>
          </span>
          <span className="brand-text-group">
            <span className="brand-main-name">Tripora</span>
            <span className="brand-sub-name">Travel &amp; Tours</span>
          </span>
        </Link>
        <span className="profile-tier-badge tripora-slogan-capsule">
          <span className="slogan-sparkle" aria-hidden="true">✦</span>
          <span className="slogan-text">{profile.role || 'Customer'} Account</span>
        </span>
      </div>
      <div className="profile-header">
        <div className="profile-avatar-large" aria-label={profile.fullName || 'Tripora member'}>
          {profile.fullName?.charAt(0)?.toUpperCase() || 'T'}
          <span className="brand-mark profile-plane">✈</span>
        </div>
        <div className="profile-title-section">
          <h2 className="profile-title page-title">My Profile</h2>
          <p className="profile-subtitle page-subtitle">View and manage your Tripora account information</p>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-section">
          <h3 className="section-heading">Personal Information</h3>
          
          <div className="profile-field">
            <label className="field-label">Full Name</label>
            <div className="field-value">{profile.fullName}</div>
          </div>

          <div className="profile-field">
            <label className="field-label">Email Address</label>
            <div className="field-value">{profile.email}</div>
          </div>

          <div className="profile-field">
            <label className="field-label">Account Type</label>
            <div className="field-value">
              <span className="role-badge">{profile.role || 'Customer'}</span>
            </div>
          </div>

          <div className="profile-field">
            <label className="field-label">Member Since</label>
            <div className="field-value">
              {new Date(profile.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>

        <div className="profile-actions">
          <button
            type="button"
            className="btn-signout"
            onClick={onLogout}
            id="btn-profile-signout"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
