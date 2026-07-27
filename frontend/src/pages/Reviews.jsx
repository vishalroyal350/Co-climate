import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';

export default function Reviews() {
  const { currentUser, activeProjectId } = useContext(AuthContext);
  const [milestones, setMilestones] = useState([]);
  const [projects, setProjects] = useState([]);

  // Task Submission States
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [uploadedImages, setUploadedImages] = useState([]);

  const loadData = async () => {
    try {
      const ms = await api.milestones.getAll();
      setMilestones(ms);

      const projs = await api.projects.getAll();
      setProjects(projs);
    } catch (err) {
      console.warn('Unable to load milestones for review:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredMilestones = milestones.filter(m =>
    activeProjectId === 'all' || m.projectId === activeProjectId
  );

  const handleImagesChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const r = new FileReader();
      r.onload = (ev) => setUploadedImages([ev.target.result]);
      r.readAsDataURL(file);
    }
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    const updated = {
      ...activeItem,
      status: 'pending_manager_approval',
      remarks: remarks,
      submittedImages: uploadedImages
    };

    try {
      await api.milestones.save(updated);
      loadData();
      setIsSubmitOpen(false);
    } catch (err) {
      alert(`Error submitting milestone task: ${err.message}`);
    }
  };

  const openSubmitModal = (item) => {
    setActiveItem(item);
    setRemarks(item.remarks || '');
    setUploadedImages(item.submittedImages || []);
    setIsSubmitOpen(true);
  };

  return (
    <div id="view-reviews" className="app-view">
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3 border-0">
          <h5 className="mb-0 font-weight-bold text-success">
            <i className="bi bi-chat-right-quote-fill me-1"></i> Field Audit & Remarks Verification Console
          </h5>
        </div>
        <div className="card-body p-3">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
              <thead>
                <tr>
                  <th>Milestone Parameters</th>
                  <th>Project Restorations</th>
                  <th>Target Date</th>
                  <th>Milestone Status</th>
                  <th>Verification Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMilestones.length === 0 ? (
                  <tr><td colSpan="6" className="text-center text-muted py-4">No milestones mapped</td></tr>
                ) : (
                  filteredMilestones.map((m) => {
                    const proj = projects.find(p => p.id === m.projectId) || {};
                    return (
                      <tr key={m.id}>
                        <td className="fw-semibold">{m.name}</td>
                        <td>{proj.name || 'Unknown'}</td>
                        <td>{m.endDate || m.target || 'N/A'}</td>
                        <td><span className="badge bg-secondary text-capitalize">{m.status}</span></td>
                        <td>
                          {m.status === 'completed' ? (
                            <span className="text-success"><i className="bi bi-patch-check-fill"></i> Verified</span>
                          ) : (
                            <span className="text-warning">Pending Checklist Verification</span>
                          )}
                        </td>
                        <td className="text-end">
                          {m.status !== 'completed' ? (
                            <button type="button" className="btn btn-sm btn-success py-1 px-3" onClick={() => openSubmitModal(m)}>
                              <i className="bi bi-shield-check"></i> Verify & Sign
                            </button>
                          ) : (
                            <span className="badge bg-light text-dark border">Completed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FO Complete Task Modal */}
      {isSubmitOpen && activeItem && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <form onSubmit={handleTaskSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title font-weight-bold text-success">Verify & Sign: "{activeItem.name}"</h5>
                  <button type="button" className="btn-close" onClick={() => setIsSubmitOpen(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Auditor Remarks</label>
                    <textarea className="form-control" rows="2" required placeholder="Write verification notes..." value={remarks} onChange={(e) => setRemarks(e.target.value)}></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Camera Capture / Upload</label>
                    <input type="file" className="form-control" onChange={handleImagesChange} accept="image/*" />
                    {uploadedImages.length > 0 && (
                      <img src={uploadedImages[0]} className="img-thumbnail mt-2" style={{ maxHeight: '100px' }} alt="preview" />
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsSubmitOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-success btn-sm">Submit Verification</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
