import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import RegisterForm from './components/RegisterForm';
import LoginForm from './components/LoginForm';
import CustomerHome from './pages/CustomerHome';
import BookingHistory from './pages/BookingHistory';
import ErrorBoundary from './components/ErrorBoundary';
import ProfileView from './components/ProfileView';
import TourDisplay from './components/TourDisplay';
import DestinationManagement from './components/DestinationManagement';
import PaymentPage from './pages/PaymentPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLanding from './pages/AdminLanding';
import AboutUs from './pages/AboutUs';
import Contact from './pages/Contact';
import TravelPackages from './pages/TravelPackages';
import Offers from './pages/Offers';
import EmailVerificationModal from './components/EmailVerificationModal';
import './App.css';

const protectedViews = {
  '/destinations': 'tours',
  '/dashboard': 'dashboard',
  '/bookings': 'booking-history',
  '/profile': 'profile',
  '/admin': 'admin',
};

const getProtectedView = (pathname) => protectedViews[pathname.replace(/\/$/, '')] || null;

const sanitizeRedirectDestination = (candidate) => {
  const rawDestination = typeof candidate === 'string'
    ? candidate
    : candidate && typeof candidate.pathname === 'string'
      ? `${candidate.pathname}${candidate.search || ''}${candidate.hash || ''}`
      : '';

  if (!rawDestination.startsWith('/') || rawDestination.startsWith('//') || rawDestination.includes('\\')) return null;

  try {
    const destination = new URL(rawDestination, window.location.origin);
    if (destination.origin !== window.location.origin || ['/login', '/register'].includes(destination.pathname.replace(/\/$/, ''))) return null;
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return null;
  }
};

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

export const isAdminUser = (user) => String(user?.role || '').toLowerCase() === 'admin';

export const getLoginDestination = (user) => {
  if (isAdminUser(user)) return '/admin';
  return '/';
};

function ProtectedRoute({ isAuthenticated, allowUnauthenticated = false, children }) {
  const location = useLocation();

  if (isAuthenticated || allowUnauthenticated) return children;

  return <Navigate to="/login" replace state={{ from: location }} />;
}

