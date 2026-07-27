import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';

export default function Alerts() {
  const { currentUser } = useContext(AuthContext);
  const [alerts, setAlerts] = useState([]);

  const loadAlerts = async () => {
    try {
      const data = await api.alerts.getAll();
      
      // Filter alerts if they are targeted to a specific role or user
      const filtered = data.filter(al => {
        if (al.userId && al.userId !== currentUser?.id) return false;
        if (al.role && al.role !== currentUser?.role) return false;
        return true;
      });

      setAlerts(filtered);
    } catch (err) {
      console.warn('Unable to load alerts registry:', err);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [currentUser]);

  const handleMarkAsRead = async (id) => {
    const item = alerts.find(a => a.id === id);
    if (!item) return;
    try {
      await api.alerts.save({ ...item, status: 'read' });
      loadAlerts();
    } catch (err) {
      alert(`Error updating alert: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.alerts.delete(id);
      loadAlerts();
    } catch (err) {
      alert(`Error deleting alert: ${err.message}`);
    }
  };

  const getPriorityBadge = (prio) => {
    if (prio === 'high') return 'bg-danger';
    if (prio === 'low') return 'bg-info';
    return 'bg-warning text-dark';
  };

  return (
    <div id="view-alerts" className="app-view">
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3 border-0">
          <h5 className="mb-0 font-weight-bold text-success">
            <i className="bi bi-bell-fill me-2"></i> Central Notifications & Alerts console
          </h5>
        </div>
        <div className="card-body p-3">
          {alerts.length === 0 ? (
            <div className="text-center text-muted py-5">
              <i className="bi bi-bell-slash text-muted" style={{ fontSize: '48px' }}></i>
              <h6 className="mt-3">No active notifications recorded</h6>
              <p className="small">Field milestone updates, report approvals, or low sapling survival rates trigger system alerts.</p>
            </div>
          ) : (
            <div className="list-group">
              {alerts.map((al) => {
                const borderClass = al.priority === 'high' ? 'border-left-danger' : 'border-left-warning';
                return (
                  <div 
                    key={al.id} 
                    className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center mb-2 border rounded shadow-sm ${borderClass} ${al.status === 'unread' ? 'bg-light' : ''}`}
                  >
                    <div>
                      <div className="d-flex align-items-center gap-2">
                        <h6 className="mb-0 fw-bold">{al.type}</h6>
                        {al.status === 'unread' && (
                          <span className="badge bg-danger rounded-pill" style={{ fontSize: '9px' }}>New</span>
                        )}
                        <span className={`badge ${getPriorityBadge(al.priority)}`} style={{ fontSize: '9px', textTransform: 'uppercase' }}>
                          {al.priority}
                        </span>
                      </div>
                      <p className="mb-1 text-secondary small mt-1">{al.message}</p>
                      <small className="text-muted" style={{ fontSize: '11px' }}><i className="bi bi-clock-history"></i> Date: {al.date || 'Today'}</small>
                    </div>
                    <div className="d-flex gap-2">
                      {al.status === 'unread' && (
                        <button type="button" className="btn btn-sm btn-outline-success py-1 px-3" onClick={() => handleMarkAsRead(al.id)}>
                          <i className="bi bi-check-lg"></i> Read
                        </button>
                      )}
                      <button type="button" className="btn btn-sm btn-outline-danger p-1" onClick={() => handleDelete(al.id)}>
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
