import React, { useContext, useEffect, useState } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import ProjectDetails from './pages/ProjectDetails';
import Monitoring from './pages/Monitoring';
import Milestones from './pages/Milestones';
import Reports from './pages/Reports';
import Drones from './pages/Drones';
import Alerts from './pages/Alerts';
import Reviews from './pages/Reviews';
import Settings from './pages/Settings';
import Performance from './pages/Performance';
import UserManagement from './pages/UserManagement';
import { api } from './services/api';

function MainApp() {
  const { currentUser, loading } = useContext(AuthContext);
  const [activeView, setActiveView] = useState('dashboard');
  const [unreadCount, setUnreadCount] = useState(0);

  // Poll notifications count periodically or load on view change
  const loadUnreadCount = async () => {
    if (!currentUser) return;
    try {
      const data = await api.alerts.getAll();
      const filtered = data.filter(al => {
        if (al.userId && al.userId !== currentUser.id) return false;
        if (al.role && al.role !== currentUser.role) return false;
        return al.status === 'unread';
      });
      setUnreadCount(filtered.length);
    } catch (err) {
      console.warn('Failed to load notifications count:', err);
    }
  };

  useEffect(() => {
    if (loading) return;
    
    const token = sessionStorage.getItem('coclimate_token');
    const user = sessionStorage.getItem('coclimate_user');
    
    if (!token || !user) {
      window.location.href = 'login.html';
      return;
    }

    loadUnreadCount();

    // Check hash for routing
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        setActiveView(hash);
      } else {
        setActiveView('dashboard');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    // Periodic check for notifications
    const interval = setInterval(loadUnreadCount, 15000);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      clearInterval(interval);
    };
  }, [loading, currentUser, activeView]);

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ height: '100vh', backgroundColor: 'var(--bg-primary)' }}>
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading Co-Climate...</span>
        </div>
      </div>
    );
  }

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'projects-sites':
        return <ProjectDetails />;
      case 'monitoring':
        return <Monitoring />;
      case 'milestones':
        return <Milestones />;
      case 'reports':
        return <Reports />;
      case 'drone':
        return <Drones />;
      case 'alerts':
        return <Alerts />;
      case 'reviews':
        return <Reviews />;
      case 'performance':
        return <Performance />;
      case 'user-management':
        return <UserManagement />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <DashboardLayout 
      activeView={activeView} 
      setActiveView={setActiveView} 
      unreadAlertsCount={unreadCount}
    >
      {renderActiveView()}
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
