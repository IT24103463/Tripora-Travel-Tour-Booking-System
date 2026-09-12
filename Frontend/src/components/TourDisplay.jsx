import { useState, useEffect } from 'react';
import './TourDisplay.css';

const API_TOURS_ENDPOINT = 'http://localhost:5120/api/tours';
const API_ACTIVE_TOURS_ENDPOINT = 'http://localhost:5120/api/tours/active';
const API_HOTELS_ENDPOINT = 'http://localhost:5120/api/hotels';

export default function TourDisplay() {
  const [activeTab, setActiveTab] = useState('tours'); // 'tours' | 'hotels'
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [tours, setTours] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    if (activeTab === 'tours') {
      fetchTours();
    } else {
      fetchHotels();
    }
  }, [activeTab, showActiveOnly]);

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
      console.error(err);
      console.error('Tour fetch error:', err);
      setError('Unable to connect to the tour service. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchHotels = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(API_HOTELS_ENDPOINT, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        setHotels(data || []);
      } else {
        setError('Failed to retrieve hotels.');
      }
    } catch (err) {
      console.error('Hotel fetch error:', err);
      setError('Unable to connect to the hotel service. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (item) => {
    setSelectedItem(item);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
  };

  if (loading) {
    return (
      <div className="tour-display-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading available {activeTab}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tour-display-container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Service Error</h3>
          <p>{error}</p>
          <button type="button" className="btn-retry" onClick={activeTab === 'tours' ? fetchTours : fetchHotels}>
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tour-display-container">
      <div className="tour-header">
        <h2 className="tour-title">Explore Our Destinations</h2>
        <p className="tour-subtitle">Discover extraordinary journeys and luxurious stays</p>
        
        <div className="tour-controls">
          <div className="toggle-switch">
            <button
              type="button"
              className={"toggle-btn " + (activeTab === 'tours' ? 'active' : '')}
              onClick={() => { setActiveTab('tours'); setSelectedItem(null); }}
            >
              Tours
            </button>
            <button
              type="button"
              className={"toggle-btn " + (activeTab === 'hotels' ? 'active' : '')}
              onClick={() => { setActiveTab('hotels'); setSelectedItem(null); }}
            >
              Hotels
            </button>
          </div>

          {activeTab === 'tours' && (
            <div className="toggle-switch">
              <button
                type="button"
                className={"toggle-btn " + (showActiveOnly ? 'active' : '')}
                onClick={() => setShowActiveOnly(true)}
              >
                Active
              </button>
              <button
                type="button"
                className={"toggle-btn " + (!showActiveOnly ? 'active' : '')}
                onClick={() => setShowActiveOnly(false)}
              >
                All
              </button>
            </div>
          )}

          <button type="button" className="btn-refresh" onClick={activeTab === 'tours' ? fetchTours : fetchHotels}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {activeTab === 'tours' ? (
        tours.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏜️</div>
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
                className={"tour-card " + (!tour.isActive ? 'tour-inactive' : '')}
                onClick={() => handleItemClick(tour)}
              >
                <div className="tour-image">
                  {tour.imageUrl ? (
                    <img src={tour.imageUrl} alt={tour.name} />
                  ) : (
                    <div className="tour-placeholder">
                      <span className="placeholder-icon">🧳</span>
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
                    <div className="tour-price"></div>
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
        )
      ) : (
        hotels.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏢</div>
            <h3>No Hotels Available</h3>
            <p>There are currently no hotels found in the system.</p>
          </div>
        ) : (
          <div className="tours-grid">
            {hotels.map((hotel) => (
              <div 
                key={hotel.id} 
                className={"tour-card " + (!hotel.isActive ? 'tour-inactive' : '')}
                onClick={() => handleItemClick(hotel)}
              >
                <div className="tour-image">
                  {hotel.imageUrl ? (
                    <img src={hotel.imageUrl} alt={hotel.name} />
                  ) : (
                    <div className="tour-placeholder">
                      <span className="placeholder-icon">🏨</span>
                    </div>
                  )}
                  {!hotel.isActive && (
                    <div className="tour-badge inactive">Inactive</div>
                  )}
                </div>
                
                <div className="tour-content">
                  <div className="tour-destination">{hotel.location}</div>
                  <h3 className="tour-name">{hotel.name}</h3>
                  <p className="tour-description">{hotel.description}</p>
                  
                  <div className="tour-details">
                    <div className="tour-detail">
                      <span className="detail-icon">🛏️</span>
                      <span>{hotel.availableRooms} rooms</span>
                    </div>
                    <div className="tour-detail">
                      <span className="detail-icon">⭐</span>
                      <span>4.5 Rating</span>
                    </div>
                  </div>
                  
                  <div className="tour-footer">
                    <div className="tour-price"> / night</div>
                    <button 
                      type="button" 
                      className="btn-view-details"
                      disabled={!hotel.isActive}
                    >
                      {hotel.isActive ? 'View Details' : 'Not Available'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {selectedItem && (
        <div className="tour-modal-overlay" onClick={handleCloseModal}>
          <div className="tour-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={handleCloseModal}>
              ✕
            </button>
            
            <div className="modal-content">
              <div className="modal-header">
                <div className="modal-destination">{activeTab === 'tours' ? selectedItem.destination : selectedItem.location}</div>
                <h2 className="modal-title">{selectedItem.name}</h2>
                {!selectedItem.isActive && (
                  <div className="modal-badge inactive">Inactive</div>
                )}
              </div>
              
              {selectedItem.imageUrl && (
                <div className="modal-image">
                  <img src={selectedItem.imageUrl} alt={selectedItem.name} />
                </div>
              )}
              
              <div className="modal-body">
                <div className="modal-description">
                  <h4>About This {activeTab === 'tours' ? 'Tour' : 'Hotel'}</h4>
                  <p>{selectedItem.description}</p>
                </div>
                
                <div className="modal-specs">
                  {activeTab === 'tours' ? (
                    <>
                      <div className="spec-item">
                        <span className="spec-icon">⏱️</span>
                        <div className="spec-info">
                          <span className="spec-label">Duration</span>
                          <span className="spec-value">{selectedItem.durationDays} days</span>
                        </div>
                      </div>
                      <div className="spec-item">
                        <span className="spec-icon">👥</span>
                        <div className="spec-info">
                          <span className="spec-label">Capacity</span>
                          <span className="spec-value">{selectedItem.capacity} people</span>
                        </div>
                      </div>
                      <div className="spec-item">
                        <span className="spec-icon">🎫</span>
                        <div className="spec-info">
                          <span className="spec-label">Available Spots</span>
                          <span className="spec-value">{selectedItem.availableSlots} remaining</span>
                        </div>
                      </div>
                      <div className="spec-item">
                        <span className="spec-icon">💰</span>
                        <div className="spec-info">
                          <span className="spec-label">Price</span>
                          <span className="spec-value"></span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="spec-item">
                        <span className="spec-icon">🛏️</span>
                        <div className="spec-info">
                          <span className="spec-label">Available Rooms</span>
                          <span className="spec-value">{selectedItem.availableRooms} rooms</span>
                        </div>
                      </div>
                      <div className="spec-item">
                        <span className="spec-icon">⭐</span>
                        <div className="spec-info">
                          <span className="spec-label">Rating</span>
                          <span className="spec-value">4.5 / 5.0</span>
                        </div>
                      </div>
                      <div className="spec-item">
                        <span className="spec-icon">✨</span>
                        <div className="spec-info">
                          <span className="spec-label">Amenities</span>
                          <span className="spec-value">Pool, Spa, WiFi</span>
                        </div>
                      </div>
                      <div className="spec-item">
                        <span className="spec-icon">💰</span>
                        <div className="spec-info">
                          <span className="spec-label">Price</span>
                          <span className="spec-value"> / night</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="modal-footer">
                  <div className="tour-id">ID: {selectedItem.id}</div>
                  <div className="tour-dates">
                    <span>Created: {new Date(selectedItem.createdAt).toLocaleDateString()}</span>
                    {selectedItem.updatedAt && (
                      <span>Updated: {new Date(selectedItem.updatedAt).toLocaleDateString()}</span>
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
