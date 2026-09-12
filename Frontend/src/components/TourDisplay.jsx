import { useState, useEffect } from 'react';
import './TourDisplay.css';
<<<<<<< Updated upstream
import { Search, MapPin, DollarSign, X, Clock, Users, Ticket, Sparkles, BedSingle, Star, AlertTriangle, Briefcase, Hotel as HotelIcon, RefreshCw } from 'lucide-react';
=======
import { Clock, Users, Ticket, Tag } from 'lucide-react';
>>>>>>> Stashed changes

const API_ACTIVE_TOURS_ENDPOINT = 'http://localhost:5120/api/tours/active';
const API_HOTELS_ENDPOINT = 'http://localhost:5120/api/hotels';

export default function TourDisplay() {
  const [activeTab, setActiveTab] = useState('tours'); // 'tours' | 'hotels'
  
  const [tours, setTours] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => {
    if (activeTab === 'tours') {
      fetchTours();
    } else {
      fetchHotels();
    }
    // Optional: Reset filters when switching tabs if preferred, 
    // but the prompt says "Retain search and filter states appropriately when toggling"
  }, [activeTab]);

  const fetchTours = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(API_ACTIVE_TOURS_ENDPOINT, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
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

  const fetchHotels = async () => {
    setLoading(true);
    setError(null);

    try {
      // By default, this doesn't include inactive hotels (unless we pass ?includeInactive=true)
      const response = await fetch(API_HOTELS_ENDPOINT, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
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

  const handleImageError = (e, fallbackIcon) => {
    e.target.style.display = 'none';
    if (e.target.nextElementSibling) {
      e.target.nextElementSibling.style.display = 'flex';
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setLocationFilter('');
    setMaxPrice('');
  };

  // Filter Logic
  const filteredTours = tours.filter(tour => {
    const matchSearch = !searchTerm || 
      tour.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      tour.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchLoc = !locationFilter || 
      tour.destination.toLowerCase().includes(locationFilter.toLowerCase());
    const matchPrice = !maxPrice || 
      tour.price <= parseFloat(maxPrice);
    return matchSearch && matchLoc && matchPrice;
  });

  const filteredHotels = hotels.filter(hotel => {
    const matchSearch = !searchTerm || 
      hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      hotel.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchLoc = !locationFilter || 
      hotel.location.toLowerCase().includes(locationFilter.toLowerCase());
    const matchPrice = !maxPrice || 
      hotel.pricePerNight <= parseFloat(maxPrice);
    return matchSearch && matchLoc && matchPrice;
  });

  if (loading && tours.length === 0 && hotels.length === 0) {
    return (
      <div className="tour-display-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading available {activeTab}...</p>
        </div>
      </div>
    );
  }

  if (error && tours.length === 0 && hotels.length === 0) {
    return (
      <div className="tour-display-container">
        <div className="error-state">
          <div className="error-icon"><AlertTriangle size={32} /></div>
          <h3>Service Error</h3>
          <p>{error}</p>
          <button type="button" className="btn-retry" onClick={activeTab === 'tours' ? fetchTours : fetchHotels}>
            <RefreshCw size={16} style={{marginRight: "4px"}} /> Try Again
          </button>
        </div>
      </div>
    );
  }

  const currentDataEmpty = activeTab === 'tours' ? tours.length === 0 : hotels.length === 0;
  const currentFilteredData = activeTab === 'tours' ? filteredTours : filteredHotels;
  
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

          <button type="button" className="btn-refresh" onClick={activeTab === 'tours' ? fetchTours : fetchHotels}>
            <RefreshCw size={16} style={{marginRight: "4px"}} /> Refresh
          </button>
        </div>
      </div>

<<<<<<< Updated upstream
            {!currentDataEmpty && (
        <div className="tour-filters">
          <div className="filter-group">
            <Search className="filter-icon" size={18} />
            <input 
              type="text" 
              placeholder="Search name or description..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <MapPin className="filter-icon" size={18} />
            <input 
              type="text" 
              placeholder="Filter by location..." 
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="filter-input"
            />
          </div>
          <div className="filter-group">
            <DollarSign className="filter-icon" size={18} />
            <input 
              type="number" 
              placeholder={`Max price${activeTab === 'hotels' ? ' / night' : ''}`}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="filter-input"
              min="0"
            />
          </div>
          <div className="filter-actions">
            <button type="button" className="btn-filter-clear" onClick={resetFilters}>
              <X size={16} />
              Clear Filters
            </button>
          </div>
=======
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
                    <Clock className="detail-icon" size={18} />
                    <span>{tour.durationDays} days</span>
                  </div>
                  <div className="tour-detail">
                    <Users className="detail-icon" size={18} />
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
>>>>>>> Stashed changes
        </div>
      )}

      {activeTab === 'tours' ? (
        tours.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏜️</div>
            <h3>No Tours Available</h3>
            <p>There are currently no active tours available.</p>
          </div>
        ) : filteredTours.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Search size={48} /></div>
            <h3>No results found</h3>
            <p>We couldn't find any tours matching your criteria.</p>
            <button type="button" className="btn-retry" onClick={resetFilters}>Reset Filters</button>
          </div>
        ) : (
          <div className="tours-grid">
            {filteredTours.map((tour) => (
              <div 
                key={tour.id} 
                className={"tour-card " + (!tour.isActive ? 'tour-inactive' : '')}
                onClick={() => handleItemClick(tour)}
              >
                <div className="tour-image">
                  {tour.imageUrl && (
                    <img src={tour.imageUrl} alt={tour.name} onError={(e) => handleImageError(e, 'tour')} />
                  )}
                  <div className="tour-placeholder" style={{ display: tour.imageUrl ? 'none' : 'flex' }}>
                    <Briefcase size={48} className="placeholder-icon" color="currentColor" />
                  </div>
                </div>
                
                <div className="tour-content">
                  <div className="tour-destination">{tour.destination}</div>
                  <h3 className="tour-name">{tour.name}</h3>
                  <p className="tour-description">{tour.description}</p>
                  
                  <div className="tour-details">
                    <div className="tour-detail">
                      <span className="detail-icon">⏱️</span>
                      <span>{tour.durationDays} Days</span>
                    </div>
                    <div className="tour-detail">
                      <span className="detail-icon"><Users size={14} /></span>
                      <span>{tour.capacity} Max</span>
                    </div>
                  </div>
                  
                  <div className="tour-footer">
                    <div className="tour-price">${tour.price.toLocaleString()}</div>
                    <button type="button" className="btn-view-details">
                      View Details
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
            <div className="empty-icon"><HotelIcon size={48} /></div>
            <h3>No Hotels Available</h3>
            <p>There are currently no active hotels found in the system.</p>
          </div>
        ) : filteredHotels.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Search size={48} /></div>
            <h3>No results found</h3>
            <p>We couldn't find any hotels matching your criteria.</p>
            <button type="button" className="btn-retry" onClick={resetFilters}>Reset Filters</button>
          </div>
        ) : (
          <div className="tours-grid">
            {filteredHotels.map((hotel) => (
              <div 
                key={hotel.id} 
                className={"tour-card " + (!hotel.isActive ? 'tour-inactive' : '')}
                onClick={() => handleItemClick(hotel)}
              >
                <div className="tour-image">
                  {hotel.imageUrl && (
                    <img src={hotel.imageUrl} alt={hotel.name} onError={(e) => handleImageError(e, 'hotel')} />
                  )}
                  <div className="tour-placeholder" style={{ display: hotel.imageUrl ? 'none' : 'flex' }}>
                    <HotelIcon size={48} className="placeholder-icon" color="currentColor" />
                  </div>
                </div>
                
                <div className="tour-content">
                  <div className="tour-destination">{hotel.location}</div>
                  <h3 className="tour-name">{hotel.name}</h3>
                  <p className="tour-description">{hotel.description}</p>
                  
                  <div className="tour-details" style={{ flexWrap: 'wrap' }}>
                    <div className="tour-detail">
                      <span className="detail-icon"><Star size={14} /></span>
                      <span>{hotel.rating} / 5.0</span>
                    </div>
                    {hotel.amenities && hotel.amenities.split(',').slice(0, 2).map((amenity, idx) => (
                      <div className="tour-detail" key={idx}>
                        <span className="detail-icon"><Sparkles size={14} /></span>
                        <span>{amenity.trim()}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="tour-footer">
                    <div className="tour-price">${hotel.pricePerNight.toLocaleString()} <span style={{fontSize:'0.8rem', color:'#64748b'}}>/ night</span></div>
                    <button type="button" className="btn-view-details">
                      View Details
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
            <button type="button" className="modal-close" onClick={handleCloseModal}>✕</button>
            
            <div className="modal-content">
              <div className="modal-header">
                <div className="modal-destination">{activeTab === 'tours' ? selectedItem.destination : selectedItem.location}</div>
                <h2 className="modal-title">{selectedItem.name}</h2>
              </div>
              
              <div className="modal-image">
                {selectedItem.imageUrl && (
                  <img src={selectedItem.imageUrl} alt={selectedItem.name} onError={(e) => handleImageError(e, activeTab === 'tours' ? '🧳' : '🏨')} />
                )}
                <div className="tour-placeholder" style={{ display: selectedItem.imageUrl ? 'none' : 'flex', minHeight: '300px' }}>
                  <span className="placeholder-icon" style={{ fontSize: '4rem' }}>{activeTab === 'tours' ? '🧳' : '🏨'}</span>
                </div>
              </div>
              
              <div className="modal-body">
                <div className="modal-description">
                  <h4>About This {activeTab === 'tours' ? 'Tour' : 'Hotel'}</h4>
                  <p>{selectedItem.description}</p>
                </div>
                
                <div className="modal-specs">
<<<<<<< Updated upstream
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
                        <span className="spec-icon"><Users size={16} /></span>
                        <div className="spec-info">
                          <span className="spec-label">Capacity</span>
                          <span className="spec-value">{selectedItem.capacity} people</span>
                        </div>
                      </div>
                      <div className="spec-item">
                        <span className="spec-icon"><Ticket size={16} /></span>
                        <div className="spec-info">
                          <span className="spec-label">Available Spots</span>
                          <span className="spec-value">{selectedItem.availableSlots} remaining</span>
                        </div>
                      </div>
                      <div className="spec-item">
                        <span className="spec-icon">💰</span>
                        <div className="spec-info">
                          <span className="spec-label">Price</span>
                          <span className="spec-value">${selectedItem.price.toLocaleString()}</span>
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
                        <span className="spec-icon"><Star size={16} /></span>
                        <div className="spec-info">
                          <span className="spec-label">Rating</span>
                          <span className="spec-value">{selectedItem.rating} / 5.0</span>
                        </div>
                      </div>
                      <div className="spec-item">
                        <span className="spec-icon"><Sparkles size={16} /></span>
                        <div className="spec-info">
                          <span className="spec-label">Amenities</span>
                          <span className="spec-value">{selectedItem.amenities || 'None'}</span>
                        </div>
                      </div>
                      <div className="spec-item">
                        <span className="spec-icon">💰</span>
                        <div className="spec-info">
                          <span className="spec-label">Price</span>
                          <span className="spec-value">${selectedItem.pricePerNight.toLocaleString()} / night</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="tour-id">ID: {selectedItem.id}</div>
                  <button type="button" className="btn-refresh" style={{ margin: 0 }}>Book Now</button>
=======
                  <div className="spec-item">
                    <Clock className="spec-icon" size={20} />
                    <div className="spec-info">
                      <span className="spec-label">Duration</span>
                      <span className="spec-value">{selectedTour.durationDays} days</span>
                    </div>
                  </div>
                  
                  <div className="spec-item">
                    <Users className="spec-icon" size={20} />
                    <div className="spec-info">
                      <span className="spec-label">Capacity</span>
                      <span className="spec-value">{selectedTour.capacity} people</span>
                    </div>
                  </div>
                  
                  <div className="spec-item">
                    <Ticket className="spec-icon" size={20} />
                    <div className="spec-info">
                      <span className="spec-label">Available Spots</span>
                      <span className="spec-value">{selectedTour.availableSlots} remaining</span>
                    </div>
                  </div>
                  
                  <div className="spec-item">
                    <Tag className="spec-icon" size={20} />
                    <div className="spec-info">
                      <span className="spec-label">Price</span>
                      <span className="spec-value">${selectedTour.price.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="modal-footer">
                  
                  <div className="tour-dates">
                    <span>Created: {new Date(selectedTour.createdAt).toLocaleDateString()}</span>
                    {selectedTour.updatedAt && (
                      <span>Updated: {new Date(selectedTour.updatedAt).toLocaleDateString()}</span>
                    )}
                  </div>
>>>>>>> Stashed changes
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
