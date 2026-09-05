import { useState, useEffect } from 'react';
import { isTokenExpired } from '../App.jsx';
import './ProfileView.css';

const API_PROFILE_ENDPOINT = 'http://localhost:5001/api/users/me';

export default function ProfileView({ token, onSessionExpired }) {
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
          <div className="error-icon">👤</div>
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
        <div className="profile-header">
          <div className="profile-avatar">
            <span className="avatar-emoji">✈️</span>
          </div>
          <div className="profile-title-section">
            <h2 className="profile-title">My Profile</h2>
            <p className="profile-subtitle">View and manage your Tripora account information</p>
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
              <label className="field-label">Account ID</label>
              <div className="field-value mono-value">{profile.id}</div>
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
              className="btn-refresh" 
              onClick={handleRetry}
            >
              ↻ Refresh Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}