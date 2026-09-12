import { useState, useEffect } from 'react';
import { isTokenExpired } from '../App.jsx';
import './DestinationManagement.css';

const API_TOURS_ENDPOINT = 'http://localhost:5120/api/tours';
const API_HOTELS_ENDPOINT = 'http://localhost:5120/api/hotels';

export default function DestinationManagement({ token, user, onSessionExpired }) {
  const [activeTab, setActiveTab] = useState('tours'); // 'tours' | 'hotels'
  
  const [tours, setTours] = useState([]);
  const [hotels, setHotels] = useState([]);
  
  const [loading, setLoading] = useState(true);
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
        setError('Authentication failed. Please log in again.');
        return;
      }
      if (response.ok && data.success) {
        setTours(data.data || []);
      } else {
        setError(data.message || 'Failed to retrieve tours.');
      }
    } catch (err) {
      setError('Unable to connect to the tour service.');
    } finally {
      setLoading(false);
    }
  };

  const fetchHotels = async () => {
    setLoading(true);
    setError(null);
    try {
      // Include inactive to allow admin to see all hotels
      const response = await fetch(`${API_HOTELS_ENDPOINT}?includeInactive=true`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      const data = await response.json();
      if (response.status === 401) {
        if (onSessionExpired) onSessionExpired();
        setError('Authentication failed. Please log in again.');
        return;
      }
      if (response.ok) {
        setHotels(data || []);
      } else {
        setError(data.message || 'Failed to retrieve hotels.');
      }
    } catch (err) {
      setError('Unable to connect to the hotel service.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    setFormErrors([]);
  };

  const validateForm = () => {
    const errors = [];
    if (!formData.name.trim()) errors.push('Name is required.');
    if (!formData.description.trim()) errors.push('Description is required.');

    if (activeTab === 'tours') {
      if (!formData.destination.trim()) errors.push('Destination is required.');
      if (!formData.price || parseFloat(formData.price) <= 0) errors.push('Price must be > 0.');
      if (!formData.durationDays || parseInt(formData.durationDays) <= 0) errors.push('Duration must be >= 1.');
      if (!formData.capacity || parseInt(formData.capacity) <= 0) errors.push('Capacity must be >= 1.');
    } else {
      if (!formData.location.trim()) errors.push('Location is required.');
      if (!formData.pricePerNight || parseFloat(formData.pricePerNight) <= 0) errors.push('Price per night must be > 0.');
      if (!formData.availableRooms || parseInt(formData.availableRooms) < 0) errors.push('Available rooms must be >= 0.');
      if (!formData.rating || parseFloat(formData.rating) < 0 || parseFloat(formData.rating) > 5) errors.push('Rating must be between 0 and 5.');
    }
    
    if (formData.imageUrl && !formData.imageUrl.startsWith('http')) {
      errors.push('Image URL must start with http or https.');
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setFormErrors([]);

    try {
      const endpoint = editingItem 
        ? `${activeTab === 'tours' ? API_TOURS_ENDPOINT : API_HOTELS_ENDPOINT}/${editingItem.id}`
        : (activeTab === 'tours' ? API_TOURS_ENDPOINT : API_HOTELS_ENDPOINT);

      const method = editingItem ? 'PUT' : 'POST';
      
      const payload = activeTab === 'tours' ? {
        name: formData.name.trim(),
        description: formData.description.trim(),
        destination: formData.destination.trim(),
        price: parseFloat(formData.price),
        durationDays: parseInt(formData.durationDays),
        capacity: parseInt(formData.capacity),
        imageUrl: formData.imageUrl.trim() || null,
        isActive: formData.isActive
      } : {
        name: formData.name.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        pricePerNight: parseFloat(formData.pricePerNight),
        availableRooms: parseInt(formData.availableRooms),
        rating: parseFloat(formData.rating),
        amenities: formData.amenities.trim(),
        imageUrl: formData.imageUrl.trim() || null,
        isActive: formData.isActive
      };

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.status === 401) {
        if (onSessionExpired) onSessionExpired();
        setError('Authentication failed. Please log in again.');
        return;
      }
      if (response.status === 403) {
        setError('Access denied. Admin privileges required.');
        return;
      }

      if (response.ok) {
        resetForm();
        if (activeTab === 'tours') await fetchTours();
        else await fetchHotels();
        setShowCreateForm(false);
      } else {
        setFormErrors(data.errors || [data.message || 'Operation failed.']);
      }
    } catch (err) {
      setFormErrors(['Unable to connect to the server. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    if (activeTab === 'tours') {
      setFormData({
        name: item.name,
        description: item.description,
        destination: item.destination,
        price: item.price.toString(),
        durationDays: item.durationDays.toString(),
        capacity: item.capacity.toString(),
        imageUrl: item.imageUrl || '',
        isActive: item.isActive !== false,
        location: '', pricePerNight: '', availableRooms: '', rating: '', amenities: ''
      });
    } else {
      setFormData({
        name: item.name,
        description: item.description,
        location: item.location,
        pricePerNight: item.pricePerNight.toString(),
        availableRooms: item.availableRooms.toString(),
        rating: item.rating.toString(),
        amenities: item.amenities || '',
        imageUrl: item.imageUrl || '',
        isActive: item.isActive !== false,
        destination: '', price: '', durationDays: '', capacity: ''
      });
    }
    setShowCreateForm(true);
  };

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
      const data = await response.json();
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
        setError(data.message || 'Failed to delete.');
      }
    } catch (err) {
      setError('Unable to connect to the server.');
    }
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
          <div className="error-icon">⚠️</div>
          <h3>Access Error</h3>
          <p>{error}</p>
          <button type="button" className="btn-retry" onClick={activeTab === 'tours' ? fetchTours : fetchHotels}>
            🔄 Try Again
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
            + Create New {activeTab === 'tours' ? 'Tour' : 'Hotel'}
          </button>
          <button type="button" className="btn-refresh" onClick={activeTab === 'tours' ? fetchTours : fetchHotels}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="tour-form-container">
          <div className="form-header">
            <h3>{editingItem ? `Edit ${activeTab === 'tours' ? 'Tour' : 'Hotel'}` : `Create New ${activeTab === 'tours' ? 'Tour' : 'Hotel'}`}</h3>
            <button type="button" className="btn-close" onClick={handleCancel}>✕</button>
          </div>

          <form onSubmit={handleSubmit} className="tour-form">
            {formErrors.length > 0 && (
              <div className="form-errors">
                <div className="error-icon">⚠️</div>
                <ul>
                  {formErrors.map((err, idx) => <li key={idx}>{err}</li>)}
                </ul>
              </div>
            )}

            <div className="form-group">
              <label>Name *</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} disabled={isSubmitting} />
            </div>

            {activeTab === 'tours' ? (
              <div className="form-group">
                <label>Destination *</label>
                <input type="text" name="destination" value={formData.destination} onChange={handleInputChange} disabled={isSubmitting} />
              </div>
            ) : (
              <div className="form-group">
                <label>Location / City *</label>
                <input type="text" name="location" value={formData.location} onChange={handleInputChange} disabled={isSubmitting} />
              </div>
            )}

            <div className="form-group">
              <label>Description *</label>
              <textarea name="description" value={formData.description} onChange={handleInputChange} rows={4} disabled={isSubmitting} />
            </div>

            <div className="form-row">
              {activeTab === 'tours' ? (
                <>
                  <div className="form-group">
                    <label>Price ($) *</label>
                    <input type="number" name="price" value={formData.price} onChange={handleInputChange} step="0.01" disabled={isSubmitting} />
                  </div>
                  <div className="form-group">
                    <label>Duration (Days) *</label>
                    <input type="number" name="durationDays" value={formData.durationDays} onChange={handleInputChange} disabled={isSubmitting} />
                  </div>
                  <div className="form-group">
                    <label>Capacity *</label>
                    <input type="number" name="capacity" value={formData.capacity} onChange={handleInputChange} disabled={isSubmitting} />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>Price Per Night ($) *</label>
                    <input type="number" name="pricePerNight" value={formData.pricePerNight} onChange={handleInputChange} step="0.01" disabled={isSubmitting} />
                  </div>
                  <div className="form-group">
                    <label>Available Rooms *</label>
                    <input type="number" name="availableRooms" value={formData.availableRooms} onChange={handleInputChange} disabled={isSubmitting} />
                  </div>
                  <div className="form-group">
                    <label>Rating (0-5) *</label>
                    <input type="number" name="rating" value={formData.rating} onChange={handleInputChange} step="0.1" disabled={isSubmitting} />
                  </div>
                </>
              )}
            </div>

            {activeTab === 'hotels' && (
              <div className="form-group">
                <label>Amenities (Comma-separated)</label>
                <input type="text" name="amenities" value={formData.amenities} onChange={handleInputChange} placeholder="WiFi, Pool, Breakfast" disabled={isSubmitting} />
              </div>
            )}

            <div className="form-group">
              <label>Image URL</label>
              <input type="text" name="imageUrl" value={formData.imageUrl} onChange={handleInputChange} placeholder="https://..." disabled={isSubmitting} />
            </div>

            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
              <input type="checkbox" id="isActive" name="isActive" checked={formData.isActive} onChange={handleInputChange} disabled={isSubmitting} />
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
              <div className="empty-icon">🏜️</div>
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
                    <td>${tour.price.toLocaleString()}</td>
                    <td>{tour.durationDays} days</td>
                    <td>{tour.availableSlots} / {tour.capacity}</td>
                    <td><span className={"status-badge " + (tour.isActive ? 'active' : 'inactive')}>{tour.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <div className="action-buttons">
                        <button type="button" className="btn-action btn-edit" onClick={() => handleEdit(tour)}>✏️</button>
                        <button type="button" className="btn-action btn-delete" onClick={() => handleDelete(tour.id)}>🗑️</button>
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
              <div className="empty-icon">🏢</div>
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
                    <td>${hotel.pricePerNight.toLocaleString()}</td>
                    <td>{hotel.availableRooms}</td>
                    <td>{hotel.rating} ⭐</td>
                    <td><span className={"status-badge " + (hotel.isActive ? 'active' : 'inactive')}>{hotel.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <div className="action-buttons">
                        <button type="button" className="btn-action btn-edit" onClick={() => handleEdit(hotel)}>✏️</button>
                        <button type="button" className="btn-action btn-delete" onClick={() => handleDelete(hotel.id)}>🗑️</button>
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
