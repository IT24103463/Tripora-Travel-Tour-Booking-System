import { useState, useEffect } from 'react';
import { isTokenExpired } from '../App.jsx';
import './TourManagement.css';

const API_TOURS_ENDPOINT = 'http://localhost:5025/api/tours';

export default function TourManagement({ token, user, onSessionExpired }) {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTour, setEditingTour] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    destination: '',
    price: '',
    durationDays: '',
    capacity: '',
    imageUrl: ''
  });
  const [formErrors, setFormErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token || isTokenExpired(token)) {
      if (onSessionExpired) {
        onSessionExpired();
      }
      return;
    }

    // Check if user is admin
    if (user?.role !== 'Admin') {
      setError('Access denied. Admin privileges required.');
      setLoading(false);
      return;
    }

    fetchTours();
  }, [token, user]);

  const fetchTours = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(API_TOURS_ENDPOINT, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();

      if (response.status === 401) {
        if (onSessionExpired) {
          onSessionExpired();
        }
        setError('Authentication failed. Please log in again.');
        return;
      }

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormErrors([]);
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.name.trim()) {
      errors.push('Tour name is required.');
    } else if (formData.name.trim().length < 3) {
      errors.push('Tour name must be at least 3 characters.');
    }

    if (!formData.description.trim()) {
      errors.push('Description is required.');
    } else if (formData.description.trim().length < 10) {
      errors.push('Description must be at least 10 characters.');
    }

    if (!formData.destination.trim()) {
      errors.push('Destination is required.');
    } else if (formData.destination.trim().length < 2) {
      errors.push('Destination must be at least 2 characters.');
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      errors.push('Price must be greater than zero.');
    }

    if (!formData.durationDays || parseInt(formData.durationDays) <= 0) {
      errors.push('Duration must be at least 1 day.');
    }

    if (!formData.capacity || parseInt(formData.capacity) <= 0) {
      errors.push('Capacity must be at least 1 person.');
    }

    if (formData.imageUrl && !isValidUrl(formData.imageUrl)) {
      errors.push('Image URL must be a valid HTTP or HTTPS URL.');
    }

    return errors;
  };

  const isValidUrl = (string) => {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return false;
    }
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
      const endpoint = editingTour 
        ? `${API_TOURS_ENDPOINT}/${editingTour.id}`
        : API_TOURS_ENDPOINT;

      const method = editingTour ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          destination: formData.destination.trim(),
          price: parseFloat(formData.price),
          durationDays: parseInt(formData.durationDays),
          capacity: parseInt(formData.capacity),
          imageUrl: formData.imageUrl.trim() || null
        })
      });

      const data = await response.json();

      if (response.status === 401) {
        if (onSessionExpired) {
          onSessionExpired();
        }
        setError('Authentication failed. Please log in again.');
        return;
      }

      if (response.status === 403) {
        setError('Access denied. Admin privileges required.');
        return;
      }

      if (response.ok && data.success) {
        // Reset form and refresh tours
        resetForm();
        await fetchTours();
        setShowCreateForm(false);
        setEditingTour(null);
      } else {
        setFormErrors(data.errors || [data.message || 'Operation failed.']);
      }
    } catch (err) {
      console.error('Tour operation error:', err);
      setFormErrors(['Unable to connect to the server. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (tour) => {
    setEditingTour(tour);
    setFormData({
      name: tour.name,
      description: tour.description,
      destination: tour.destination,
      price: tour.price.toString(),
      durationDays: tour.durationDays.toString(),
      capacity: tour.capacity.toString(),
      imageUrl: tour.imageUrl || ''
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (tourId) => {
    if (!confirm('Are you sure you want to delete this tour? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_TOURS_ENDPOINT}/${tourId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();

      if (response.status === 401) {
        if (onSessionExpired) {
          onSessionExpired();
        }
        setError('Authentication failed. Please log in again.');
        return;
      }

      if (response.status === 403) {
        setError('Access denied. Admin privileges required.');
        return;
      }

      if (response.ok && data.success) {
        await fetchTours();
      } else {
        setError(data.message || 'Failed to delete tour.');
      }
    } catch (err) {
      console.error('Tour delete error:', err);
      setError('Unable to connect to the server. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      destination: '',
      price: '',
      durationDays: '',
      capacity: '',
      imageUrl: ''
    });
    setFormErrors([]);
    setEditingTour(null);
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
          <p>Loading tour management...</p>
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
          <button type="button" className="btn-retry" onClick={fetchTours}>
            ↻ Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tour-management-container">
      <div className="management-header">
        <h2 className="management-title">Tour Management</h2>
        <p className="management-subtitle">Create, edit, and manage tour packages</p>
        
        <div className="management-actions">
          <button 
            type="button" 
            className="btn-create"
            onClick={() => {
              resetForm();
              setShowCreateForm(true);
            }}
          >
            + Create New Tour
          </button>
          <button type="button" className="btn-refresh" onClick={fetchTours}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="tour-form-container">
          <div className="form-header">
            <h3>{editingTour ? 'Edit Tour' : 'Create New Tour'}</h3>
            <button type="button" className="btn-close" onClick={handleCancel}>
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="tour-form">
            {formErrors.length > 0 && (
              <div className="form-errors">
                <div className="error-icon">⚠️</div>
                <ul>
                  {formErrors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="tour-name">Tour Name *</label>
              <input
                type="text"
                id="tour-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., European Adventure"
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="tour-destination">Destination *</label>
              <input
                type="text"
                id="tour-destination"
                name="destination"
                value={formData.destination}
                onChange={handleInputChange}
                placeholder="e.g., Paris, France"
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="tour-description">Description *</label>
              <textarea
                id="tour-description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the tour experience..."
                rows={4}
                disabled={isSubmitting}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="tour-price">Price ($) *</label>
                <input
                  type="number"
                  id="tour-price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="2499.99"
                  step="0.01"
                  min="0"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label htmlFor="tour-duration">Duration (Days) *</label>
                <input
                  type="number"
                  id="tour-duration"
                  name="durationDays"
                  value={formData.durationDays}
                  onChange={handleInputChange}
                  placeholder="7"
                  min="1"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="tour-capacity">Capacity (People) *</label>
              <input
                type="number"
                id="tour-capacity"
                name="capacity"
                value={formData.capacity}
                onChange={handleInputChange}
                placeholder="30"
                min="1"
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="tour-image">Image URL (Optional)</label>
              <input
                type="url"
                id="tour-image"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleInputChange}
                placeholder="https://example.com/tour-image.jpg"
                disabled={isSubmitting}
              />
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn-cancel" 
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : (editingTour ? 'Update Tour' : 'Create Tour')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="tours-table-container">
        {tours.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🌍</div>
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
              {tours.map((tour) => (
                <tr key={tour.id} className={!tour.isActive ? 'row-inactive' : ''}>
                  <td className="tour-name-cell">{tour.name}</td>
                  <td>{tour.destination}</td>
                  <td>${tour.price.toLocaleString()}</td>
                  <td>{tour.durationDays} days</td>
                  <td>{tour.availableSlots} / {tour.capacity}</td>
                  <td>
                    <span className={`status-badge ${tour.isActive ? 'active' : 'inactive'}`}>
                      {tour.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        type="button"
                        className="btn-action btn-edit"
                        onClick={() => handleEdit(tour)}
                        title="Edit tour"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        className="btn-action btn-delete"
                        onClick={() => handleDelete(tour.id)}
                        title="Delete tour"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}