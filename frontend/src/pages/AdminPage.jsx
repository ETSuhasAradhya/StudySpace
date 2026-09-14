import React, { useState, useEffect } from 'react';
import { api } from '../api.js';
import { PlusCircle, Trash2, Shield, Calendar, Users, MapPin, Zap, UserCheck } from 'lucide-react';
import SeatVerificationPage from './SeatVerificationPage.jsx';

export default function AdminPage() {
  const [activeSubTab, setActiveSubTab] = useState('verification');
  const [spaces, setSpaces] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // New Space Form State
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSpaceLocation, setNewSpaceLocation] = useState('');
  const [newSpaceCapacity, setNewSpaceCapacity] = useState(10);
  const [newSpaceDesc, setNewSpaceDesc] = useState('');

  // New Seat Form State
  const [selectedSpaceForSeat, setSelectedSpaceForSeat] = useState(null);
  const [newSeatNumber, setNewSeatNumber] = useState('');
  const [hasOutlet, setHasOutlet] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeSubTab]);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      if (activeSubTab === 'spaces') {
        const spacesData = await api.getSpaces();
        setSpaces(spacesData);
      } else {
        const resData = await api.getAllReservations();
        setReservations(resData);
      }
    } catch (err) {
      setError(err.message || 'Failed to load administrative data.');
    } finally {
      setLoading(false);
    }
  }

  // Handle Create Space
  const handleCreateSpace = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.createSpace({
        name: newSpaceName,
        location: newSpaceLocation,
        capacity: Number(newSpaceCapacity),
        description: newSpaceDesc
      });
      setSuccess(`Study space "${newSpaceName}" created successfully!`);
      setNewSpaceName('');
      setNewSpaceLocation('');
      setNewSpaceDesc('');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to create study space.');
    }
  };

  // Handle Delete Space
  const handleDeleteSpace = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This will delete all seats inside it.`)) {
      return;
    }
    try {
      await api.deleteSpace(id);
      setSuccess(`Study space "${name}" deleted.`);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete study space.');
    }
  };

  // Handle Add Seat
  const handleAddSeat = async (spaceId) => {
    if (!newSeatNumber.trim()) {
      setError('Please provide a seat number (e.g. D1).');
      return;
    }
    setError('');
    setSuccess('');
    try {
      await api.createSeat(spaceId, {
        seat_number: newSeatNumber.trim().toUpperCase(),
        has_power_outlet: hasOutlet
      });
      setSuccess(`Seat ${newSeatNumber.toUpperCase()} added to space!`);
      setNewSeatNumber('');
      setSelectedSpaceForSeat(null);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to add seat.');
    }
  };

  // Handle Admin Cancel Reservation
  const handleCancelReservation = async (id) => {
    if (!window.confirm('Cancel this student reservation?')) return;
    try {
      await api.cancelReservation(id);
      setSuccess('Reservation cancelled.');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to cancel reservation.');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2>Campus Administration Console</h2>
          <p>Manage library spaces, configure seats, and monitor campus-wide reservations.</p>
        </div>
      </div>

      {/* Sub tabs */}
      <div className="admin-subtabs">
        <button 
          className={`admin-tab-btn ${activeSubTab === 'verification' ? 'active' : ''}`}
          onClick={() => { setActiveSubTab('verification'); setError(''); setSuccess(''); }}
        >
          <UserCheck size={16} />
          <span>Verify Registrations</span>
        </button>
        <button 
          className={`admin-tab-btn ${activeSubTab === 'spaces' ? 'active' : ''}`}
          onClick={() => { setActiveSubTab('spaces'); setError(''); setSuccess(''); }}
        >
          <Users size={16} />
          <span>Manage Spaces & Desks</span>
        </button>
        <button 
          className={`admin-tab-btn ${activeSubTab === 'reservations' ? 'active' : ''}`}
          onClick={() => { setActiveSubTab('reservations'); setError(''); setSuccess(''); }}
        >
          <Calendar size={16} />
          <span>All Campus Reservations</span>
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* TAB 0: STUDENT SEAT VERIFICATION */}
      {activeSubTab === 'verification' && (
        <SeatVerificationPage />
      )}

      {/* TAB 1: SPACES MANAGEMENT */}
      {activeSubTab === 'spaces' && (
        <div className="admin-content-grid">
          {/* Create Space Card */}
          <div className="admin-card">
            <h3>Add New Study Space</h3>
            <form onSubmit={handleCreateSpace} className="admin-form">
              <div className="form-group">
                <label>Space Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Law Library Reading Room"
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Campus Location</label>
                <input 
                  type="text" 
                  placeholder="e.g. West Campus, Level 2"
                  value={newSpaceLocation}
                  onChange={(e) => setNewSpaceLocation(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Capacity</label>
                <input 
                  type="number" 
                  min="1"
                  max="100"
                  value={newSpaceCapacity}
                  onChange={(e) => setNewSpaceCapacity(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea 
                  rows="2"
                  placeholder="e.g. Silent zone for law research with individual lamps."
                  value={newSpaceDesc}
                  onChange={(e) => setNewSpaceDesc(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-primary">
                <PlusCircle size={16} />
                <span>Create Study Space</span>
              </button>
            </form>
          </div>

          {/* List Existing Spaces */}
          <div className="admin-card">
            <h3>Existing Spaces ({spaces.length})</h3>
            <div className="admin-spaces-list">
              {spaces.map((s) => (
                <div key={s.id} className="admin-space-item">
                  <div className="admin-space-info">
                    <strong>{s.name}</strong>
                    <span className="sub-text">{s.location} • {s.total_seats || 0} seats created</span>
                  </div>

                  <div className="admin-actions">
                    <button 
                      className="btn-outline-small"
                      onClick={() => setSelectedSpaceForSeat(selectedSpaceForSeat === s.id ? null : s.id)}
                    >
                      + Add Seat
                    </button>
                    <button 
                      className="btn-delete-small"
                      onClick={() => handleDeleteSpace(s.id, s.name)}
                      title="Delete Space"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Inline Add Seat Form */}
                  {selectedSpaceForSeat === s.id && (
                    <div className="inline-add-seat">
                      <input 
                        type="text" 
                        placeholder="Seat (e.g. A11)" 
                        value={newSeatNumber}
                        onChange={(e) => setNewSeatNumber(e.target.value)}
                        style={{ width: '120px' }}
                      />
                      <label className="checkbox-label">
                        <input 
                          type="checkbox" 
                          checked={hasOutlet} 
                          onChange={(e) => setHasOutlet(e.target.checked)}
                        />
                        <span>Power Outlet</span>
                      </label>
                      <button 
                        type="button" 
                        className="btn-primary-small"
                        onClick={() => handleAddSeat(s.id)}
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALL RESERVATIONS */}
      {activeSubTab === 'reservations' && (
        <div className="admin-card">
          <h3>All Campus Bookings ({reservations.length})</h3>
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Space</th>
                  <th>Desk</th>
                  <th>Date</th>
                  <th>Slot</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.user_name}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.user_email}</div>
                    </td>
                    <td>{r.space_name}</td>
                    <td><span className="table-seat-badge">{r.seat_number}</span></td>
                    <td>{new Date(r.reservation_date).toLocaleDateString()}</td>
                    <td>{r.start_time.slice(0, 5)} – {r.end_time.slice(0, 5)}</td>
                    <td>
                      <span className={`status-tag ${r.status}`}>{r.status}</span>
                    </td>
                    <td>
                      {r.status === 'confirmed' && (
                        <button 
                          className="btn-delete-small"
                          onClick={() => handleCancelReservation(r.id)}
                          title="Cancel Reservation"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
