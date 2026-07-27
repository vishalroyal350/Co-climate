import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';

export default function UserManagement() {
  const { currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  // Edit modal states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editRole, setEditRole] = useState('field_officer');
  const [editProjId, setEditProjId] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const usersData = await api.auth.getUsers();
      setUsers(usersData);
      const projData = await api.projects.getAll();
      setProjects(projData);
    } catch (err) {
      console.warn('Failed to load user management data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEditClick = (u) => {
    setSelectedUser(u);
    setEditRole(u.role || 'field_officer');
    setEditProjId(u.projectId || '');
    setIsEditOpen(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const updated = {
        ...selectedUser,
        role: editRole,
        projectId: editProjId
      };
      await api.auth.updateUser(selectedUser.id, updated);
      loadData();
      setIsEditOpen(false);
    } catch (err) {
      alert('Failed to update user: ' + err.message);
    }
  };

  const handleDeleteUser = async (id) => {
    if (id === currentUser?.id) {
      alert('You cannot delete your own session account.');
      return;
    }
    if (!confirm('Are you sure you want to delete this user account permanently?')) return;
    try {
      await api.auth.deleteUser(id);
      loadData();
    } catch (err) {
      alert('Failed to delete user: ' + err.message);
    }
  };

  const getFormatRole = (role) => {
    if (role === 'admin') return 'System Admin';
    if (role === 'manager') return 'Project Manager';
    if (role === 'field_officer') return 'Field Officer';
    return role || '';
  };

  return (
    <div id="view-user-management" className="app-view">
      <div className="row justify-content-center">
        <div className="col-xl-9 col-lg-11 col-12">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-3 border-0">
              <h5 className="mb-0 font-weight-bold text-success">
                <i className="bi bi-people-fill me-2"></i> User Access Management Console
              </h5>
            </div>
            
            <div className="card-body p-3">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-success" role="status">
                    <span className="visually-hidden">Syncing users...</span>
                  </div>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
                    <thead>
                      <tr>
                        <th>User Name</th>
                        <th>Email Address</th>
                        <th>Role</th>
                        <th>Designation / Dept</th>
                        <th>Contact Phone</th>
                        <th>Assigned Project ID</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr><td colSpan="7" className="text-center text-muted py-4">No users registered in system</td></tr>
                      ) : (
                        users.map(u => (
                          <tr key={u.id}>
                            <td>
                              <span className="fw-bold text-success-dark d-block">{u.name || 'Unnamed User'}</span>
                              {u.id === currentUser?.id && <span className="badge bg-secondary py-0.5 px-2">Your Account</span>}
                            </td>
                            <td>{u.email}</td>
                            <td>
                              <span className={`badge ${u.role === 'admin' ? 'bg-danger' : (u.role === 'manager' ? 'bg-success' : 'bg-primary')} text-capitalize`}>
                                {getFormatRole(u.role)}
                              </span>
                            </td>
                            <td>
                              <span className="d-block">{u.designation || 'Staff'}</span>
                              <small className="text-muted d-block">{u.department || 'Operations'}</small>
                            </td>
                            <td>{u.phone || 'N/A'}</td>
                            <td>
                              <code>{u.projectId || 'all'}</code>
                            </td>
                            <td className="text-end">
                              <div className="d-flex justify-content-end gap-1">
                                <button className="btn btn-sm btn-outline-success p-1" title="Edit Access Role" onClick={() => handleEditClick(u)}>
                                  <i className="bi bi-pencil" style={{ fontSize: '11px' }}></i>
                                </button>
                                <button className="btn btn-sm btn-outline-danger p-1" title="Delete User" onClick={() => handleDeleteUser(u.id)}>
                                  <i className="bi bi-trash" style={{ fontSize: '11px' }}></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit User Modal */}
      {isEditOpen && selectedUser && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content animate-slide-up">
              <form onSubmit={handleUpdateUser}>
                <div className="modal-header">
                  <h5 className="modal-title font-weight-bold text-success">Edit Permissions: {selectedUser.name}</h5>
                  <button type="button" className="btn-close" onClick={() => setIsEditOpen(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Email Account</label>
                    <input type="text" className="form-control" disabled value={selectedUser.email} />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Assign System Access Role</label>
                    <select className="form-select" value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                      <option value="field_officer">Field Officer</option>
                      <option value="manager">Project Manager</option>
                      <option value="admin">System Admin</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Assign Project Scope ID</label>
                    <select className="form-select" value={editProjId} onChange={(e) => setEditProjId(e.target.value)}>
                      <option value="all">All Projects (Global)</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsEditOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-success btn-sm">Save Access Rules</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
