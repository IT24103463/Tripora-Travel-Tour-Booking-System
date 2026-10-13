import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './AdminLanding.css';

export default function AdminLanding() {
  const [currentTime, setCurrentTime] = useState('');
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }));
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="admin-gateway-viewport">
      <div className="admin-background-container">
        <img
          src="/images/admin-bg.jpg"
          alt="Tripora Admin Landscape"
          className="admin-background-img"
        />
        <div className="admin-background-scrim" aria-hidden="true" />
      </div>
      <div className="admin-grid-overlay" aria-hidden="true" />

      <header className="admin-gateway-header">
        <div className="admin-brand-group">
          <span className="admin-logo-mark brand-icon-circle" aria-hidden="true">
            <svg className="brand-plane-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z" />
            </svg>
          </span>
          <span className="brand-text-group admin-brand-text-group">
            <span className="brand-main-name">Tripora</span>
            <span className="brand-sub-name">Travel &amp; Tours</span>
          </span>
          <span className="admin-badge-terminal">MANAGEMENT CONSOLE</span>
        </div>

        <div className="admin-system-status" aria-label={`Services operational. Current time ${currentTime}`}>
          <span className="status-ping" aria-hidden="true" />
          <span className="status-label">SERVICES OPERATIONAL</span>
          <span className="status-divider" aria-hidden="true">|</span>
          <time className="console-time">{currentTime}</time>
        </div>
      </header>

      <main className="admin-gateway-center">
        <div className="admin-eyebrow-chip">
          <span>RESTRICTED ACCESS · CONCIERGE DESK</span>
        </div>

        <h1 className="admin-hero-title">Sanctuary Management &amp; Operations</h1>

        <p className="admin-hero-subtitle">
          Internal administrative portal for managing luxury tours, verified member reservations,
          guest inquiries, and promotional inventory.
        </p>
        <div className="admin-hero-cta">
          <Link className="admin-dashboard-launch-btn" to="/admin/dashboard">
            <div className="btn-text-group">
              <span className="btn-subtext">ENTER SYSTEM</span>
              <span className="btn-maintext">Go to Dashboard</span>
            </div>
            <div className="btn-arrow-circle" aria-hidden="true"><span>→</span></div>
          </Link>
        </div>
      </main>

      <footer className="admin-gateway-footer">
        <div className="admin-footer-security">
          <span>🔒 Authorized staff session only. All actions are logged.</span>
        </div>
      </footer>
    </div>
  );
}
