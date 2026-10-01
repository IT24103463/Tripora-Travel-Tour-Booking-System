import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AdminLanding.css';

export default function AdminLanding() {
  const [currentTime, setCurrentTime] = useState('');
  const navigate = useNavigate();

  const openDashboardModule = (activeModule) => {
    navigate('/admin/dashboard', { state: { activeModule } });
  };

  const handleMetricKeyDown = (event, activeModule) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openDashboardModule(activeModule);
    }
  };
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

        <div className="admin-stats-grid">
          <div className="stat-card" role="button" tabIndex={0} aria-label="CONFIRMED EXPEDITIONS" onClick={() => openDashboardModule('bookings')} onKeyDown={(event) => handleMetricKeyDown(event, 'bookings')}>
            <div className="stat-card-header"><span className="stat-label">Confirmed Expeditions</span><span className="stat-icon-wrapper teal" aria-hidden="true"><svg className="stat-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></span></div>
            <div className="stat-value-row"><span className="stat-number">6</span></div>
            <div className="stat-footer"><span className="status-badge teal"><span className="status-dot" aria-hidden="true" />Active records</span></div>
          </div>
          <div className="stat-card" role="button" tabIndex={0} aria-label="ACTIVE OFFERS" onClick={() => openDashboardModule('offers')} onKeyDown={(event) => handleMetricKeyDown(event, 'offers')}>
            <div className="stat-card-header"><span className="stat-label">Active Offers</span><span className="stat-icon-wrapper amber" aria-hidden="true"><svg className="stat-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg></span></div>
            <div className="stat-value-row"><span className="stat-number">5</span><span className="stat-unit amber">Active</span></div>
            <div className="stat-footer"><span className="status-badge amber"><span className="status-dot" aria-hidden="true" />Live in DB</span></div>
          </div>
          <div className="stat-card" role="button" tabIndex={0} aria-label="CONCIERGE INQUIRIES" onClick={() => openDashboardModule('inquiries')} onKeyDown={(event) => handleMetricKeyDown(event, 'inquiries')}>
            <div className="stat-card-header"><span className="stat-label">Concierge Inquiries</span><span className="stat-icon-wrapper sky" aria-hidden="true"><svg className="stat-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg></span></div>
            <div className="stat-value-row"><span className="stat-number">1</span><span className="stat-unit sky">Open</span></div>
            <div className="stat-footer"><span className="status-badge sky"><span className="status-dot" aria-hidden="true" />IMAP Queue</span></div>
          </div>
        </div>
      </main>

      <footer className="admin-gateway-footer">
        <div className="admin-footer-security">
          <span>🔒 Authorized staff session only. All actions are logged.</span>
        </div>
      </footer>

      <div className="admin-docked-corner-cta">
        <Link className="admin-dashboard-launch-btn" to="/admin/dashboard">
          <div className="btn-text-group">
            <span className="btn-subtext">ENTER SYSTEM</span>
            <span className="btn-maintext">Go to Dashboard</span>
          </div>
          <div className="btn-arrow-circle" aria-hidden="true"><span>→</span></div>
        </Link>
      </div>
    </div>
  );
}
