import { useState, useEffect } from 'react';
import RegisterForm from './components/RegisterForm';
import LoginForm from './components/LoginForm';
import CustomerDashboard from './components/CustomerDashboard';
import ProfileView from './components/ProfileView';
import TourDisplay from './components/TourDisplay';
import TourManagement from './components/TourManagement';
import './App.css';

// Helper function to decode JWT and check expiration
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    
    const payload = JSON.parse(atob(parts[1]));
    const exp = payload.exp;
    
    if (!exp) return true;
    
    // Check if token is expired (with 30 second buffer)
    const now = Math.floor(Date.now() / 1000);
    return exp < now;
  } catch {
    return true;
  }
};

function App() {
  const [authToken, setAuthToken] = useState(() => {
    const token = localStorage.getItem('tripora_token');
    // Check if token is expired on initial load
    if (token && isTokenExpired(token)) {
      localStorage.removeItem('tripora_token');
      localStorage.removeItem('tripora_user');
      return null;
    }
    return token;
  });

  const [authUser, setAuthUser] = useState(() => {
    const saved = localStorage.getItem('tripora_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'profile' | 'tours' | 'tour-management'
  const [sessionExpired, setSessionExpired] = useState(false);

  const handleLoginSuccess = (token, user) => {
    setAuthToken(token);
    setAuthUser(user);
    localStorage.setItem('tripora_token', token);
    localStorage.setItem('tripora_user', JSON.stringify(user));
    setSessionExpired(false);
  };

  const handleLogout = () => {
    setAuthToken(null);
    setAuthUser(null);
    localStorage.removeItem('tripora_token');
    localStorage.removeItem('tripora_user');
    setActiveTab('login');
    setSessionExpired(false);
  };

  const handleSessionExpired = () => {
    setAuthToken(null);
    setAuthUser(null);
    localStorage.removeItem('tripora_token');
    localStorage.removeItem('tripora_user');
    setSessionExpired(true);
    setActiveTab('login');
  };

  // Check token expiration periodically
  useEffect(() => {
    if (!authToken) return;

    const checkExpiration = () => {
      if (isTokenExpired(authToken)) {
        handleSessionExpired();
      }
    };

    // Check every 30 seconds
    const interval = setInterval(checkExpiration, 30000);
    
    // Also check immediately
    checkExpiration();

    return () => clearInterval(interval);
  }, [authToken]);

  return (
    <div className="app-layout">
      {/* Navigation Header */}
      <header className="navbar">
        <div className="nav-container">
          <div className="logo-group">
            <span className="brand-logo">✈️ Tripora</span>
            <span className="brand-tag">Travel & Tours</span>
          </div>
          <nav className="nav-links">
            <a href="#destinations" onClick={(e) => { if (authUser) { e.preventDefault(); setCurrentView('tours'); } }}>Destinations</a>
            <a href="#tours" onClick={(e) => { if (authUser) { e.preventDefault(); setCurrentView('tours'); } }}>Tour Packages</a>
            <a href="#hotels">Hotels</a>
            <a href="#support">Support</a>
          </nav>
          <div className="nav-actions">
            {authUser ? (
              <div className="auth-nav-pill">
                <span className="nav-user-name">👤 {authUser.fullName}</span>
                <div className="nav-view-buttons">
                  <button 
                    type="button" 
                    className={`nav-view-btn ${currentView === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setCurrentView('dashboard')}
                  >
                    Dashboard
                  </button>
                  <button 
                    type="button" 
                    className={`nav-view-btn ${currentView === 'profile' ? 'active' : ''}`}
                    onClick={() => setCurrentView('profile')}
                  >
                    Profile
                  </button>
                  <button 
                    type="button" 
                    className={`nav-view-btn ${currentView === 'tours' ? 'active' : ''}`}
                    onClick={() => setCurrentView('tours')}
                  >
                    Tours
                  </button>
                  {authUser?.role === 'Admin' && (
                    <button 
                      type="button" 
                      className={`nav-view-btn ${currentView === 'tour-management' ? 'active' : ''}`}
                      onClick={() => setCurrentView('tour-management')}
                    >
                      Manage Tours
                    </button>
                  )}
                </div>
                <button type="button" className="btn-nav-logout" onClick={handleLogout}>
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="tab-pill-group">
                <button 
                  type="button" 
                  className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
                  id="tab-btn-signin"
                  onClick={() => setActiveTab('login')}
                >
                  Sign In
                </button>
                <button 
                  type="button" 
                  className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`}
                  id="tab-btn-register"
                  onClick={() => setActiveTab('register')}
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Session Expired Alert */}
        {sessionExpired && (
          <div className="alert-banner alert-danger" style={{ maxWidth: '600px', margin: '0 auto 20px auto' }} role="alert">
            <div className="alert-icon">⏰</div>
            <div className="alert-content">
              <strong>Session Expired</strong>
              <p>Your authentication session has expired. Please sign in again to continue accessing your account.</p>
            </div>
          </div>
        )}

        <div className="hero-banner">
          <span className="hero-pill">✨ Travel Beyond Boundaries</span>
          <h1 className="hero-headline">
            {authUser ? 'Your Tripora Travel Portal' : 'Discover Extraordinary Journeys with Tripora'}
          </h1>
          <p className="hero-subhead">
            {authUser 
              ? 'Access your authenticated customer perks, manage bookings, and explore protected member-only itineraries.' 
              : 'Sign in to your account or register today to unlock exclusive travel packages, luxury hotels, and bespoke voyages.'}
          </p>
        </div>

        {/* Dynamic Authenticated / Tab View */}
        {authUser && authToken ? (
          <>
            {currentView === 'dashboard' && (
              <CustomerDashboard 
                user={authUser} 
                token={authToken} 
                onLogout={handleLogout}
                onSessionExpired={handleSessionExpired}
              />
            )}
            {currentView === 'profile' && (
              <ProfileView 
                token={authToken}
                onSessionExpired={handleSessionExpired}
              />
            )}
            {currentView === 'tours' && (
              <TourDisplay />
            )}
            {currentView === 'tour-management' && (
              <TourManagement 
                token={authToken}
                user={authUser}
                onSessionExpired={handleSessionExpired}
              />
            )}
          </>
        ) : (
          <div className="auth-container">
            <div className="auth-mode-switch">
              <button
                type="button"
                className={`switch-tab ${activeTab === 'login' ? 'selected' : ''}`}
                onClick={() => setActiveTab('login')}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`switch-tab ${activeTab === 'register' ? 'selected' : ''}`}
                onClick={() => setActiveTab('register')}
              >
                Create Account
              </button>
            </div>

            {activeTab === 'login' ? (
              <LoginForm 
                onLoginSuccess={handleLoginSuccess}
                onSwitchToRegister={() => setActiveTab('register')}
              />
            ) : (
              <RegisterForm 
                onSwitchToLogin={() => setActiveTab('login')}
              />
            )}
          </div>
        )}

        {/* Trust Badges */}
        <section className="trust-features">
          <div className="feature-item">
            <span className="feature-icon">🔒</span>
            <div className="feature-text">
              <h4>Bank-Grade JWT Security</h4>
              <p>Signed HMAC-SHA256 tokens and BCrypt hashed credentials protect your account.</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🌍</span>
            <div className="feature-text">
              <h4>500+ Verified Stays</h4>
              <p>Instant booking confirmation for premier boutique hotels & resorts.</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🛎️</span>
            <div className="feature-text">
              <h4>24/7 Travel Concierge</h4>
              <p>Dedicated holiday planners assist you before and during your travel.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>© 2026 Tripora Travel & Tour Booking System. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
