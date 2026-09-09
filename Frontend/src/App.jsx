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
  const [showAuth, setShowAuth] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'profile' | 'tours' | 'tour-management'
  const [sessionExpired, setSessionExpired] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const handleLoginSuccess = (token, user) => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
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
    setProfileMenuOpen(false);
  };

  const handleSessionExpired = () => {
    setAuthToken(null);
    setAuthUser(null);
    localStorage.removeItem('tripora_token');
    localStorage.removeItem('tripora_user');
    setSessionExpired(true);
    setActiveTab('login');
    setProfileMenuOpen(false);
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
    <div className={`app-layout ${!authUser && !showAuth ? 'landing-mode' : ''} ${!authUser && showAuth ? 'auth-mode' : ''} ${authUser ? 'authenticated-mode' : ''}`}>
      {/* Navigation Header */}
      <header className="navbar">
        <div className="nav-container">
          <div className="logo-group">
            <button
              type="button"
              className="brand-logo brand-home-button"
              onClick={() => setShowAuth(false)}
              aria-label="Return to Tripora home"
            >
              <span className="brand-mark">✈</span> Tripora
            </button>
            <span className="brand-tag">Travel & Tours</span>
          </div>
          <nav className="nav-links">
            <a href="#about">About Us</a>
            <a href="#destinations" onClick={(e) => { if (authUser) { e.preventDefault(); setCurrentView('tours'); } }}>Destinations</a>
            <a href="#tours" onClick={(e) => { if (authUser) { e.preventDefault(); setCurrentView('tours'); } }}>Travel Packages</a>
            <a href="#offers">Offers</a>
            <a href="#support">Contact</a>
          </nav>
          <div className="nav-actions">
            {authUser ? (
              <div className="profile-menu">
                <button
                  type="button"
                  className="profile-menu-trigger"
                  onClick={() => setProfileMenuOpen((isOpen) => !isOpen)}
                  aria-label={`Open profile menu for ${authUser.fullName}`}
                  aria-expanded={profileMenuOpen}
                  aria-haspopup="menu"
                >
                  <span className="profile-icon" aria-hidden="true" />
                </button>
                {profileMenuOpen && (
                  <div className="profile-dropdown" role="menu">
                    <div className="profile-dropdown-heading">
                      <strong>{authUser.fullName}</strong>
                      <span>{authUser.role}</span>
                    </div>
                    <button type="button" className={`profile-menu-item ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => { setCurrentView('dashboard'); setProfileMenuOpen(false); }} role="menuitem">
                      Dashboard
                    </button>
                    <button type="button" className={`profile-menu-item ${currentView === 'profile' ? 'active' : ''}`} onClick={() => { setCurrentView('profile'); setProfileMenuOpen(false); }} role="menuitem">
                      Profile
                    </button>
                    <button type="button" className={`profile-menu-item ${currentView === 'tours' ? 'active' : ''}`} onClick={() => { setCurrentView('tours'); setProfileMenuOpen(false); }} role="menuitem">
                      Tours
                    </button>
                    {authUser?.role === 'Admin' && (
                      <button type="button" className={`profile-menu-item ${currentView === 'tour-management' ? 'active' : ''}`} onClick={() => { setCurrentView('tour-management'); setProfileMenuOpen(false); }} role="menuitem">
                        Manage Tours
                      </button>
                    )}
                    <button type="button" className="profile-menu-item sign-out" onClick={handleLogout} role="menuitem">
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button type="button" className="btn-book" onClick={() => { setActiveTab('login'); setShowAuth(true); }}>
                Book Now
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Session Expired Alert */}
        {sessionExpired && (
          <div className="alert-banner alert-danger" style={{ maxWidth: '600px', margin: '0 auto 20px auto' }} role="alert">
            <div className="alert-icon">!</div>
            <div className="alert-content">
              <strong>Session Expired</strong>
              <p>Your authentication session has expired. Please sign in again to continue accessing your account.</p>
            </div>
          </div>
        )}

        {!authUser && !showAuth ? (
          <section className="landing-hero" id="about">
            <div className="landing-copy">
              <span className="hero-pill">TRIPORA / CURATED TRAVEL</span>
              <h1 className="hero-headline">Unforgettable<br />Travel Moments<br /><em>with Tripora</em></h1>
            </div>
            <p className="hero-subhead">We take you beyond the ordinary, to places where cultures come alive, landscapes leave you breathless, and every moment becomes a story to tell.</p>
            <button type="button" className="scroll-cue" onClick={() => setShowAuth(true)} aria-label="Start planning your trip">↓</button>
          </section>
        ) : (
          <div className="hero-banner">
            <span className="hero-pill">TRIPORA / TRAVEL MANAGEMENT</span>
            <h1 className="hero-headline">{authUser ? 'Your Tripora Travel Portal' : 'Plan your next journey'}</h1>
            <p className="hero-subhead">{authUser ? 'Access your authenticated customer perks, manage bookings, and explore protected member-only itineraries.' : 'Sign in to your account or register to unlock exclusive travel packages and manage your journeys.'}</p>
          </div>
        )}

        {/* Dynamic Authenticated / Tab View */}
        {authUser && authToken ? (
          <>
            {currentView === 'dashboard' && (
              <CustomerDashboard 
                user={authUser} 
                onNavigate={setCurrentView}
              />
            )}
            {currentView === 'profile' && (
              <ProfileView 
                token={authToken}
                onSessionExpired={handleSessionExpired}
                onLogout={handleLogout}
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
        ) : showAuth ? (
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
        ) : null}

        {/* Trust Badges */}
        {(!authUser && showAuth || authUser) && <section className="trust-features">
          <div className="feature-item">
            <span className="feature-icon">01</span>
            <div className="feature-text">
              <h4>Bank-Grade JWT Security</h4>
              <p>Signed HMAC-SHA256 tokens and BCrypt hashed credentials protect your account.</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">02</span>
            <div className="feature-text">
              <h4>500+ Verified Stays</h4>
              <p>Instant booking confirmation for premier boutique hotels & resorts.</p>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon">03</span>
            <div className="feature-text">
              <h4>24/7 Travel Concierge</h4>
              <p>Dedicated holiday planners assist you before and during your travel.</p>
            </div>
          </div>
        </section>}
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>© 2026 Tripora Travel & Tour Booking System. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
