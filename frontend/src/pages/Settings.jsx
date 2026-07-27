import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Settings() {
  const { currentUser } = useContext(AuthContext);

  const formatRoleName = (role) => {
    if (role === 'admin') return 'Admin';
    if (role === 'manager') return 'Project Manager';
    if (role === 'field_officer') return 'Field Officer';
    return role || '';
  };

  return (
    <div id="view-settings" className="app-view">
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3 border-0">
          <h5 className="mb-0 font-weight-bold text-success">
            <i className="bi bi-person-circle me-1"></i> User Profile & Settings Parameters
          </h5>
        </div>
        <div className="card-body">
          <div className="row g-4">
            <div className="col-md-4 text-center border-end">
              <span className="avatar bg-success text-white fw-bold rounded-circle d-inline-flex align-items-center justify-content-center mb-3 shadow" style={{ width: '100px', height: '100px', fontSize: '36px' }}>
                {currentUser?.avatar || 'U'}
              </span>
              <h4>{currentUser?.name || 'User'}</h4>
              <p className="text-muted text-capitalize mb-2">{formatRoleName(currentUser?.role)}</p>
              <span className="badge bg-success rounded-pill px-3 py-1 text-uppercase">{currentUser?.department || 'Operations'}</span>
            </div>
            <div className="col-md-8">
              <form onSubmit={(e) => { e.preventDefault(); alert("Profile settings saved successfully (Simulation)!"); }}>
                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="form-label">Full Name</label>
                    <input type="text" className="form-control" defaultValue={currentUser?.name} readOnly disabled />
                  </div>
                  <div className="col-6">
                    <label className="form-label">Registered Email</label>
                    <input type="email" className="form-control" defaultValue={currentUser?.email} readOnly disabled />
                  </div>
                </div>
                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="form-label">User Security Token ID</label>
                    <input type="text" className="form-control" value={currentUser?.id || ''} readOnly disabled />
                  </div>
                  <div className="col-6">
                    <label className="form-label">Session Status</label>
                    <input type="text" className="form-control text-success fw-bold" value="Authenticated & Online" readOnly disabled />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary-green">Save Profile Settings</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
