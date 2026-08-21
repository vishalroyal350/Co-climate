import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';

export default function DashboardLayout({ children, activeView, setActiveView, unreadAlertsCount = 0 }) {
  const { currentUser, logout, activeProjectId } = useContext(AuthContext);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeProjectName, setActiveProjectName] = useState('Project Dashboard');

  useEffect(() => {
    const fetchActiveProject = async () => {
      try {
        const projs = await api.projects.getAll();
        const activeProj = projs.find(p => p.id === activeProjectId);
        if (activeProj) {
          setActiveProjectName(activeProj.name);
        } else {
          setActiveProjectName('Project Dashboard');
        }
      } catch (err) {
        console.warn('DashboardLayout project fetch failed:', err);
      }
    };
    fetchActiveProject();
  }, [activeProjectId]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('coclimate_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('coclimate_theme', nextTheme);
  };

  const isRole = (roles) => roles.includes(currentUser?.role);

  const formatRoleName = (role) => {
    if (role === 'admin') return 'Admin';
    if (role === 'manager') return 'Project Manager';
    if (role === 'field_officer') return 'Field Officer';
    if (role === 'user') return 'Standard User';
    return role || '';
  };

  const getNavbarTitle = () => {
    if (activeView === 'dashboard') return activeProjectName;
    if (activeView === 'projects-sites') return 'Project Details';
    if (activeView === 'monitoring') return 'Monitoring';
    if (activeView === 'milestones') return 'Milestones';
    if (activeView === 'reports') return 'Reports';
    if (activeView === 'drone') return 'Drone Monitoring';
    if (activeView === 'alerts') return 'Alerts';
    if (activeView === 'reviews') return 'Review & Remarks';
    if (activeView === 'performance') return 'Performance';
    if (activeView === 'settings') return 'Settings';
    return activeView.charAt(0).toUpperCase() + activeView.slice(1);
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`} id="sidebar">
        <div className="sidebar-brand">
          <a href="#dashboard" onClick={() => setActiveView('dashboard')} className="brand-link d-flex align-items-center gap-2">
            <img src="/icons/logo.jpg" alt="Co-Climate Logo" style={{ height: '32px', width: '32px', objectFit: 'contain', borderRadius: '50%' }} />
            <span>Co-Climate</span>
          </a>
          <button className="brand-toggle" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <ul className="sidebar-menu">
          <li className="sidebar-item">
            <a href="#dashboard" className={`sidebar-link ${activeView === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveView('dashboard')}>
              <i className="bi bi-grid-1x2-fill"></i>
              <span>Dashboard</span>
            </a>
          </li>
          <li className="sidebar-item">
            <a href="#projects-sites" className={`sidebar-link ${activeView === 'projects-sites' ? 'active' : ''}`} onClick={() => setActiveView('projects-sites')}>
              <i className="bi bi-tree"></i>
              <span>Project Details</span>
            </a>
          </li>
          {isRole(['manager', 'admin']) && (
            <li className="sidebar-item">
              <a href="#monitoring" className={`sidebar-link ${activeView === 'monitoring' ? 'active' : ''}`} onClick={() => setActiveView('monitoring')}>
                <i className="bi bi-journal-check"></i>
                <span>Monitoring</span>
              </a>
            </li>
          )}
          <li className="sidebar-item">
            <a href="#milestones" className={`sidebar-link ${activeView === 'milestones' ? 'active' : ''}`} onClick={() => setActiveView('milestones')}>
              <i className="bi bi-flag"></i>
              <span>Milestones</span>
            </a>
          </li>
          {isRole(['manager', 'admin', 'field_officer']) && (
            <li className="sidebar-item">
              <a href="#reports" className={`sidebar-link ${activeView === 'reports' ? 'active' : ''}`} onClick={() => setActiveView('reports')}>
                <i className="bi bi-file-earmark-bar-graph"></i>
                <span>Reports</span>
              </a>
            </li>
          )}
          <li className="sidebar-item">
            <a href="#drone" className={`sidebar-link ${activeView === 'drone' ? 'active' : ''}`} onClick={() => setActiveView('drone')}>
              <i className="bi bi-airplane-engines"></i>
              <span>{isRole(['field_officer']) ? 'Scene Overview (Drones)' : 'Drone Monitoring'}</span>
            </a>
          </li>
          <li className="sidebar-item">
            <a href="#alerts" className={`sidebar-link ${activeView === 'alerts' ? 'active' : ''}`} onClick={() => setActiveView('alerts')}>
              <i className="bi bi-bell"></i>
              <span>Alerts</span>
              {unreadAlertsCount > 0 && (
                <span className="badge bg-danger rounded-pill ms-auto py-1 px-2">{unreadAlertsCount}</span>
              )}
            </a>
          </li>
          {isRole(['field_officer']) && (
            <>
              <li className="sidebar-item">
                <a href="#reviews" className={`sidebar-link ${activeView === 'reviews' ? 'active' : ''}`} onClick={() => setActiveView('reviews')}>
                  <i className="bi bi-chat-left-text"></i>
                  <span>Review & Remarks</span>
                </a>
              </li>
              <li className="sidebar-item">
                <a href="#performance" className={`sidebar-link ${activeView === 'performance' ? 'active' : ''}`} onClick={() => setActiveView('performance')}>
                  <i className="bi bi-speedometer2"></i>
                  <span>Performance</span>
                </a>
              </li>
            </>
          )}
          {isRole(['manager', 'admin']) && (
            <li className="sidebar-item">
              <a href="#user-management" className={`sidebar-link ${activeView === 'user-management' ? 'active' : ''}`} onClick={() => setActiveView('user-management')}>
                <i className="bi bi-people"></i>
                <span>User Management Console</span>
              </a>
            </li>
          )}
          <li className="sidebar-item">
            <a href="#settings" className={`sidebar-link ${activeView === 'settings' ? 'active' : ''}`} onClick={() => setActiveView('settings')}>
              <i className="bi bi-gear"></i>
              <span>Settings</span>
            </a>
          </li>
        </ul>

        <div className="sidebar-footer border-top mt-auto p-3 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2 overflow-hidden">
            <span className="avatar bg-success text-white fw-bold rounded-circle d-flex align-items-center justify-content-center" style={{ width: '35px', height: '35px', flexShrink: 0 }}>
              {currentUser?.avatar || 'U'}
            </span>
            <div className="user-info text-truncate">
              <h6 className="mb-0 text-white text-truncate" style={{ fontSize: '13px' }}>{currentUser?.name || 'User'}</h6>
              <small className="text-muted text-capitalize d-block text-truncate" style={{ fontSize: '11px' }}>{formatRoleName(currentUser?.role)}</small>
            </div>
          </div>
          <button className="btn btn-link text-white p-0" onClick={logout} title="Log Out">
            <i className="bi bi-box-arrow-right" style={{ fontSize: '18px' }}></i>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-wrapper">
        <header className="top-header">
          <div className="d-flex align-items-center gap-3">
            <button className="btn btn-outline-secondary btn-sm d-md-none" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
              <i className="bi bi-list"></i>
            </button>
            <div>
              <h4 className="mb-0 font-weight-bold" id="page-title">{getNavbarTitle()}</h4>
              <div className="text-muted" id="page-subtitle">
                {activeView === 'dashboard' ? (
                  <div className="d-flex flex-wrap align-items-center gap-3 mt-1" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <span><i className="bi bi-person-badge text-success"></i> Role: <strong>{formatRoleName(currentUser?.role)}</strong></span>
                    <span><i className="bi bi-calendar-event text-success"></i> Date: <strong>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</strong></span>
                  </div>
                ) : (
                  <span style={{ fontSize: '12px' }}>Forestry Monitoring System &raquo; {getNavbarTitle()} Registry</span>
                )}
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3">
            <button className="btn btn-outline-secondary btn-sm rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }} onClick={toggleTheme} title="Toggle Light/Dark Theme">
              <i className="bi bi-brightness-high"></i>
            </button>
          </div>
        </header>

        <div className="content-body p-4">
          {children}
        </div>

        <footer className="app-footer">
          <span>&copy; {new Date().getFullYear()} Co-Climate Forest restoration & drone monitoring system. All rights reserved.</span>
        </footer>
      </main>
    </div>
  );
}
