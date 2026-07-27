import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';

export default function Monitoring() {
  const { currentUser, activeProjectId } = useContext(AuthContext);
  const [monitoringList, setMonitoringList] = useState([]);
  const [sites, setSites] = useState([]);
  const [projects, setProjects] = useState([]);

  const filteredSites = sites.filter(s =>
    activeProjectId === 'all' || s.projectId === activeProjectId
  );

  // Search/Filters
  const [searchVal, setSearchVal] = useState('');

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [monMode, setMonMode] = useState('add');
  const [formId, setFormId] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formSiteId, setFormSiteId] = useState('');
  const [formDuration, setFormDuration] = useState('Weekly');
  const [formOfficer, setFormOfficer] = useState('');
  const [formStrategyDoc, setFormStrategyDoc] = useState(''); // Implementation strategy document
  const [formOutput, setFormOutput] = useState(''); // Long text
  const [formSurvival, setFormSurvival] = useState('');
  const [formTrees, setFormTrees] = useState('');
  const [formRemarks, setFormRemarks] = useState('');
  const [formPhoto, setFormPhoto] = useState('');
  const [formAttachments, setFormAttachments] = useState([]);

  const isRole = (roles) => roles.includes(currentUser?.role);

  const loadData = async () => {
    try {
      const monData = await api.monitoring.getAll();
      setMonitoringList(monData);

      const sitesData = await api.sites.getAll();
      setSites(sitesData);

      const projData = await api.projects.getAll();
      setProjects(projData);
    } catch (err) {
      console.warn('Unable to load monitoring data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // File handlers
  const handleStrategyChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormStrategyDoc(event.target.result); // base64
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormPhoto(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Monitoring
  const handleMonitoringSubmit = async (e) => {
    e.preventDefault();
    const siteObj = sites.find(s => s.id === formSiteId);
    
    const payload = {
      id: formId || `mon-${Date.now()}`,
      date: formDate || new Date().toISOString().split('T')[0],
      siteId: formSiteId,
      siteName: siteObj ? siteObj.name : 'Unknown Site Area',
      projectId: siteObj ? siteObj.projectId : '',
      duration: formDuration,
      officer: formOfficer || currentUser?.name || 'Field Officer',
      implementationStrategy: formStrategyDoc,
      output: formOutput,
      survival: formSurvival,
      trees: formTrees,
      remarks: formRemarks,
      photo: formPhoto,
      attachments: formAttachments,
      verified: formMode === 'add' ? false : undefined // preserve on edit
    };

    try {
      await api.monitoring.save(payload);
      loadData();
      setIsModalOpen(false);
    } catch (err) {
      alert(`Error saving monitoring record: ${err.message}`);
    }
  };

  // Verify Action (PM / Admin)
  const handleVerify = async (item) => {
    const updated = {
      ...item,
      verified: true
    };
    try {
      await api.monitoring.save(updated);
      loadData();
    } catch (err) {
      alert(`Error verifying monitoring record: ${err.message}`);
    }
  };

  // Delete Monitoring
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this monitoring record?')) return;
    try {
      await api.monitoring.delete(id);
      loadData();
    } catch (err) {
      alert(`Error deleting monitoring record: ${err.message}`);
    }
  };

  const openModal = (mode, item = null) => {
    setMonMode(mode);
    if (mode === 'add') {
      setFormId('');
      setFormDate(new Date().toISOString().split('T')[0]);
      setFormSiteId(filteredSites[0]?.id || '');
      setFormDuration('Weekly');
      setFormOfficer(currentUser?.name || 'Field Officer');
      setFormStrategyDoc('');
      setFormOutput('');
      setFormSurvival('90');
      setFormTrees('2000');
      setFormRemarks('');
      setFormPhoto('');
      setFormAttachments([]);
    } else if (item) {
      setFormId(item.id);
      setFormDate(item.date || '');
      setFormSiteId(item.siteId || '');
      setFormDuration(item.duration || 'Weekly');
      setFormOfficer(item.officer || '');
      setFormStrategyDoc(item.implementationStrategy || '');
      setFormOutput(item.output || '');
      setFormSurvival(item.survival || '');
      setFormTrees(item.trees || '');
      setFormRemarks(item.remarks || '');
      setFormPhoto(item.photo || '');
      setFormAttachments(item.attachments || []);
    }
    setIsModalOpen(true);
  };

  const filteredList = monitoringList.filter(m => {
    const matchesProject = activeProjectId === 'all' || m.projectId === activeProjectId;
    const matchesSearch = m.siteName?.toLowerCase().includes(searchVal.toLowerCase()) ||
                          m.officer?.toLowerCase().includes(searchVal.toLowerCase()) ||
                          m.remarks?.toLowerCase().includes(searchVal.toLowerCase());
    return matchesProject && matchesSearch;
  });

  return (
    <div id="view-monitoring" className="app-view">
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3 border-0 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h5 className="mb-0 font-weight-bold text-success">
            <i className="bi bi-journal-text me-2"></i> Field Audit Monitoring Logs Registry
          </h5>
          <button className="btn btn-primary-green btn-sm" onClick={() => openModal('add')}>
            <i className="bi bi-plus-lg me-1"></i> Log Monitoring Audit
          </button>
        </div>
        <div className="card-body p-3">
          <div className="mb-3">
            <input 
              type="text" 
              className="form-control form-control-sm" 
              placeholder="Search by auditor, remarks or site..." 
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
            />
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
              <thead>
                <tr>
                  <th>Audit Date</th>
                  <th>Site Name</th>
                  <th>Duration</th>
                  <th>Field Officer</th>
                  <th>Implementation Strategy (Doc)</th>
                  <th>Output (Description)</th>
                  <th>Survival Rate</th>
                  <th>Live Tree Count</th>
                  <th>Remarks</th>
                  <th>Verification</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.length === 0 ? (
                  <tr><td colSpan="11" className="text-center text-muted py-4">No Monitoring Records Found</td></tr>
                ) : (
                  filteredList.map((m) => (
                    <tr key={m.id}>
                      <td>{m.date}</td>
                      <td className="fw-semibold text-success-dark">{m.siteName || 'Unknown Site'}</td>
                      <td>{m.duration}</td>
                      <td>{m.officer}</td>
                      <td>
                        {m.implementationStrategy ? (
                          <a href={m.implementationStrategy} download={`Strategy_${m.siteName}.png`} className="btn btn-sm btn-outline-success py-0.5 px-2 font-weight-bold" style={{ fontSize: '11px' }}>
                            <i className="bi bi-file-earmark-arrow-down-fill"></i> Download
                          </a>
                        ) : (
                          <span className="text-muted small">None</span>
                        )}
                      </td>
                      <td style={{ maxWidth: '180px' }} className="text-truncate" title={m.output}>
                        {m.output || <span className="text-muted italic">No description</span>}
                      </td>
                      <td className={Number(m.survival) < 80 ? 'text-danger fw-bold' : 'text-success fw-bold'}>
                        {m.survival}%
                      </td>
                      <td>{Number(m.trees).toLocaleString()}</td>
                      <td>{m.remarks || <span className="text-muted italic">-</span>}</td>
                      <td>
                        {m.verified ? (
                          <span className="badge bg-success bg-opacity-10 text-success border border-success">
                            Verified
                          </span>
                        ) : (
                          <div className="d-flex align-items-center gap-1">
                            <span className="badge bg-warning bg-opacity-10 text-warning border border-warning">
                              Pending
                            </span>
                            {isRole(['manager', 'admin']) && (
                              <button 
                                className="btn btn-sm btn-success py-0.5 px-2 fw-semibold" 
                                style={{ fontSize: '11px' }}
                                onClick={() => handleVerify(m)}
                              >
                                Verify
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-1">
                          <button className="btn btn-sm btn-outline-success p-1" onClick={() => openModal('edit', m)}>
                            <i className="bi bi-pencil" style={{ fontSize: '11px' }}></i>
                          </button>
                          <button className="btn btn-sm btn-outline-danger p-1" onClick={() => handleDelete(m.id)}>
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
        </div>
      </div>

      {/* Modal: Create/Edit Monitoring Log */}
      {isModalOpen && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content animate-slide-up">
              <form onSubmit={handleMonitoringSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title font-weight-bold text-success">
                    {monMode === 'add' ? 'Log Monitoring Audit' : 'Edit Monitoring Audit Log'}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setIsModalOpen(false)}></button>
                </div>
                <div className="modal-body" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                  
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Audit Date</label>
                    <input type="date" className="form-control" required value={formDate} onChange={(e) => setFormDate(e.target.value)} />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Site Name</label>
                    <select className="form-select" required value={formSiteId} onChange={(e) => setFormSiteId(e.target.value)}>
                      {filteredSites.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Field Officer</label>
                    <input type="text" className="form-control" required value={formOfficer} onChange={(e) => setFormOfficer(e.target.value)} />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Duration</label>
                    <select className="form-select" value={formDuration} onChange={(e) => setFormDuration(e.target.value)}>
                      <option value="Weekly">Weekly</option>
                      <option value="Monthly">Monthly</option>
                      <option value="6 Months">6 Months</option>
                      <option value="12 Months">12 Months</option>
                    </select>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold">Survival Rate (%)</label>
                      <input type="number" className="form-control" min="0" max="100" required value={formSurvival} onChange={(e) => setFormSurvival(e.target.value)} />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold">Live Tree Count</label>
                      <input type="number" className="form-control" required value={formTrees} onChange={(e) => setFormTrees(e.target.value)} />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Implementation Strategy (Document Upload)</label>
                    <input type="file" className="form-control" onChange={handleStrategyChange} accept="image/*,application/pdf" />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Output (Written Long Description)</label>
                    <textarea className="form-control" rows="3" required placeholder="Write detailed audit results..." value={formOutput} onChange={(e) => setFormOutput(e.target.value)}></textarea>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Remarks</label>
                    <input type="text" className="form-control" value={formRemarks} onChange={(e) => setFormRemarks(e.target.value)} placeholder="Summary notes" />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Upload Photo (Base64 JPEG/PNG)</label>
                    <input type="file" className="form-control" onChange={handlePhotoChange} accept="image/*" />
                    {formPhoto && (
                      <img src={formPhoto} alt="Upload preview" className="img-thumbnail mt-2" style={{ maxHeight: '120px' }} />
                    )}
                  </div>

                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary-green btn-sm">Save Log</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
