import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import AuthPage from './pages/AuthPage';
import SeatMapPage from './pages/SeatMapPage';
import MyReservationsPage from './pages/MyReservationsPage';
import AdminPage from './pages/AdminPage';
import SeatVerificationPage from './pages/SeatVerificationPage';

function MainApp() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('floorplan'); // Default directly to interactive floor plan!
  const [currentFloorId, setCurrentFloorId] = useState(1);

  if (loading) {
    return (
      <div className="loading-state" style={{ minHeight: '100vh', justifyContent: 'center' }}>
        <div className="spinner"></div>
        <p>Initializing Central Library System...</p>
      </div>
    );
  }

  // Not logged in -> Show Auth Page
  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="app-shell">
      {/* Left Sidebar Navigation */}
      <Sidebar 
        currentFloorId={currentFloorId}
        onSelectFloor={(id) => setCurrentFloorId(id)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="app-main-content">
        {activeTab === 'floorplan' && (
          <SeatMapPage 
            currentFloorId={currentFloorId}
            onSelectFloor={setCurrentFloorId}
            onReservationSuccess={() => setActiveTab('my-reservations')}
          />
        )}

        {activeTab === 'my-reservations' && (
          <MyReservationsPage />
        )}

        {activeTab === 'verification' && user.role === 'admin' && (
          <SeatVerificationPage />
        )}

        {activeTab === 'admin' && user.role === 'admin' && (
          <AdminPage />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
