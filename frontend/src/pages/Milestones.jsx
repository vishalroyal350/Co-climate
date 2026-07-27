import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';

export default function Milestones() {
  const { currentUser, activeProjectId } = useContext(AuthContext);
  const [milestones, setMilestones] = useState([]);
  const [projects, setProjects] = useState([]);
  const [fieldOfficers, setFieldOfficers] = useState([]);
  const [activeTab, setActiveTab] = useState('checklist'); // 'checklist', 'evaluation'

  // Modal controls
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isEvaluateOpen, setIsEvaluateOpen] = useState(false);

  // Form states (Create/Edit Milestone)
  const [msMode, setMsMode] = useState('add');
  const [formMsId, setFormMsId] = useState('');
  const [formMsName, setFormMsName] = useState('');
  const [formMsDescription, setFormMsDescription] = useState('');
  const [formMsProjectId, setFormMsProjectId] = useState('');
  const [formMsStart, setFormMsStart] = useState('');
  const [formMsEnd, setFormMsEnd] = useState('');
  const [formMsOutputType, setFormMsOutputType] = useState('Direct Upload');
  const [formMsFrequency, setFormMsFrequency] = useState('Weekly');
  const [formMsStatus, setFormMsStatus] = useState('upcoming');
  const [formMsRemarks, setFormMsRemarks] = useState('');
  const [formMsOfficer, setFormMsOfficer] = useState('');

  // Submit task states (Field Officer)
  const [activeMsItem, setActiveMsItem] = useState(null);
  const [submitRemarks, setSubmitRemarks] = useState(''); // Special Notes
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [uploadedVideos, setUploadedVideos] = useState([]);

  // Evaluation states (Project Manager)
  const [evalScore, setEvalScore] = useState('Good'); // 'Good', 'Moderate', 'Needs Attention'
  const [evalRemarks, setEvalRemarks] = useState('');

  const isRole = (roles) => roles.includes(currentUser?.role);

  const loadData = async () => {
    try {
      const msData = await api.milestones.getAll();
      setMilestones(msData);

      const projData = await api.projects.getAll();
      setProjects(projData);

      const users = await api.auth.getUsers();
      setFieldOfficers(users.filter(u => u.role === 'field_officer'));
    } catch (err) {
      console.warn('Unable to load milestones:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredMilestones = milestones.filter(m => 
    activeProjectId === 'all' || m.projectId === activeProjectId
  );

  const evaluatedMilestones = milestones.filter(m => 
    m.assignedOfficer === currentUser?.name && 
    (m.status === 'completed' || m.status === 'rejected') && 
    (m.score || m.remarks)
  );

  const filteredProjects = projects.filter(p =>
    activeProjectId === 'all' || p.id === activeProjectId
  );

  // File Upload Handlers
  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(f => {
      const r = new FileReader();
      r.onload = (ev) => setUploadedImages(prev => [...prev, ev.target.result]);
      r.readAsDataURL(f);
    });
  };

  const handleDocsChange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(f => {
      const r = new FileReader();
      r.onload = (ev) => setUploadedDocs(prev => [...prev, ev.target.result]);
      r.readAsDataURL(f);
    });
  };

  const handleVideosChange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(f => {
      const r = new FileReader();
      r.onload = (ev) => setUploadedVideos(prev => [...prev, ev.target.result]);
      r.readAsDataURL(f);
    });
  };

  // PM Save Milestone (Create/Edit)
  const handleMilestoneSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      id: formMsId || `ms-${Date.now()}`,
      name: formMsName,
      description: formMsDescription,
      projectId: formMsProjectId,
      target: formMsEnd, // backward compatibility target date
      startDate: formMsStart,
      endDate: formMsEnd,
      outputType: formMsOutputType,
      frequency: formMsFrequency,
      status: formMsStatus,
      remarks: formMsRemarks,
      assignedOfficer: formMsOfficer,
      score: msMode === 'add' ? '' : undefined // preserve score on edit
    };

    try {
      await api.milestones.save(payload);
      loadData();
      setIsFormOpen(false);
    } catch (err) {
      alert(`Error saving milestone: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this milestone?')) return;
    try {
      await api.milestones.delete(id);
      loadData();
    } catch (err) {
      alert(`Error deleting milestone: ${err.message}`);
    }
  };

  // Field Officer Submit Task completion
  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    const updated = {
      ...activeMsItem,
      status: 'pending_manager_approval',
      remarks: submitRemarks, // Special Notes
      submittedImages: uploadedImages,
      submittedDocuments: uploadedDocs,
      submittedVideos: uploadedVideos
    };

    try {
      await api.milestones.save(updated);
      loadData();
      setIsSubmitOpen(false);
    } catch (err) {
      alert(`Error submitting milestone task: ${err.message}`);
    }
  };

  // PM Evaluate Submit (Approve / Reject)
  const handleEvaluationSubmit = async (decision) => {
    const updated = {
      ...activeMsItem,
      status: decision === 'approve' ? 'completed' : 'rejected',
      score: evalScore,
      remarks: evalRemarks,
      completion: decision === 'approve' ? new Date().toISOString().split('T')[0] : ''
    };

    try {
      await api.milestones.save(updated);
      loadData();
      setIsEvaluateOpen(false);
    } catch (err) {
      alert(`Error saving milestone evaluation: ${err.message}`);
    }
  };

  const openFormModal = (mode, item = null) => {
    setMsMode(mode);
    if (mode === 'add') {
      setFormMsId('');
      setFormMsName('');
      setFormMsDescription('');
      setFormMsProjectId(filteredProjects[0]?.id || '');
      setFormMsStart('');
      setFormMsEnd('');
      setFormMsOutputType('Direct Upload');
      setFormMsFrequency('Weekly');
      setFormMsStatus('upcoming');
      setFormMsRemarks('');
      setFormMsOfficer('');
    } else if (item) {
      setFormMsId(item.id);
      setFormMsName(item.name || '');
      setFormMsDescription(item.description || '');
      setFormMsProjectId(item.projectId || '');
      setFormMsStart(item.startDate || '');
      setFormMsEnd(item.endDate || item.target || '');
      setFormMsOutputType(item.outputType || 'Direct Upload');
      setFormMsFrequency(item.frequency || 'Weekly');
      setFormMsStatus(item.status || 'upcoming');
      setFormMsRemarks(item.remarks || '');
      setFormMsOfficer(item.assignedOfficer || '');
    }
    setIsFormOpen(true);
  };

  const openSubmitModal = (item) => {
    setActiveMsItem(item);
    setSubmitRemarks('');
    setUploadedImages([]);
    setUploadedDocs([]);
    setUploadedVideos([]);
    setIsSubmitOpen(true);
  };

  const openEvaluateModal = (item) => {
    setActiveMsItem(item);
    setEvalScore('Good');
    setEvalRemarks(item.remarks || '');
    setIsEvaluateOpen(true);
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'completed') return 'bg-success';
    if (status === 'pending_manager_approval') return 'bg-warning text-dark';
    if (status === 'rejected') return 'bg-danger';
    return 'bg-secondary';
  };

  const getDisplayStatus = (status) => {
    if (status === 'completed') return 'Approved';
    if (status === 'pending_manager_approval') return 'Submitted';
    if (status === 'rejected') return 'Rejected';
    return 'Pending';
  };

  return (
    <div id="view-milestones" className="app-view">
      {/* Alert Messages for Field Officer */}
      {isRole(['field_officer']) && evaluatedMilestones.length > 0 && (
        <div className="mb-4">
          {evaluatedMilestones.map(m => (
            <div key={m.id} className={`alert alert-${m.status === 'completed' ? 'success' : 'danger'} alert-dismissible fade show shadow-sm border-2`} role="alert" style={{ borderRadius: '10px' }}>
              <div className="d-flex align-items-center gap-2">
                <i className={`bi ${m.status === 'completed' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} fs-5`}></i>
                <div>
                  <strong className="d-block" style={{ fontSize: '14px' }}>Milestone Evaluated: "{m.name}"</strong>
                  <span style={{ fontSize: '13px' }}>
                    Status: <strong>{m.status === 'completed' ? 'Approved' : 'Rejected'}</strong> | 
                    Score: <span className="badge bg-dark ms-1 me-2">{m.score || 'N/A'}</span>
                    Remarks: <em>"{m.remarks || 'No feedback'}"</em>
                  </span>
                </div>
              </div>
              <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      {isRole(['manager', 'admin']) && (
        <ul className="nav nav-pills mb-4 gap-2 border-bottom pb-3">
          <li className="nav-item">
            <button className={`nav-link px-4 ${activeTab === 'checklist' ? 'active bg-success' : 'text-success fw-bold'}`} onClick={() => setActiveTab('checklist')}>
              <i className="bi bi-plus-circle me-1"></i> Create Milestone
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link px-4 ${activeTab === 'evaluation' ? 'active bg-success' : 'text-success fw-bold'}`} onClick={() => setActiveTab('evaluation')}>
              <i className="bi bi-shield-check me-1"></i> Evaluate Submission
              {filteredMilestones.filter(m => m.status === 'pending_manager_approval').length > 0 && (
                <span className="badge bg-danger ms-2">{filteredMilestones.filter(m => m.status === 'pending_manager_approval').length}</span>
              )}
            </button>
          </li>
        </ul>
      )}

      {/* Tab: Create Milestone / Checklist */}
      {activeTab === 'checklist' && (
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white py-3 border-0 d-flex justify-content-between align-items-center">
            <h5 className="mb-0 font-weight-bold text-success">
              <i className="bi bi-list-task me-1"></i> Milestones Management Checklist
            </h5>
            {isRole(['manager', 'admin']) && (
              <button className="btn btn-primary-green btn-sm" onClick={() => openFormModal('add')}>
                <i className="bi bi-plus-lg me-1"></i> New Milestone
              </button>
            )}
          </div>
          
          <div className="card-body p-3">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th>Milestone Name</th>
                    <th>Frequency</th>
                    <th>Assigned Officer</th>
                    <th>Duration</th>
                    <th>Task Output</th>
                    <th>Status</th>
                    <th>Score / Remarks</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMilestones.length === 0 ? (
                    <tr><td colSpan="8" className="text-center text-muted py-4">No milestones logged</td></tr>
                  ) : (
                    filteredMilestones.map(m => (
                      <tr key={m.id}>
                        <td>
                          <span className="fw-bold text-success-dark d-block">{m.name}</span>
                          <small className="text-muted">{m.description}</small>
                        </td>
                        <td>
                          <span className="badge bg-light text-success border">{m.frequency || 'Weekly'}</span>
                        </td>
                        <td>{m.assignedOfficer || <span className="text-muted italic">Unassigned</span>}</td>
                        <td>
                          <small className="text-muted d-block">Start: {m.startDate || 'N/A'}</small>
                          <small className="text-muted d-block">End: {m.endDate || m.target}</small>
                        </td>
                        <td>{m.outputType}</td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(m.status)}`}>
                            {getDisplayStatus(m.status)}
                          </span>
                        </td>
                        <td>
                          {m.score ? (
                            <span className="badge bg-success bg-opacity-10 text-success border border-success me-1">
                              Rating: {m.score}
                            </span>
                          ) : null}
                          <small className="text-secondary d-block">{m.remarks || 'No remarks'}</small>
                        </td>
                        <td className="text-end">
                          <div className="d-flex justify-content-end gap-1">
                            {isRole(['field_officer']) && m.status !== 'completed' && (
                              <button className="btn btn-sm btn-success py-1 px-3" onClick={() => openSubmitModal(m)}>
                                <i className="bi bi-cloud-arrow-up-fill me-1"></i> Complete Task
                              </button>
                            )}
                            {isRole(['manager', 'admin']) && (
                              <>
                                <button className="btn btn-sm btn-outline-success p-1" onClick={() => openFormModal('edit', m)}>
                                  <i className="bi bi-pencil" style={{ fontSize: '11px' }}></i>
                                </button>
                                <button className="btn btn-sm btn-outline-danger p-1" onClick={() => handleDelete(m.id)}>
                                  <i className="bi bi-trash" style={{ fontSize: '11px' }}></i>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Evaluate Submission Queue */}
      {activeTab === 'evaluation' && (
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white py-3 border-0">
            <h5 className="mb-0 font-weight-bold text-success">
              <i className="bi bi-shield-check me-1"></i> Officer Submissions Evaluation Queue
            </h5>
          </div>
          <div className="card-body p-3">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th>Milestone Name</th>
                    <th>Field Officer</th>
                    <th>Special Notes / Remarks</th>
                    <th>Uploaded Outputs</th>
                    <th className="text-end">Evaluation Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMilestones.filter(m => m.status === 'pending_manager_approval').length === 0 ? (
                    <tr><td colSpan="5" className="text-center text-muted py-4">No submissions pending evaluation</td></tr>
                  ) : (
                    filteredMilestones.filter(m => m.status === 'pending_manager_approval').map(m => (
                      <tr key={m.id}>
                        <td>
                          <span className="fw-bold text-success-dark d-block">{m.name}</span>
                          <small className="text-muted">{m.description}</small>
                        </td>
                        <td>{m.assignedOfficer}</td>
                        <td>{m.remarks || <span className="text-muted italic">No notes</span>}</td>
                        <td>
                          <div className="d-flex flex-wrap gap-1">
                            {m.submittedImages?.map((img, idx) => (
                              <a href={img} target="_blank" rel="noreferrer" key={idx}>
                                <img src={img} alt="FO Output" className="img-thumbnail" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                              </a>
                            ))}
                            {m.submittedDocuments?.length > 0 && <span className="badge bg-light text-primary border"><i className="bi bi-file-earmark-text"></i> Doc Uploaded</span>}
                            {m.submittedVideos?.length > 0 && <span className="badge bg-light text-danger border"><i className="bi bi-play-btn"></i> Video Uploaded</span>}
                          </div>
                        </td>
                        <td className="text-end">
                          <button className="btn btn-sm btn-success py-1 px-3" onClick={() => openEvaluateModal(m)}>
                            Evaluate & Grade
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create/Edit Milestone */}
      {isFormOpen && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <form onSubmit={handleMilestoneSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title font-weight-bold text-success">
                    {msMode === 'add' ? 'New Milestone Details' : 'Modify Milestone Parameters'}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setIsFormOpen(false)}></button>
                </div>
                <div className="modal-body" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                  
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Milestone Name</label>
                    <input type="text" className="form-control" required value={formMsName} onChange={(e) => setFormMsName(e.target.value)} placeholder="e.g. Weekly Sapling Census" />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Description</label>
                    <textarea className="form-control" rows="2" value={formMsDescription} onChange={(e) => setFormMsDescription(e.target.value)} placeholder="Task details..."></textarea>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Project Restoration Units</label>
                    <select className="form-select" required value={formMsProjectId} onChange={(e) => setFormMsProjectId(e.target.value)}>
                      {filteredProjects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Assign Field Officer</label>
                    <select className="form-select" required value={formMsOfficer} onChange={(e) => setFormMsOfficer(e.target.value)}>
                      <option value="">Unassigned</option>
                      {fieldOfficers.map(fo => (
                        <option key={fo.id} value={fo.name}>{fo.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold">Start Date</label>
                      <input type="date" className="form-control" required value={formMsStart} onChange={(e) => setFormMsStart(e.target.value)} />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold">Deadline Date</label>
                      <input type="date" className="form-control" required value={formMsEnd} onChange={(e) => setFormMsEnd(e.target.value)} />
                    </div>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold">Frequency</label>
                      <select className="form-select" value={formMsFrequency} onChange={(e) => setFormMsFrequency(e.target.value)}>
                        <option value="Weekly">Weekly</option>
                        <option value="Monthly">Monthly</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold">Output Type Needed</label>
                      <select className="form-select" value={formMsOutputType} onChange={(e) => setFormMsOutputType(e.target.value)}>
                        <option value="Direct Upload">Direct Upload</option>
                        <option value="Camera Capture">Camera Capture</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Milestone Initial Status</label>
                    <select className="form-select" value={formMsStatus} onChange={(e) => setFormMsStatus(e.target.value)}>
                      <option value="upcoming">Pending / Upcoming</option>
                      <option value="in_progress">In Progress</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Initial Remarks</label>
                    <input type="text" className="form-control" value={formMsRemarks} onChange={(e) => setFormMsRemarks(e.target.value)} />
                  </div>

                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsFormOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary-green btn-sm">Save Milestone</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: FO Complete Task */}
      {isSubmitOpen && activeMsItem && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content animate-slide-up">
              <form onSubmit={handleTaskSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title font-weight-bold text-success">Complete Milestone Task: "{activeMsItem.name}"</h5>
                  <button type="button" className="btn-close" onClick={() => setIsSubmitOpen(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Write Special Notes / Details</label>
                    <textarea className="form-control" rows="3" required placeholder="Write completion notes..." value={submitRemarks} onChange={(e) => setSubmitRemarks(e.target.value)}></textarea>
                  </div>

                  <div className="mb-3 border p-3 rounded">
                    <label className="form-label fw-bold d-block mb-2">Upload Required Evidence</label>
                    
                    <div className="mb-2">
                      <label className="form-label small text-muted">Camera Images (JPEG/PNG)</label>
                      <input type="file" className="form-control form-control-sm" onChange={handleImagesChange} accept="image/*" multiple />
                      {uploadedImages.length > 0 && (
                        <div className="d-flex gap-2 mt-2 flex-wrap">
                          {uploadedImages.map((img, idx) => (
                            <img key={idx} src={img} className="img-thumbnail" style={{ maxHeight: '60px' }} alt="evidence preview" />
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mb-2">
                      <label className="form-label small text-muted">Upload Documents (PDF, Word, etc.)</label>
                      <input type="file" className="form-control form-control-sm" onChange={handleDocsChange} accept=".pdf,.doc,.docx,.txt" multiple />
                    </div>

                    <div className="mb-0">
                      <label className="form-label small text-muted">Upload Video (MP4)</label>
                      <input type="file" className="form-control form-control-sm" onChange={handleVideosChange} accept="video/mp4" multiple />
                    </div>
                  </div>

                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsSubmitOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-success btn-sm">Submit Task Output</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: PM Evaluate Submission */}
      {isEvaluateOpen && activeMsItem && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content animate-slide-up">
              <div className="modal-header">
                <h5 className="modal-title font-weight-bold text-success">Evaluate Milestone: "{activeMsItem.name}"</h5>
                <button type="button" className="btn-close" onClick={() => setIsEvaluateOpen(false)}></button>
              </div>
              <div className="modal-body">
                <div className="alert bg-light border text-dark small py-2 mb-3">
                  <b>Officer Notes:</b> {activeMsItem.remarks || 'No notes provided by Field Officer'}
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Give Score / Performance Rating</label>
                  <select className="form-select" value={evalScore} onChange={(e) => setEvalScore(e.target.value)}>
                    <option value="Good">Good</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Needs Attention">Needs Attention</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Evaluation feedback remarks</label>
                  <input type="text" className="form-control" required placeholder="Type evaluation remarks..." value={evalRemarks} onChange={(e) => setEvalRemarks(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer d-flex justify-content-between">
                <button className="btn btn-outline-danger btn-sm" onClick={() => handleEvaluationSubmit('reject')}>
                  <i className="bi bi-x-circle me-1"></i> Reject & Return
                </button>
                <div className="d-flex gap-2">
                  <button className="btn btn-secondary btn-sm" onClick={() => setIsEvaluateOpen(false)}>Cancel</button>
                  <button className="btn btn-success btn-sm" onClick={() => handleEvaluationSubmit('approve')}>
                    <i className="bi bi-check-circle me-1"></i> Approve Submission
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
