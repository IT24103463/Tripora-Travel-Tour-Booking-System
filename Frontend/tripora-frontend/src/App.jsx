import RegisterForm from './components/RegisterForm';
import './App.css';

function App() {
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
            <a href="#destinations">Destinations</a>
            <a href="#tours">Tour Packages</a>
            <a href="#hotels">Hotels</a>
            <a href="#support">Support</a>
          </nav>
          <div className="nav-actions">
            <a href="#signin" className="btn-nav-signin">Sign In</a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="hero-banner">
          <span className="hero-pill">✨ Travel Beyond Boundaries</span>
          <h1 className="hero-headline">Discover Extraordinary Journeys with Tripora</h1>
          <p className="hero-subhead">
            Create your customer account to access handcrafted tours, curated luxury stays, 
            and seamless holiday booking across 120+ worldwide destinations.
          </p>
        </div>

        {/* The 5-Part Registration Card */}
        <RegisterForm />

        {/* Trust Badges */}
        <section className="trust-features">
          <div className="feature-item">
            <span className="feature-icon">🔒</span>
            <div className="feature-text">
              <h4>Bank-Grade Encryption</h4>
              <p>Your password and credentials are encrypted using cryptographic salting.</p>
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
