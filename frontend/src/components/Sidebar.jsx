import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, Layers, Calendar, Shield, LogOut, Sparkles, Building, 
  UserCheck, ChevronRight
} from 'lucide-react';

export default function Sidebar({ currentFloorId, onSelectFloor, activeTab, setActiveTab }) {
  const { user, logout } = useAuth();

  const floors = [
    { id: 1, name: 'Level 1: Reading Hall', seats: '40 Desks', badge: null },
    { id: 2, name: 'Level 2: Commons', seats: '32 Desks', badge: 'Tech' },
    { id: 3, name: 'Level 3: Silent Study', seats: '40 Desks', badge: '8 Solo' },
    { id: 4, name: 'Level 4: Focus & Pods', seats: '44 Desks', badge: '12 Solo' }
  ];

  return (
    <aside className="app-sidebar">
      {/* Brand Logo Header */}
      <div className="sidebar-brand">
        <div className="brand-icon-box">
          <BookOpen size={22} color="#ffffff" />
        </div>
        <div className="brand-text">
          <h2>StudySpace</h2>
          <span>Central University Library</span>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="sidebar-nav-container">
        {/* Section 1: Library Floors (Left Tabs!) */}
        <div className="sidebar-section">
          <span className="section-title">LIBRARY FLOORS</span>
          <div className="sidebar-tabs">
            {floors.map((floor) => {
              const isSelected = activeTab === 'floorplan' && currentFloorId === floor.id;

              return (
                <button
                  key={floor.id}
                  type="button"
                  className={`sidebar-tab-btn ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    onSelectFloor(floor.id);
                    setActiveTab('floorplan');
                  }}
                >
                  <div className="tab-left">
                    <Layers size={16} className="tab-icon" />
                    <div className="tab-details">
                      <span className="tab-name">{floor.name}</span>
                      <span className="tab-sub">{floor.seats}</span>
                    </div>
                  </div>

                  {floor.badge && (
                    <span className={`tab-badge ${floor.badge.includes('Solo') ? 'solo' : ''}`}>
                      {floor.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Student Menu */}
        <div className="sidebar-section">
          <span className="section-title">MY ACCOUNT</span>
          <div className="sidebar-tabs">
            <button
              type="button"
              className={`sidebar-tab-btn ${activeTab === 'my-reservations' ? 'active' : ''}`}
              onClick={() => setActiveTab('my-reservations')}
            >
              <div className="tab-left">
                <Calendar size={16} className="tab-icon" />
                <span className="tab-name">My Bookings</span>
              </div>
            </button>

            {user?.role === 'admin' && (
              <button
                type="button"
                className={`sidebar-tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
                onClick={() => setActiveTab('admin')}
              >
                <div className="tab-left">
                  <Shield size={16} className="tab-icon" />
                  <span className="tab-name">Admin Console</span>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* User Profile & Logout at Bottom */}
      <div className="sidebar-footer">
        <div className="user-profile-row">
          <div className="user-avatar">
            {user?.role === 'admin' ? '⚡' : '🎓'}
          </div>
          <div className="user-info">
            <span className="user-display-name">{user?.name || 'Student'}</span>
            <span className={`user-role-pill ${user?.role}`}>
              {user?.role === 'admin' ? 'Administrator' : 'Student'}
            </span>
          </div>
        </div>

        <button className="btn-sidebar-logout" onClick={logout} title="Sign Out">
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
