import React, { useState, useEffect } from 'react';
import { api } from '../api.js';
import { 
  UserCheck, Shield, Search, Filter, CheckCircle2, Clock, 
  AlertCircle, XCircle, RefreshCw, Calendar, MapPin, Armchair, 
  Check, ArrowRight, Award, Zap
} from 'lucide-react';

export default function SeatVerificationPage() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadReservations();
  }, []);

  async function loadReservations() {
    setLoading(true);
    setError('');
    try {
      const data = await api.getAllReservations();
      setReservations(data);
    } catch (err) {
      setError(err.message || 'Failed to load reservations.');
    } finally {
      setLoading(false);
    }
  }

  // Handle Verify / Check-In Toggle
  const handleToggleVerify = async (id, studentName, seatNumber) => {
    setActionLoading(id);
    setError('');
    setSuccess('');
    try {
      const res = await api.verifyReservation(id);
      setSuccess(`${res.message} (${studentName} • ${seatNumber})`);
      
      // Update local state smoothly
      setReservations(prev => prev.map(r => {
        if (r.id === id) {
          return { ...r, status: res.reservation.status };
        }
        return r;
      }));
    } catch (err) {
      setError(err.message || 'Failed to update verification status.');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Cancel / Release
  const handleCancel = async (id, studentName, seatNumber) => {
    if (!window.confirm(`Release desk ${seatNumber} booked by ${studentName}?`)) return;
    setActionLoading(id);
    setError('');
    setSuccess('');
    try {
      await api.cancelReservation(id);
      setSuccess(`Desk ${seatNumber} released and booking cancelled.`);
      setReservations(prev => prev.map(r => {
        if (r.id === id) {
          return { ...r, status: 'cancelled' };
        }
        return r;
      }));
    } catch (err) {
      setError(err.message || 'Failed to cancel reservation.');
    } finally {
      setActionLoading(null);
    }
  };

  // Filter Logic
  const filtered = reservations.filter(r => {
    // Search match
    const search = searchTerm.toLowerCase().trim();
    const matchesSearch = !search || 
      r.user_name?.toLowerCase().includes(search) ||
      r.user_email?.toLowerCase().includes(search) ||
      r.seat_number?.toLowerCase().includes(search) ||
      r.space_name?.toLowerCase().includes(search);

    // Floor match
    const matchesFloor = selectedFloor === 'all' || 
      (selectedFloor === '1' && r.space_name?.includes('Floor 1')) ||
      (selectedFloor === '2' && r.space_name?.includes('Floor 2')) ||
      (selectedFloor === '3' && r.space_name?.includes('Floor 3')) ||
      (selectedFloor === '4' && r.space_name?.includes('Floor 4'));

    // Status match
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;

    return matchesSearch && matchesFloor && matchesStatus;
  });

  // Analytics Metrics
  const totalBookings = reservations.length;
  const verifiedCount = reservations.filter(r => r.status === 'verified').length;
  const pendingCount = reservations.filter(r => r.status === 'confirmed').length;
  const uniqueStudents = new Set(reservations.map(r => r.user_email)).size;
  const verifiedPercent = totalBookings > 0 ? Math.round((verifiedCount / (verifiedCount + pendingCount || 1)) * 100) : 0;

  return (
    <div className="page-container" style={{ maxWidth: '1180px' }}>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ 
              background: '#3b82f6', 
              color: '#fff', 
              fontSize: '0.75rem', 
              fontWeight: '700', 
              padding: '3px 8px', 
              borderRadius: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Admin Perspective
            </span>
            <h2 style={{ margin: 0 }}>Student Seat Verifications & Attendance</h2>
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>
            Real-time roster of students who registered for desks across Central Library Floors 1 to 4 with 1-click check-in verification.
          </p>
        </div>

        <button 
          className="btn-outline-small"
          onClick={loadReservations}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px' }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Metric Stat Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <div style={{ 
          background: '#ffffff', 
          border: '1px solid #e2e8f0', 
          borderRadius: '10px', 
          padding: '16px 20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>
            TOTAL SEAT REGISTRATIONS
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>
            {totalBookings}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
            Across all 4 library levels
          </div>
        </div>

        <div style={{ 
          background: '#ffffff', 
          border: '1px solid #bbf7d0', 
          borderRadius: '10px', 
          padding: '16px 20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#166534', marginBottom: '4px' }}>
            VERIFIED & PRESENT
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '1.8rem', fontWeight: '800', color: '#15803d' }}>
              {verifiedCount}
            </span>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#16a34a', background: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>
              {verifiedPercent}% checked in
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#166534', marginTop: '2px' }}>
            Students at their assigned desks
          </div>
        </div>

        <div style={{ 
          background: '#ffffff', 
          border: '1px solid #bfdbfe', 
          borderRadius: '10px', 
          padding: '16px 20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#1e40af', marginBottom: '4px' }}>
            PENDING VERIFICATION
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#2563eb' }}>
            {pendingCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#3b82f6', marginTop: '2px' }}>
            Awaiting student arrival / scan
          </div>
        </div>

        <div style={{ 
          background: '#ffffff', 
          border: '1px solid #e2e8f0', 
          borderRadius: '10px', 
          padding: '16px 20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#64748b', marginBottom: '4px' }}>
            REGISTERED STUDENTS
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a' }}>
            {uniqueStudents}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
            Unique student accounts
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Filter and Search Bar Card */}
      <div style={{ 
        background: '#ffffff', 
        border: '1px solid #e2e8f0', 
        borderRadius: '10px', 
        padding: '16px 20px',
        marginBottom: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '14px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Search input */}
        <div style={{ position: 'relative', flex: '1', minWidth: '260px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input 
            type="text"
            placeholder="Search by student name, email, or desk (e.g. SOLO-1, Alex)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '9px 12px 9px 36px', 
              fontSize: '0.88rem', 
              border: '1px solid #cbd5e1', 
              borderRadius: '6px' 
            }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {/* Floor selector */}
          <select 
            value={selectedFloor}
            onChange={(e) => setSelectedFloor(e.target.value)}
            style={{ padding: '8px 12px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
          >
            <option value="all">🏢 All Library Floors</option>
            <option value="1">Level 1 – Main Reading Hall</option>
            <option value="2">Level 2 – Collaborative Commons</option>
            <option value="3">Level 3 – Silent Study & Research</option>
            <option value="4">Level 4 – Deep Focus & Pods</option>
          </select>

          {/* Status selector */}
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '8px 12px', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}
          >
            <option value="all">🏷️ All Statuses</option>
            <option value="confirmed">⏳ Pending Verification (Confirmed)</option>
            <option value="verified">✅ Verified & Present</option>
            <option value="cancelled">❌ Cancelled</option>
          </select>
        </div>
      </div>

      {/* Main Registrations Table */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700' }}>
            Registered Students ({filtered.length})
          </h3>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Click <strong>"Verify Student"</strong> to confirm desk occupancy
          </span>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading student registrations...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: '#64748b' }}>
            <Armchair size={36} style={{ color: '#cbd5e1', marginBottom: '10px' }} />
            <p style={{ margin: 0, fontWeight: '600' }}>No student registrations found matching your filter criteria.</p>
            <button 
              className="btn-outline-small" 
              style={{ marginTop: '12px' }}
              onClick={() => { setSearchTerm(''); setSelectedFloor('all'); setStatusFilter('all'); }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 16px' }}>Student Details</th>
                  <th style={{ padding: '12px 16px' }}>Library Space & Level</th>
                  <th style={{ padding: '12px 16px' }}>Desk Number</th>
                  <th style={{ padding: '12px 16px' }}>Time Slot</th>
                  <th style={{ padding: '12px 16px' }}>Verification Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Admin Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const isVerified = r.status === 'verified';
                  const isCancelled = r.status === 'cancelled';
                  const isConfirmed = r.status === 'confirmed';

                  // Determine initials
                  const initials = r.user_name ? r.user_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'ST';

                  return (
                    <tr 
                      key={r.id} 
                      style={{ 
                        borderBottom: '1px solid #f1f5f9',
                        background: isVerified ? '#f0fdf4' : 'transparent',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      {/* 1. Student Info */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ 
                            width: '36px', 
                            height: '36px', 
                            borderRadius: '50%', 
                            background: isVerified ? '#22c55e' : '#2563eb', 
                            color: '#ffffff',
                            fontWeight: '700',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.92rem' }}>
                              {r.user_name}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                              {r.user_email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Space / Floor */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: '600', color: '#334155', fontSize: '0.88rem' }}>
                          {r.space_name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {r.location || 'Central Library'}
                        </div>
                      </td>

                      {/* 3. Desk Number */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ 
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px', 
                          background: r.seat_number?.startsWith('SOLO-') ? '#fef3c7' : '#eff6ff', 
                          color: r.seat_number?.startsWith('SOLO-') ? '#92400e' : '#1e40af', 
                          borderRadius: '6px', 
                          fontWeight: '800',
                          fontSize: '0.88rem',
                          border: r.seat_number?.startsWith('SOLO-') ? '1px solid #fde68a' : '1px solid #bfdbfe'
                        }}>
                          <Armchair size={13} />
                          {r.seat_number}
                        </span>
                        {r.seat_number?.startsWith('SOLO-') && (
                          <span style={{ display: 'block', fontSize: '0.7rem', color: '#b45309', marginTop: '2px', fontWeight: '600' }}>
                            Solo Focus Carrel
                          </span>
                        )}
                      </td>

                      {/* 4. Time Window */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>
                          <Calendar size={13} style={{ color: '#64748b' }} />
                          {new Date(r.reservation_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                          <Clock size={13} />
                          {r.start_time?.slice(0, 5)} – {r.end_time?.slice(0, 5)}
                        </div>
                      </td>

                      {/* 5. Verification Status Badge */}
                      <td style={{ padding: '14px 16px' }}>
                        {isVerified && (
                          <span style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '5px', 
                            padding: '4px 9px', 
                            borderRadius: '20px', 
                            fontSize: '0.75rem', 
                            fontWeight: '700', 
                            background: '#dcfce7', 
                            color: '#15803d',
                            border: '1px solid #86efac'
                          }}>
                            <CheckCircle2 size={13} />
                            Verified & Present
                          </span>
                        )}

                        {isConfirmed && (
                          <span style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '5px', 
                            padding: '4px 9px', 
                            borderRadius: '20px', 
                            fontSize: '0.75rem', 
                            fontWeight: '700', 
                            background: '#eff6ff', 
                            color: '#1d4ed8',
                            border: '1px solid #bfdbfe'
                          }}>
                            <Clock size={13} />
                            Awaiting Verification
                          </span>
                        )}

                        {isCancelled && (
                          <span style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '5px', 
                            padding: '4px 9px', 
                            borderRadius: '20px', 
                            fontSize: '0.75rem', 
                            fontWeight: '700', 
                            background: '#fef2f2', 
                            color: '#b91c1c',
                            border: '1px solid #fecaca'
                          }}>
                            <XCircle size={13} />
                            Cancelled
                          </span>
                        )}
                      </td>

                      {/* 6. Admin Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          {!isCancelled && (
                            <button
                              type="button"
                              onClick={() => handleToggleVerify(r.id, r.user_name, r.seat_number)}
                              disabled={actionLoading === r.id}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '6px 12px',
                                fontSize: '0.8rem',
                                fontWeight: '700',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                background: isVerified ? '#ffffff' : '#16a34a',
                                color: isVerified ? '#15803d' : '#ffffff',
                                border: isVerified ? '1px solid #86efac' : 'none',
                                boxShadow: isVerified ? 'none' : '0 2px 4px rgba(22, 163, 74, 0.25)'
                              }}
                              title={isVerified ? 'Click to revert verification' : 'Verify student attendance'}
                            >
                              <UserCheck size={14} />
                              <span>{isVerified ? 'Revert' : 'Verify Student'}</span>
                            </button>
                          )}

                          {isConfirmed && (
                            <button
                              type="button"
                              onClick={() => handleCancel(r.id, r.user_name, r.seat_number)}
                              disabled={actionLoading === r.id}
                              style={{
                                padding: '6px 10px',
                                fontSize: '0.78rem',
                                fontWeight: '600',
                                borderRadius: '6px',
                                background: '#ffffff',
                                color: '#dc2626',
                                border: '1px solid #fecaca',
                                cursor: 'pointer'
                              }}
                              title="Cancel booking and release desk"
                            >
                              Release
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
