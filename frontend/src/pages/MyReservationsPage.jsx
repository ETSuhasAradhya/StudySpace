import React, { useState, useEffect } from 'react';
import { api } from '../api.js';
import { Calendar, Clock, MapPin, CheckCircle, XCircle, AlertCircle, Trash2 } from 'lucide-react';

export default function MyReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    loadReservations();
  }, []);

  async function loadReservations() {
    setLoading(true);
    try {
      const data = await api.getMyReservations();
      setReservations(data);
    } catch (err) {
      setError(err.message || 'Failed to load reservations.');
    } finally {
      setLoading(false);
    }
  }

  const handleCancel = async (id, seatNumber) => {
    if (!window.confirm(`Are you sure you want to cancel your reservation for Seat ${seatNumber}?`)) {
      return;
    }

    try {
      await api.cancelReservation(id);
      setActionSuccess(`Reservation for Seat ${seatNumber} has been cancelled.`);
      await loadReservations();
    } catch (err) {
      setError(err.message || 'Failed to cancel reservation.');
    }
  };

  if (loading) {
    return (
      <div className="page-container loading-state">
        <div className="spinner"></div>
        <p>Loading your reservations...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2>My Study Space Bookings</h2>
          <p>Review your upcoming and past desk reservations across campus.</p>
        </div>
      </div>

      {actionSuccess && (
        <div className="alert alert-success">
          <CheckCircle size={18} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {reservations.length === 0 ? (
        <div className="empty-state-card">
          <Calendar size={48} color="var(--text-muted)" />
          <h3>No Reservations Found</h3>
          <p>You haven't reserved any study desks yet. Visit the Study Spaces tab to book a seat!</p>
        </div>
      ) : (
        <div className="reservations-list">
          {reservations.map((res) => {
            const isConfirmed = res.status === 'confirmed';
            const formattedDate = new Date(res.reservation_date).toLocaleDateString(undefined, {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });

            return (
              <div key={res.id} className={`reservation-card ${res.status}`}>
                <div className="res-main">
                  <div className="res-seat-pill">
                    <span className="pill-number">Desk {res.seat_number}</span>
                    <span className={`status-tag ${res.status}`}>
                      {isConfirmed ? 'Confirmed' : 'Cancelled'}
                    </span>
                  </div>

                  <div className="res-details">
                    <h4>{res.space_name}</h4>
                    <div className="res-meta-row">
                      <span className="res-meta-item">
                        <MapPin size={14} /> {res.location}
                      </span>
                      <span className="res-meta-item">
                        <Calendar size={14} /> {formattedDate}
                      </span>
                      <span className="res-meta-item">
                        <Clock size={14} /> {res.start_time.slice(0, 5)} – {res.end_time.slice(0, 5)}
                      </span>
                    </div>
                  </div>
                </div>

                {isConfirmed && (
                  <div className="res-actions">
                    <button 
                      className="btn-cancel"
                      onClick={() => handleCancel(res.id, res.seat_number)}
                      title="Cancel this reservation"
                    >
                      <Trash2 size={15} />
                      <span>Cancel Booking</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
