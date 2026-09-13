import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { MapPin, Users, ArrowRight, Sparkles, Building, Layers } from 'lucide-react';

export default function SpacesPage({ onSelectSpace }) {
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSpaces() {
      try {
        const data = await api.getSpaces();
        setSpaces(data);
      } catch (err) {
        setError(err.message || 'Failed to load study spaces');
      } finally {
        setLoading(false);
      }
    }
    loadSpaces();
  }, []);

  if (loading) {
    return (
      <div className="page-container loading-state">
        <div className="spinner"></div>
        <p>Loading Central Library floor plans...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="library-hero-card">
        <div className="hero-badge">
          <Building size={16} />
          <span>Central University Library</span>
        </div>
        <h2>4-Floor Smart Reservation System</h2>
        <p>Explore different architectural layouts across all 4 levels — from collaborative group zones to private soundproof corner pods.</p>
      </div>

      <div className="spaces-grid">
        {spaces.map((space) => {
          const isCornerFloor = space.name.includes('Floor 3') || space.name.includes('Floor 4');

          return (
            <div key={space.id} className="space-card">
              <div className="space-card-header">
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span className="space-badge">
                    <Sparkles size={13} /> {space.total_seats || space.capacity} Desks Total
                  </span>
                  {isCornerFloor && (
                    <span className="space-badge corner-tag">
                      🎯 Single Corner Desks
                    </span>
                  )}
                </div>
                <h3>{space.name}</h3>
              </div>

              <div className="space-card-body">
                <div className="space-meta">
                  <div className="meta-item">
                    <MapPin size={15} color="var(--primary)" />
                    <span>{space.location}</span>
                  </div>
                  <div className="meta-item">
                    <Users size={15} color="var(--primary)" />
                    <span>Capacity: {space.capacity} students</span>
                  </div>
                </div>

                <p className="space-desc">{space.description}</p>
              </div>

              <div className="space-card-footer">
                <button className="btn-select-space" onClick={() => onSelectSpace(space)}>
                  <Layers size={16} />
                  <span>Open Floor Blueprint</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
