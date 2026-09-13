import React, { useState } from 'react';

export default function EditDestinationModal({ item, activeTab, onClose, onUpdate, token }) {
  const [editFormData, setEditFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price || item?.pricePerNight || 0,
    capacity: item?.capacity || item?.availableRooms || 0,
    imageUrl: item?.imageUrl || ''
  });

  const API_ACTIVE_TOURS = 'http://localhost:5120/api/tours';
  const API_HOTELS = 'http://localhost:5120/api/hotels';

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const endpoint = activeTab === 'tours' ? `${API_ACTIVE_TOURS}/${item.id}` : `${API_HOTELS}/${item.id}`;
      
      const payload = { ...item, ...editFormData };
      if (activeTab === 'tours') {
        payload.price = parseFloat(editFormData.price);
        payload.capacity = parseInt(editFormData.capacity, 10);
      } else {
        payload.pricePerNight = parseFloat(editFormData.price);
        payload.availableRooms = parseInt(editFormData.capacity, 10);
      }

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        onUpdate(payload);
      } else {
        console.error('Failed to update.');
      }
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  return (
    <div className="admin-edit-modal-overlay" style={{ pointerEvents: 'auto', zIndex: 10001 }}>
      <div className="admin-edit-modal-content" style={{ pointerEvents: 'auto' }}>
        <h3>Edit {activeTab === 'tours' ? 'Tour' : 'Hotel'} Details</h3>
        <form onSubmit={handleUpdate}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>Name</label>
            <input type="text" value={editFormData.name || ''} onChange={e => setEditFormData({...editFormData, name: e.target.value})} className="booking-input" required style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #334155', background: '#1e293b', color: '#f8fafc' }} />
          </div>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>Description</label>
            <textarea value={editFormData.description || ''} onChange={e => setEditFormData({...editFormData, description: e.target.value})} className="booking-input" rows={3} required style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #334155', background: '#1e293b', color: '#f8fafc' }} />
          </div>
          <div className="booking-row" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>Price</label>
              <input type="number" value={editFormData.price || ''} onChange={e => setEditFormData({...editFormData, price: e.target.value})} className="booking-input" required style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #334155', background: '#1e293b', color: '#f8fafc' }} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>Capacity/Rooms</label>
              <input type="number" value={editFormData.capacity || ''} onChange={e => setEditFormData({...editFormData, capacity: e.target.value})} className="booking-input" required style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #334155', background: '#1e293b', color: '#f8fafc' }} />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>Image URL</label>
            <input type="text" value={editFormData.imageUrl || ''} onChange={e => setEditFormData({...editFormData, imageUrl: e.target.value})} className="booking-input" style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid #334155', background: '#1e293b', color: '#f8fafc' }} />
          </div>
          <div className="admin-edit-modal-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} style={{ background: 'transparent', border: '1px solid #64748b', color: '#cbd5e1', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" style={{ background: '#0d9488', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}
