import { useState, useEffect } from 'react';
import './TourDisplay.css';

const API_TOURS_ENDPOINT = 'http://localhost:5025/api/tours';
const API_ACTIVE_TOURS_ENDPOINT = 'http://localhost:5025/api/tours/active';

export default function TourDisplay() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [selectedTour, setSelectedTour] = useState(null);

  useEffect(() => {
    fetchTours();
  }, [showActiveOnly]);

  const fetchTours = async () => {
    setLoading(true);
    setError(null);

    try {
      const endpoint = showActiveOnly ? API_ACTIVE_TOURS_ENDPOINT : API_TOURS_ENDPOINT;
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTours(data.data || []);
      } else {
        setError(data.message || 'Failed to retrieve tours.');
      }
    } catch (err) {
      console.error('Tour fetch error:', err);
      setError('Unable to connect to the tour service. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleTourClick = (tour) => {
    setSelectedTour(tour);
  };

  const handleCloseModal = () => {
    setSelectedTour(null);
  };

  if (loading) {
    return (
      <div className="tour-display-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading available tours...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tour-display-container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Tour Service Error</h3>
          <p>{error}</p>
          <button type="button" className="btn-retry" onClick={fetchTours}>
            ↻ Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tour-display-container">
      <div className="tour-header">
        <h2 className="tour-title">Explore Our Tours</h2>
        <p className="tour-subtitle">Discover extraordinary journeys and create unforgettable memories</p>
        
        <div className="tour-controls">
          <div className="toggle-switch">
            <button
              type="button"
              className={`toggle-btn ${showActiveOnly ? 'active' : ''}`}
              onClick={() => setShowActiveOnly(true)}
            >
              Active Tours
            </button>
            <button
              type="button"
              className={`toggle-btn ${!showActiveOnly ? 'active' : ''}`}
              onClick={() => setShowActiveOnly(false)}
            >
              All Tours
            </button>
          </div>
          <button type="button" className="btn-refresh" onClick={fetchTours}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {tours.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🌍</div>
          <h3>No Tours Available</h3>
          <p>
            {showActiveOnly 
              ? 'There are currently no active tours available.' 
              : 'No tours found in the system.'}
          </p>
        </div>
      ) : (
        <div className="tours-grid">
          {tours.map((tour) => (
            <div 
              key={tour.id} 
              className={`tour-card ${!tour.isActive ? 'tour-inactive' : ''}`}
              onClick={() => handleTourClick(tour)}
            >
              <div className="tour-image">
                {tour.imageUrl ? (
                  <img src={tour.imageUrl} alt={tour.name} />
                ) : (
                  <div className="tour-placeholder">
                    <span className="placeholder-icon">✈️</span>
                  </div>
                )}
                {!tour.isActive && (
                  <div className="tour-badge inactive">Inactive</div>
                )}
              </div>
              
              <div className="tour-content">
                <div className="tour-destination">{tour.destination}</div>
                <h3 className="tour-name">{tour.name}</h3>
                <p className="tour-description">{tour.description}</p>
                
                <div className="tour-details">
                  <div className="tour-detail">
                    <span className="detail-icon">⏱️</span>
                    <span>{tour.durationDays} days</span>
                  </div>
                  <div className="tour-detail">
                    <span className="detail-icon">👥</span>
                    <span>{tour.availableSlots} / {tour.capacity} spots</span>
                  </div>
                </div>
                
                <div className="tour-footer">
                  <div className="tour-price">${tour.price.toLocaleString()}</div>
                  <button 
                    type="button" 
                    className="btn-view-details"
                    disabled={!tour.isActive}
                  >
                    {tour.isActive ? 'View Details' : 'Not Available'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tour Detail Modal */}
      {selectedTour && (
        <div className="tour-modal-overlay" onClick={handleCloseModal}>
          <div className="tour-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={handleCloseModal}>
              ✕
            </button>
            
            <div className="modal-content">
              <div className="modal-header">
                <div className="modal-destination">{selectedTour.destination}</div>
                <h2 className="modal-title">{selectedTour.name}</h2>
                {!selectedTour.isActive && (
                  <div className="modal-badge inactive">Inactive Tour</div>
                )}
              </div>
              
              {selectedTour.imageUrl && (
                <div className="modal-image">
                  <img src={selectedTour.imageUrl} alt={selectedTour.name} />
                </div>
              )}
              
              <div className="modal-body">
                <div className="modal-description">
                  <h4>About This Tour</h4>
                  <p>{selectedTour.description}</p>
                </div>
                
                <div className="modal-specs">
                  <div className="spec-item">
                    <span className="spec-icon">⏱️</span>
                    <div className="spec-info">
                      <span className="spec-label">Duration</span>
                      <span className="spec-value">{selectedTour.durationDays} days</span>
                    </div>
                  </div>
                  
                  <div className="spec-item">
                    <span className="spec-icon">👥</span>
                    <div className="spec-info">
                      <span className="spec-label">Capacity</span>
                      <span className="spec-value">{selectedTour.capacity} people</span>
                    </div>
                  </div>
                  
                  <div className="spec-item">
                    <span className="spec-icon">🎫</span>
                    <div className="spec-info">
                      <span className="spec-label">Available Spots</span>
                      <span className="spec-value">{selectedTour.availableSlots} remaining</span>
                    </div>
                  </div>
                  
                  <div className="spec-item">
                    <span className="spec-icon">💰</span>
                    <div className="spec-info">
                      <span className="spec-label">Price</span>
                      <span className="spec-value">${selectedTour.price.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer">
                  <div className="tour-id">Tour ID: {selectedTour.id}</div>
                  <div className="tour-dates">
                    <span>Created: {new Date(selectedTour.createdAt).toLocaleDateString()}</span>
                    {selectedTour.updatedAt && (
                      <span>Updated: {new Date(selectedTour.updatedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}