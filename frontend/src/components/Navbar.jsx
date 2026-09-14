import React from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, User, LogOut, Shield, Calendar, LayoutGrid, UserCheck } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* Logo */}
        <div className="nav-logo" onClick={() => setActiveTab('spaces')} style={{ cursor: 'pointer' }}>
          <div className="logo-icon">
            <BookOpen size={22} color="#ffffff" />
          </div>
          <span className="logo-title">StudySpace</span>
        </div>

        {/* Navigation Tabs */}
        {user && (
          <div className="nav-links">
            <button 
              className={`nav-btn ${activeTab === 'spaces' || activeTab === 'seatmap' ? 'active' : ''}`}
              onClick={() => setActiveTab('spaces')}
            >
              <LayoutGrid size={16} />
              <span>Study Spaces</span>
            </button>

            {user.role === 'student' && (
              <button 
                className={`nav-btn ${activeTab === 'my-reservations' ? 'active' : ''}`}
                onClick={() => setActiveTab('my-reservations')}
              >
                <Calendar size={16} />
                <span>My Bookings</span>
              </button>
            )}

            {user.role === 'admin' && (
              <>
                <button 
                  className={`nav-btn ${activeTab === 'verification' ? 'active' : ''}`}
                  onClick={() => setActiveTab('verification')}
                >
                  <UserCheck size={16} />
                  <span>Verify Registrations</span>
                </button>
                <button 
                  className={`nav-btn ${activeTab === 'admin' ? 'active' : ''}`}
                  onClick={() => setActiveTab('admin')}
                >
                  <Shield size={16} />
                  <span>Admin Console</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* User Profile & Logout */}
        {user ? (
          <div className="nav-user">
            <div className="user-badge">
              <span className={`role-tag ${user.role}`}>
                {user.role === 'admin' ? '⚡ Admin' : '🎓 Student'}
              </span>
              <span className="user-name">{user.name}</span>
            </div>
            <button className="btn-logout" onClick={logout} title="Sign Out">
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <div className="nav-links">
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Demo Mode Ready</span>
          </div>
        )}
      </div>
    </nav>
  );
}
