import './CustomerDashboard.css';
import { Compass, User } from 'lucide-react';

export default function CustomerDashboard({ user, onNavigate }) {

  return (
    <div className="dashboard-container" id="customer-dashboard">
      {/* Welcome Card */}
      <div className="dashboard-card welcome-card">
        <div className="dashboard-header-row">
          <div className="user-avatar-pill">
            <span className="brand-mark dashboard-plane">✈</span>
            <div>
              <h2 className="dashboard-name" id="auth-user-name">Welcome back, {user.fullName}!</h2>
              <span className="user-role-badge">Verified {user.role || 'Customer'}</span>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dash-stat-item">
            <span className="stat-label">Email Address</span>
            <span className="stat-value" id="auth-user-email">{user.email}</span>
          </div>
          <div className="dash-stat-item">
            <span className="stat-label">Membership</span>
            <span className="stat-value">Tripora Member</span>
          </div>
          <div className="dash-stat-item">
            <span className="stat-label">Account Type</span>
            <span className="stat-value">{user.role || 'Customer'}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-card dashboard-actions-card">
        <div className="section-title-row">
          <div>
            <h3 className="section-heading">Plan your next escape</h3>
            <p className="section-subtext">Everything you need for a smoother Tripora journey.</p>
          </div>
        </div>
        <div className="dashboard-action-grid">
          <button type="button" className="dashboard-action" onClick={() => onNavigate('tours')}>
            <Compass className="dashboard-action-icon" size={24} />
            <span><strong>Explore tours</strong><small>Find your next destination</small></span>
          </button>
          <button type="button" className="dashboard-action" onClick={() => onNavigate('profile')}>
            <User className="dashboard-action-icon" size={24} />
            <span><strong>View your profile</strong><small>Review your account details</small></span>
          </button>
        </div>
      </div>
    </div>
  );
}
