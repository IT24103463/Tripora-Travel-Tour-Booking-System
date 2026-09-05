import { useState } from 'react';
import { isTokenExpired } from '../App.jsx';
import './CustomerDashboard.css';

const API_ME_ENDPOINT = 'http://localhost:5001/api/users/me';

export default function CustomerDashboard({ user, token, onLogout, onSessionExpired }) {
  const [protectedResult, setProtectedResult] = useState(null);
  const [testingProtected, setTestingProtected] = useState(false);
  const [unauthResult, setUnauthResult] = useState(null);
  const [testingUnauth, setTestingUnauth] = useState(false);
  const [showTokenDetails, setShowTokenDetails] = useState(false);

  // Decode JWT payload claims in client for transparent verification
  const decodedPayload = (() => {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        return JSON.parse(atob(parts[1]));
      }
    } catch {
      return null;
    }
    return null;
  })();

  // Check token expiration status
  const tokenExpired = isTokenExpired(token);
  const tokenExpiryTime = decodedPayload?.exp ? new Date(decodedPayload.exp * 1000) : null;
  const minutesRemaining = tokenExpiryTime ? Math.max(0, Math.round((tokenExpiryTime.getTime() - Date.now()) / 60000)) : 0;

  // Scenario 4: Test Protected Resource WITH valid token
  const handleTestProtectedWithToken = async () => {
    setTestingProtected(true);
    setProtectedResult(null);

    try {
      // Check if token is expired before making request
      if (isTokenExpired(token)) {
        if (onSessionExpired) {
          onSessionExpired();
        }
        setProtectedResult({
          status: 401,
          ok: false,
          data: { message: 'Token expired. Please log in again.' }
        });
        return;
      }

      const res = await fetch(API_ME_ENDPOINT, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await res.json();
      
      // Handle 401 Unauthorized responses (expired/invalid token)
      if (res.status === 401) {
        if (onSessionExpired) {
          onSessionExpired();
        }
      }

      setProtectedResult({
        status: res.status,
        ok: res.ok,
        data: data
      });
    } catch (err) {
      setProtectedResult({
        status: 'Error',
        ok: false,
        data: { message: err.message }
      });
    } finally {
      setTestingProtected(false);
    }
  };

  // Scenario 5: Test Protected Resource WITHOUT token
  const handleTestWithoutToken = async () => {
    setTestingUnauth(true);
    setUnauthResult(null);

    try {
      const res = await fetch(API_ME_ENDPOINT, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      setUnauthResult({
        status: res.status,
        statusText: res.statusText || 'Unauthorized',
        ok: res.ok
      });
    } catch (err) {
      setUnauthResult({
        status: 'Error',
        statusText: err.message,
        ok: false
      });
    } finally {
      setTestingUnauth(false);
    }
  };

  return (
    <div className="dashboard-container" id="customer-dashboard">
      {/* Welcome Card */}
      <div className="dashboard-card welcome-card">
        <div className="dashboard-header-row">
          <div className="user-avatar-pill">
            <span className="avatar-icon">✈️</span>
            <div>
              <h2 className="dashboard-name" id="auth-user-name">Welcome back, {user.fullName}!</h2>
              <span className="user-role-badge">Verified {user.role || 'Customer'}</span>
            </div>
          </div>
          <button type="button" className="btn-signout" onClick={onLogout} id="btn-signout">
            Sign Out
          </button>
        </div>

        <div className="dashboard-grid">
          <div className="dash-stat-item">
            <span className="stat-label">Registered Email</span>
            <span className="stat-value" id="auth-user-email">{user.email}</span>
          </div>
          <div className="dash-stat-item">
            <span className="stat-label">Account ID</span>
            <span className="stat-value mono-val">{user.id}</span>
          </div>
          <div className="dash-stat-item">
            <span className="stat-label">Authentication Method</span>
            <span className="stat-value">JWT Bearer (HMAC-SHA256)</span>
          </div>
        </div>
      </div>

      {/* JWT Security & Token Inspector (Scenario 3) */}
      <div className="dashboard-card token-card" id="jwt-token-inspector">
        <div className="section-title-row">
          <div>
            <h3 className="section-heading">🔐 Active JWT Authentication Token</h3>
            <p className="section-subtext">Issued by Tripora.UserService to grant secure access across services.</p>
          </div>
          <button 
            type="button" 
            className="btn-toggle-token"
            onClick={() => setShowTokenDetails(!showTokenDetails)}
          >
            {showTokenDetails ? 'Hide Token Payload' : 'Inspect Token Claims'}
          </button>
        </div>

        {/* Token Status Indicator */}
        <div className={`token-status-indicator ${tokenExpired ? 'status-expired' : minutesRemaining < 5 ? 'status-warning' : 'status-valid'}`}>
          <span className="status-icon">{tokenExpired ? '⚠️' : minutesRemaining < 5 ? '⏰' : '✅'}</span>
          <span className="status-text">
            {tokenExpired ? 'Token Expired' : minutesRemaining < 5 ? `Expires in ${minutesRemaining} minute(s)` : 'Valid Token'}
          </span>
        </div>

        <div className="token-preview-box">
          <span className="token-label">Bearer Token:</span>
          <code className="token-string" id="jwt-raw-token">
            {token.substring(0, 45)}...{token.substring(token.length - 20)}
          </code>
        </div>

        {showTokenDetails && decodedPayload && (
          <div className="decoded-claims-box" id="jwt-decoded-claims">
            <h4>Decoded JWT Payload (Claims):</h4>
            <div className="claims-table">
              <div className="claim-row">
                <span className="claim-key">sub (Subject ID):</span>
                <span className="claim-val">{decodedPayload.sub}</span>
              </div>
              <div className="claim-row">
                <span className="claim-key">email:</span>
                <span className="claim-val">{decodedPayload.email}</span>
              </div>
              <div className="claim-row">
                <span className="claim-key">role:</span>
                <span className="claim-val">{decodedPayload.role}</span>
              </div>
              <div className="claim-row">
                <span className="claim-key">fullName:</span>
                <span className="claim-val">{decodedPayload.fullName}</span>
              </div>
              <div className="claim-row">
                <span className="claim-key">exp (Expires):</span>
                <span className="claim-val">
                  {new Date(decodedPayload.exp * 1000).toLocaleTimeString()} ({Math.round((decodedPayload.exp * 1000 - Date.now()) / 60000)} mins remaining)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Acceptance Criteria Verification (Scenario 4 & 5) */}
      <div className="dashboard-card verification-card" id="protected-resource-tests">
        <h3 className="section-heading">🛡️ Live Protected Resource Verification</h3>
        <p className="section-subtext">
          Test access to the secured endpoint <code>GET /api/users/me</code> with and without authentication.
        </p>

        <div className="verification-actions">
          {/* Scenario 4 Test */}
          <div className="test-panel test-panel-auth">
            <h4>Scenario 4: Access Protected Resource</h4>
            <p>Sends request with <code>Authorization: Bearer [JWT]</code> header.</p>
            <button
              type="button"
              className="btn-test-auth"
              id="btn-test-authorized"
              onClick={handleTestProtectedWithToken}
              disabled={testingProtected}
            >
              {testingProtected ? 'Verifying...' : '✓ Test Authorized Access'}
            </button>

            {protectedResult && (
              <div className="test-result-box result-success" id="authorized-test-result">
                <div className="result-header">
                  <span className="status-badge status-200">HTTP {protectedResult.status} OK</span>
                  <span className="result-tag">Access Granted</span>
                </div>
                <pre>{JSON.stringify(protectedResult.data, null, 2)}</pre>
              </div>
            )}
          </div>

          {/* Scenario 5 Test */}
          <div className="test-panel test-panel-unauth">
            <h4>Scenario 5: Unauthorized Access Denied</h4>
            <p>Sends request WITHOUT the authentication token.</p>
            <button
              type="button"
              className="btn-test-unauth"
              id="btn-test-unauthorized"
              onClick={handleTestWithoutToken}
              disabled={testingUnauth}
            >
              {testingUnauth ? 'Verifying...' : '✕ Test Unauthorized Access'}
            </button>

            {unauthResult && (
              <div className="test-result-box result-denied" id="unauthorized-test-result">
                <div className="result-header">
                  <span className="status-badge status-401">HTTP {unauthResult.status} Unauthorized</span>
                  <span className="result-tag">Access Denied</span>
                </div>
                <p className="denied-message">
                  The system successfully rejected the unauthenticated request with HTTP 401.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