function PageTransition({ transitionKey, className = 'page-transition-container', children }) {
  return (
    <>
      <div className={className} key={`page-${transitionKey}`}>{children}</div>
      <div className="page-mist-veil" key={`mist-${transitionKey}`} aria-hidden="true" />
    </>
  );
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();
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

  const [activeTab, setActiveTab] = useState(() => location.pathname === '/register' ? 'register' : 'login'); // 'login' | 'register'
  const [showAuth, setShowAuth] = useState(() => ['/login', '/register'].includes(location.pathname) || Boolean(getProtectedView(location.pathname)));
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'profile' | 'tours' | 'destination-management'
  const [sessionExpired, setSessionExpired] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState(null);
  const [verificationOptions, setVerificationOptions] = useState({ resetLogin: false, initialResendAfter: 0, autoResend: false });
  const [loginFormVersion, setLoginFormVersion] = useState(0);

  const handleProtectedNavigation = (targetView, path) => {
    if (!authUser || !authToken) {
      const destination = path || targetView;
      sessionStorage.setItem('redirectAfterLogin', destination);
      setActiveTab('login');
      setShowAuth(true);
      navigate('/login', { state: { from: destination } });
      return;
    }
    if (path) navigate(path);
    else setCurrentView(targetView);
  };

  const handleBrandHomeNavigation = () => {
    setProfileMenuOpen(false);
    setCurrentView('dashboard');
    setShowAuth(false);
    sessionStorage.removeItem('redirectAfterLogin');
    navigate(authUser && authToken && isAdminUser(authUser) ? '/admin' : '/', { replace: true });
  };

  const handleLoginSuccess = (token, user) => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    setAuthToken(token);
    setAuthUser(user);
    setCurrentView('dashboard');
    setShowAuth(false);
    localStorage.setItem('tripora_token', token);
    localStorage.setItem('tripora_user', JSON.stringify(user));
    setSessionExpired(false);
    const requestedPath = sanitizeRedirectDestination(sessionStorage.getItem('redirectAfterLogin'))
      || sanitizeRedirectDestination(location.state?.from);
    sessionStorage.removeItem('redirectAfterLogin');
    const destination = getLoginDestination(user, requestedPath);
    navigate(destination, { replace: true });
  };

  const handleLogout = () => {
    setAuthToken(null);
    setAuthUser(null);
    setCurrentView('dashboard');
    localStorage.removeItem('tripora_token');
    localStorage.removeItem('tripora_user');
    setActiveTab('login');
    setSessionExpired(false);
    setProfileMenuOpen(false);
    navigate('/', { replace: true });
  };

  const handleVerificationRequired = (email, options = {}) => {
    setVerificationEmail(email);
    setVerificationOptions({
      resetLogin: Boolean(options.resetLogin),
      initialResendAfter: Number(options.initialResendAfter) || 0,
      autoResend: Boolean(options.autoResend),
    });
    setActiveTab('login');
    setShowAuth(true);
  };

  const handleCloseVerification = () => {
    setVerificationEmail(null);
    if (verificationOptions.resetLogin) setLoginFormVersion((version) => version + 1);
    setVerificationOptions({ resetLogin: false, initialResendAfter: 0, autoResend: false });
    setActiveTab('login');
    setShowAuth(true);
  };

  const handleEmailVerified = (session) => {
    handleCloseVerification();
    handleLoginSuccess(session.token, session.user);
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

  useEffect(() => {
    if (['/about', '/contact', '/packages', '/offers'].includes(location.pathname)) {
      setShowAuth(false);
      setProfileMenuOpen(false);
      return;
    }
    if (location.pathname === '/' && authUser && authToken && !isAdminUser(authUser)) {
      setCurrentView('dashboard');
      setShowAuth(false);
      return;
    }
    const targetView = getProtectedView(location.pathname);
    if (!targetView) return;
    if (!authUser || !authToken) {
      sessionStorage.setItem('redirectAfterLogin', location.pathname);
      setActiveTab('login');
      setShowAuth(true);
      navigate('/login', { replace: true, state: { from: location.pathname } });
      return;
    }
    setCurrentView(targetView);
    setShowAuth(false);
  }, [location.pathname, authUser, authToken, navigate]);

  useEffect(() => {
    if (['/login', '/register'].includes(location.pathname) && (!authUser || !authToken)) {
      setActiveTab(location.pathname === '/register' ? 'register' : 'login');
      setShowAuth(true);
    }
  }, [location.pathname, authUser, authToken]);

  const isAboutPage = location.pathname === '/about';
  const isContactPage = location.pathname === '/contact';
  const isDestinationsPage = location.pathname === '/destinations';
  const isTravelPackagesPage = location.pathname === '/packages';
  const isOffersPage = location.pathname === '/offers';
  const isPublicInfoPage = isAboutPage || isContactPage || isTravelPackagesPage || isOffersPage;
  const isAuthenticated = Boolean(authUser && authToken);
  const isPublicRoute = ['/', '/login', '/register'].includes(location.pathname);
  const isCustomerHome = Boolean(!isPublicInfoPage && authUser && authToken && !isAdminUser(authUser) && ['dashboard', 'booking-history'].includes(currentView));
  const transitionKey = `${location.pathname}:${currentView}:${activeTab}`;
  const transitionClassName = location.pathname === '/'
    ? 'page-transition-container landing-page-entrance'
    : currentView === 'tours'
      ? 'page-transition-container destinations-transition-wrapper'
      : 'page-transition-container';

  useEffect(() => {
    document.body.classList.toggle('tripora-customer-canvas', isCustomerHome);
    return () => document.body.classList.remove('tripora-customer-canvas');
  }, [isCustomerHome]);

  return (
    <Routes>
      <Route path="/payment/:bookingId" element={<ProtectedRoute isAuthenticated={isAuthenticated}><PageTransition transitionKey={location.pathname}><PaymentPage /></PageTransition></ProtectedRoute>} />
      <Route path="/admin" element={isAdminUser(authUser) && authToken ? <PageTransition transitionKey={transitionKey} className={transitionClassName}><AdminLanding /></PageTransition> : authUser && authToken ? <Navigate to="/" replace /> : <Navigate to="/login" replace state={{ from: '/admin' }} />} />
      <Route path="/admin/dashboard" element={isAdminUser(authUser) && authToken ? <PageTransition transitionKey={transitionKey} className={transitionClassName}><AdminDashboard onLogout={handleLogout} user={authUser} /></PageTransition> : authUser && authToken ? <Navigate to="/" replace /> : <Navigate to="/login" replace state={{ from: '/admin/dashboard' }} />} />
      <Route
        path="*"
        element={
          isAdminUser(authUser) && authToken && !isTravelPackagesPage && !isOffersPage ? <Navigate to="/admin" replace /> :
          <ProtectedRoute isAuthenticated={isAuthenticated} allowUnauthenticated={isPublicRoute}>
          <PageTransition transitionKey={transitionKey} className={transitionClassName}>
          <div className={`app-layout ${!authUser && !showAuth ? 'landing-mode' : ''} ${!authUser && showAuth ? 'auth-mode' : ''} ${authUser ? 'authenticated-mode' : ''} ${isCustomerHome ? 'customer-member-mode' : ''} ${isAboutPage ? 'public-about-mode' : ''} ${isContactPage ? 'public-contact-mode' : ''} ${isDestinationsPage ? 'public-destinations-mode' : ''} ${isTravelPackagesPage ? 'public-packages-mode' : ''} ${isOffersPage ? 'public-offers-mode' : ''}`}>
      {/* Navigation Header */}
      <header className="navbar">
        <div className="nav-container">
            <div className="logo-group">
              <Link
                className="tripora-brand-lockup"
                onClick={handleBrandHomeNavigation}
                to="/"
                aria-label="Return to Tripora home"
              >
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
            </div>
          <nav className="nav-links">
            <NavLink to="/destinations" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={(event) => { event.preventDefault(); handleProtectedNavigation('tours', '/destinations'); }}>Destinations</NavLink>
            <NavLink to="/packages" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={(event) => { event.preventDefault(); handleProtectedNavigation('packages', '/packages'); setProfileMenuOpen(false); }}>Travel Packages</NavLink>
            <NavLink to="/offers" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={(event) => { event.preventDefault(); handleProtectedNavigation('offers', '/offers'); setProfileMenuOpen(false); }}>Offers</NavLink>
            <NavLink to="/contact" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={(event) => { event.preventDefault(); handleProtectedNavigation('contact', '/contact'); setProfileMenuOpen(false); }}>Contact</NavLink>
            <NavLink to="/about" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={(event) => { event.preventDefault(); handleProtectedNavigation('about', '/about'); setProfileMenuOpen(false); }}>About Us</NavLink>
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
                    <div className="dropdown-menu-items">
                    {!isAdminUser(authUser) && <>
                    <button type="button" className={`profile-menu-item ${location.pathname === '/profile' ? 'active' : ''}`} onClick={() => { handleProtectedNavigation('profile', '/profile'); setProfileMenuOpen(false); }} role="menuitem">
                      Profile
                    </button>
                    <button type="button" className={`profile-menu-item ${location.pathname === '/bookings' ? 'active' : ''}`} onClick={() => { handleProtectedNavigation('dashboard', '/bookings'); setProfileMenuOpen(false); }} role="menuitem" aria-label="Booking History">
                      History
                    </button>

                    {isAdminUser(authUser) && (
                      <button type="button" className={`profile-menu-item ${currentView === 'destination-management' ? 'active' : ''}`} onClick={() => { setCurrentView('destination-management'); setProfileMenuOpen(false); }} role="menuitem">
                        Manage Destinations
                      </button>
                    )}
                    </>}
                    <button type="button" className="profile-menu-item sign-out" onClick={handleLogout} role="menuitem">
                      Sign Out
                    </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button type="button" className="btn-book" onClick={() => handleProtectedNavigation('dashboard', '/dashboard')}>
                Book Now
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <ErrorBoundary>
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

        {!isPublicInfoPage && !isCustomerHome && !isDestinationsPage && (!authUser && !showAuth ? (          <section className="landing-hero" id="about">
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
        ))}

        {/* Dynamic Authenticated / Tab View */}
        {isAboutPage ? <AboutUs /> : isContactPage ? <Contact /> : isTravelPackagesPage ? <TravelPackages /> : isOffersPage ? <Offers /> : authUser && authToken ? (
          <>
            {currentView === 'dashboard' && (
              <CustomerHome
                user={authUser} 
                onNavigate={(view) => view === 'tours'
                  ? handleProtectedNavigation('tours', '/destinations')
                  : setCurrentView(view)}
              />
            )}
            {currentView === 'booking-history' && <BookingHistory token={authToken} />}
            {currentView === 'profile' && (
              <ProfileView 
                token={authToken}
                onSessionExpired={handleSessionExpired}
                onLogout={handleLogout}
              />
            )}
            {currentView === 'tours' && (
              <TourDisplay token={authToken} user={authUser} onRequireAuth={() => { setShowAuth(true); setActiveTab("login"); }} />
            )}
            {currentView === 'destination-management' && (
              <DestinationManagement 
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
                key={loginFormVersion}
                onLoginSuccess={handleLoginSuccess}
                onSwitchToRegister={() => setActiveTab('register')}
                onVerificationRequired={handleVerificationRequired}
              />
            ) : (
              <RegisterForm 
                onSwitchToLogin={() => setActiveTab('login')}
                onVerificationRequired={handleVerificationRequired}
              />
            )}
          </div>
        ) : null}

        {/* Trust Badges */}
        {(!isPublicInfoPage && !isCustomerHome && !isDestinationsPage && (!authUser && showAuth || authUser)) && <section className="trust-features">
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
      {verificationEmail && (
        <EmailVerificationModal
          email={verificationEmail}
          initialResendAfter={verificationOptions.initialResendAfter}
          autoResend={verificationOptions.autoResend}
          onClose={handleCloseVerification}
          onVerified={handleEmailVerified}
        />
      )}
      </ErrorBoundary>

      {/* Footer */}
      <footer className="footer">
        <p>© 2026 Tripora Travel & Tour Booking System. All rights reserved.</p>
      </footer>
    </div>
          </PageTransition>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;






