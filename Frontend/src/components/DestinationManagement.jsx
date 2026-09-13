import { useState, useEffect } from 'react';
import { isTokenExpired } from '../App.jsx';
import './DestinationManagement.css';
import { RefreshCw, AlertTriangle, X, Compass, Hotel, Edit, Trash2, Plus } from 'lucide-react';

const API_TOURS_ENDPOINT = 'http://localhost:5120/api/tours';
const API_HOTELS_ENDPOINT = 'http://localhost:5120/api/hotels';

export default function DestinationManagement({ token, user, onSessionExpired }) {
  const [activeTab, setActiveTab] = useState('tours'); // 'tours' | 'hotels'
  
  const [tours, setTours] = useState([]);
  const [hotels, setHotels] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [error, setError] = useState(null);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [formData, setFormData] = useState({
    // Shared
    name: '',
    description: '',
    imageUrl: '',
    isActive: true,
    
    // Tours
    destination: '',
    price: '',
    durationDays: '',
    capacity: '',
    
    // Hotels
    location: '',
    pricePerNight: '',
    availableRooms: '',
    rating: '',
    amenities: ''
  });
  
  const [formErrors, setFormErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token || isTokenExpired(token)) {
      if (onSessionExpired) onSessionExpired();
      setLoading(false);
      return;
    }

    if (user?.role !== 'Admin') {
      setError('Access denied. Admin privileges required.');
      setLoading(false);
      return;
    }

    if (activeTab === 'tours') {
      fetchTours();
    } else {
      fetchHotels();
    }
  }, [token, user, activeTab]);

  const fetchTours = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(API_TOURS_ENDPOINT, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      const data = await response.json();
      if (response.status === 401) {
        if (onSessionExpired) onSessionExpired();
        return;
      }
      if (response.ok && data.success) {
        setTours(data.data || []);
      } else {
        setError(data.message || 'Failed to retrieve tours.');
      }
    } catch (err) {
      console.error('Fetch tours error:', err);
      setError('An error occurred while fetching tours.');
    } finally {
      setLoading(false);
    }
  };

  const fetchHotels = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_HOTELS_ENDPOINT}?includeInactive=true`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      const data = await response.json();
      if (response.status === 401) {
        if (onSessionExpired) onSessionExpired();
        return;
      }
      if (response.ok) {
        setHotels(data || []);
      } else {
        setError(data.message || 'Failed to retrieve hotels.');
      }
    } catch (err) {
      console.error('Fetch hotels error:', err);
      setError('An error occurred while fetching hotels.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (item, type) => {
    if (togglingId) return; // Prevent concurrent toggles
    setTogglingId(item.id);

    // Optimistic update
    const prevItems = type === 'tour' ? tours : hotels;
    
    // Update local state immediately
    if (type === 'tour') {
      setTours(tours.map(t => t.id === item.id ? { ...t, isActive: !t.isActive } : t));
    } else {
      setHotels(hotels.map(h => h.id === item.id ? { ...h, isActive: !h.isActive } : h));
    }

    try {
      const endpoint = type === 'tour' ? `${API_TOURS_ENDPOINT}/${item.id}` : `${API_HOTELS_ENDPOINT}/${item.id}`;
      
      let payload;
      if (type === 'tour') {
        payload = {
          name: item.name,
          description: item.description,
          destination: item.destination,
          price: item.price,
          durationDays: item.durationDays,
          capacity: item.capacity,
          imageUrl: item.imageUrl,
          isActive: !item.isActive
        };
      } else {
        payload = {
          name: item.name,
          description: item.description,
          location: item.location,
          pricePerNight: item.pricePerNight,
          availableRooms: item.availableRooms,
          rating: item.rating,
          amenities: item.amenities,
          imageUrl: item.imageUrl,
          isActive: !item.isActive
        };
      }

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to toggle status');
      }
    } catch (err) {
      console.error('Toggle status error:', err);
      setError(`Failed to toggle status: ${err.message}`);
      // Revert on failure
      if (type === 'tour') {
        setTours(prevItems);
      } else {
        setHotels(prevItems);
      }
    } finally {
      setTogglingId(null);
    }
  };  const handleEdit = (item) => {
    if (!item || typeof item !== 'object') {
      console.error("Invalid edit payload:", item);
      return;
    }
    try {
      console.log("Edit clicked. Item data:", item);
      setEditingItem(item);
      if (activeTab === 'tours') {
        setFormData({
          id: item?.id ?? item?._id ?? '',
          name: item?.title ?? item?.name ?? '',
          description: item?.description ?? '',
          destination: item?.destination ?? item?.location ?? '',
          price: item?.price ?? 0,
          durationDays: item?.durationDays ?? 0,
          capacity: item?.availableSpots ?? item?.capacity ?? 0,
          imageUrl: item?.imageUrl ?? '',
          isActive: item?.isActive ?? true,
          location: '', pricePerNight: '', availableRooms: '', rating: '', amenities: ''
        });
      } else {
        setFormData({
          id: item?.id ?? item?._id ?? '',
          name: item?.title ?? item?.name ?? '',
          description: item?.description ?? '',
          location: item?.location ?? '',
          pricePerNight: item?.pricePerNight ?? 0,
          availableRooms: item?.availableRooms ?? 0,
          rating: item?.rating ?? 0,
          amenities: item?.amenities ?? '',
          imageUrl: item?.imageUrl ?? '',
          isActive: item?.isActive ?? true,
          destination: '', price: '', durationDays: '', capacity: ''
        });
      }
      setShowCreateForm(true);
    } catch (err) {
      console.error("Crash before render:", err);
    }
  };;

    const handleDelete = async (id) => {
    if (!confirm(`Are you sure you want to delete this ${activeTab === 'tours' ? 'tour' : 'hotel'}? This action cannot be undone.`)) {
      return;
    }
    try {
      const endpoint = `${activeTab === 'tours' ? API_TOURS_ENDPOINT : API_HOTELS_ENDPOINT}/${id}`;
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      if (response.status === 401) {
        if (onSessionExpired) onSessionExpired();
        setError('Authentication failed.');
        return;
      }
      if (response.status === 403) {
        setError('Access denied.');
        return;
      }
      if (response.ok) {
        if (activeTab === 'tours') await fetchTours();
        else await fetchHotels();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to delete.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError(`Failed to delete: ${err.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormErrors([]);

    let payload;
    if (activeTab === 'tours') {
      payload = {
        name: formData.name,
        description: formData.description,
        destination: formData.destination,
        price: parseFloat(formData.price),
        durationDays: parseInt(formData.durationDays, 10),
        capacity: parseInt(formData.capacity, 10),
        imageUrl: formData.imageUrl,
        isActive: formData.isActive
      };
    } else {
      payload = {
        name: formData.name,
        description: formData.description,
        location: formData.location,
        pricePerNight: parseFloat(formData.pricePerNight),
        availableRooms: parseInt(formData.availableRooms, 10),
        rating: parseFloat(formData.rating),
        amenities: formData.amenities,
        imageUrl: formData.imageUrl,
        isActive: formData.isActive
      };
    }

    try {
      const endpoint = editingItem 
        ? `${activeTab === 'tours' ? API_TOURS_ENDPOINT : API_HOTELS_ENDPOINT}/${editingItem.id}` 
        : (activeTab === 'tours' ? API_TOURS_ENDPOINT : API_HOTELS_ENDPOINT);

      const response = await fetch(endpoint, {
        method: editingItem ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        if (activeTab === 'tours') await fetchTours();
        else await fetchHotels();
        handleCancel();
      } else {
        const data = await response.json();
        if (data.errors) {
          const msgs = [];
          Object.values(data.errors).forEach(errArr => {
            if (Array.isArray(errArr)) msgs.push(...errArr);
          });
          setFormErrors(msgs);
        } else {
          setFormErrors([data.message || 'Validation failed.']);
        }
      }
    } catch (err) {
      console.error('Submit error:', err);
      setFormErrors([err.message]);
    } finally {
      setIsSubmitting(false);
    }
  };

    const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '', description: '', imageUrl: '', isActive: true,
      destination: '', price: '', durationDays: '', capacity: '',
      location: '', pricePerNight: '', availableRooms: '', rating: '', amenities: ''
    });
    setFormErrors([]);
    setEditingItem(null);
  };

  const handleCancel = () => {
    resetForm();
    setShowCreateForm(false);
  };

  if (loading) {
    return (
      <div className="tour-management-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading Destination Management...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tour-management-container">
        <div className="error-state">
          <div className="error-icon"><AlertTriangle size={24} /></div>
          <h3>Access Error</h3>
          <p>{error}</p>
          <button type="button" className="btn-retry" onClick={activeTab === 'tours' ? fetchTours : fetchHotels}>
            <RefreshCw size={16} className="button-icon" style={{marginRight: "4px"}} /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tour-management-container">
      <div className="management-header">
        <h2 className="management-title">Destination Management</h2>
        <p className="management-subtitle">Create, edit, and manage destinations</p>
        
        <div className="management-actions">
          <div className="toggle-switch">
            <button
              type="button"
              className={"toggle-btn " + (activeTab === 'tours' ? 'active' : '')}
              onClick={() => { setActiveTab('tours'); setShowCreateForm(false); }}
            >
              Manage Tours
            </button>
            <button
              type="button"
              className={"toggle-btn " + (activeTab === 'hotels' ? 'active' : '')}
              onClick={() => { setActiveTab('hotels'); setShowCreateForm(false); }}
            >
              Manage Hotels
            </button>
          </div>

          <button 
            type="button" 
            className="btn-create"
            onClick={() => { resetForm(); setShowCreateForm(true); }}
          >
            <Plus size={16} className="button-icon" style={{marginRight: "4px"}} /> Create New {activeTab === 'tours' ? 'Tour' : 'Hotel'}
          </button>
          <button type="button" className="btn-refresh" onClick={activeTab === 'tours' ? fetchTours : fetchHotels}>
            <RefreshCw size={16} className="button-icon" style={{marginRight: "4px"}} /> Refresh
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="tour-form-container">
          <div className="form-header">
            <h3>{editingItem ? `Edit ${activeTab === 'tours' ? 'Tour' : 'Hotel'}` : `Create New ${activeTab === 'tours' ? 'Tour' : 'Hotel'}`}</h3>
            <button type="button" className="btn-close" onClick={handleCancel}><X size={20} /></button>
          </div>

          <form onSubmit={handleSubmit} className="tour-form">
            {formErrors.length > 0 && (
              <div className="form-errors">
                <div className="error-icon"><AlertTriangle size={24} /></div>
                <ul>
                  {formErrors.map((err, idx) => <li key={idx}>{err}</li>)}
                </ul>
              </div>
            )}

            <div className="form-group">
              <label>Name *</label>
              <input type="text" name="name" value={formData.name || ''} onChange={handleInputChange} disabled={isSubmitting} />
            </div>

            {activeTab === 'tours' ? (
              <div className="form-group">
                <label>Destination *</label>
                <input type="text" name="destination" value={formData.destination || ''} onChange={handleInputChange} disabled={isSubmitting} />
              </div>
            ) : (
              <div className="form-group">
                <label>Location / City *</label>
                <input type="text" name="location" value={formData.location || ''} onChange={handleInputChange} disabled={isSubmitting} />
              </div>
            )}

            <div className="form-group">
              <label>Description *</label>
              <textarea name="description" value={formData.description || ''} onChange={handleInputChange} rows={4} disabled={isSubmitting} />
            </div>

            <div className="form-row">
              {activeTab === 'tours' ? (
                <>
                  <div className="form-group">
                    <label>Price ($) *</label>
                    <input type="number" name="price" value={formData.price || ''} onChange={handleInputChange} step="0.01" disabled={isSubmitting} />
                  </div>
                  <div className="form-group">
                    <label>Duration (Days) *</label>
                    <input type="number" name="durationDays" value={formData.durationDays || ''} onChange={handleInputChange} disabled={isSubmitting} />
                  </div>
                  <div className="form-group">
                    <label>Capacity *</label>
                    <input type="number" name="capacity" value={formData.capacity || ''} onChange={handleInputChange} disabled={isSubmitting} />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>Price Per Night ($) *</label>
                    <input type="number" name="pricePerNight" value={formData.pricePerNight || ''} onChange={handleInputChange} step="0.01" disabled={isSubmitting} />
                  </div>
                  <div className="form-group">
                    <label>Available Rooms *</label>
                    <input type="number" name="availableRooms" value={formData.availableRooms || ''} onChange={handleInputChange} disabled={isSubmitting} />
                  </div>
                  <div className="form-group">
                    <label>Rating (0-5) *</label>
                    <input type="number" name="rating" value={formData.rating || ''} onChange={handleInputChange} step="0.1" disabled={isSubmitting} />
                  </div>
                </>
              )}
            </div>

            {activeTab === 'hotels' && (
              <div className="form-group">
                <label>Amenities (Comma-separated)</label>
                <input type="text" name="amenities" value={formData.amenities || ''} onChange={handleInputChange} placeholder="WiFi, Pool, Breakfast" disabled={isSubmitting} />
              </div>
            )}

            <div className="form-group">
              <label>Image URL</label>
              <input type="text" name="imageUrl" value={formData.imageUrl || ''} onChange={handleInputChange} placeholder="https://..." disabled={isSubmitting} />
            </div>

            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
              <input type="checkbox" id="isActive" name="isActive" checked={formData.isActive || false} onChange={handleInputChange} disabled={isSubmitting} />
              <label htmlFor="isActive" style={{ margin: 0 }}>Is Active</label>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={handleCancel} disabled={isSubmitting}>Cancel</button>
              <button type="submit" className="btn-submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : (editingItem ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="tours-table-container">
        {activeTab === 'tours' ? (
          tours.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Compass size={48} /></div>
              <h3>No Tours Found</h3>
              <p>Create your first tour to get started.</p>
            </div>
          ) : (
            <table className="tours-table">
              <thead>
                <tr>
                  <th>Tour Name</th>
                  <th>Destination</th>
                  <th>Price</th>
                  <th>Duration</th>
                  <th>Capacity</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tours.map(tour => (
                  <tr key={tour.id} className={!tour.isActive ? 'row-inactive' : ''}>
                    <td className="tour-name-cell">{tour.name}</td>
                    <td>{tour.destination}</td>
                    <td>${tour.price?.toLocaleString() ?? 0}</td>
                    <td>{tour.durationDays} days</td>
                    <td>{tour.availableSlots} / {tour.capacity}</td>
                    <td>
                        <button 
                          type="button"
                          onClick={() => handleToggleStatus(tour, 'tour')}
                          className={"status-badge toggle-badge " + (tour.isActive ? 'active' : 'inactive')}
                          title={tour.isActive ? "Click to deactivate" : "Click to activate"}
                          disabled={togglingId === tour.id}
                          style={{ opacity: togglingId === tour.id ? 0.6 : 1, cursor: togglingId === tour.id ? 'wait' : 'pointer' }}
                        >
                          {togglingId === tour.id ? <RefreshCw size={14} className="spin-icon" style={{marginRight:'4px'}} /> : null}
                          {tour.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                    <td>
                      <div className="action-buttons">
                        <button type="button" className="btn-action btn-edit" onClick={() => handleEdit(tour)}><Edit size={16} /></button>
                        <button type="button" className="btn-action btn-delete" onClick={() => handleDelete(tour.id)}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : (
          hotels.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Hotel size={48} /></div>
              <h3>No Hotels Found</h3>
              <p>Create your first hotel to get started.</p>
            </div>
          ) : (
            <table className="tours-table">
              <thead>
                <tr>
                  <th>Hotel Name</th>
                  <th>Location</th>
                  <th>Price/Night</th>
                  <th>Rooms</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {hotels.map(hotel => (
                  <tr key={hotel.id} className={!hotel.isActive ? 'row-inactive' : ''}>
                    <td className="tour-name-cell">{hotel.name}</td>
                    <td>{hotel.location}</td>
                    <td>${hotel.pricePerNight?.toLocaleString() ?? 0}</td>
                    <td>{hotel.availableRooms}</td>
                    <td>{hotel.rating} â­</td>
                    <td>
                        <button 
                          type="button"
                          onClick={() => handleToggleStatus(hotel, 'hotel')}
                          className={"status-badge toggle-badge " + (hotel.isActive ? 'active' : 'inactive')}
                          title={hotel.isActive ? "Click to deactivate" : "Click to activate"}
                          disabled={togglingId === hotel.id}
                          style={{ opacity: togglingId === hotel.id ? 0.6 : 1, cursor: togglingId === hotel.id ? 'wait' : 'pointer' }}
                        >
                          {togglingId === hotel.id ? <RefreshCw size={14} className="spin-icon" style={{marginRight:'4px'}} /> : null}
                          {hotel.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                    <td>
                      <div className="action-buttons">
                        <button type="button" className="btn-action btn-edit" onClick={() => handleEdit(hotel)}><Edit size={16} /></button>
                        <button type="button" className="btn-action btn-delete" onClick={() => handleDelete(hotel.id)}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>
    </div>
  );
}











