import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';

export default function Drones() {
  const { currentUser, activeProjectId } = useContext(AuthContext);
  const [dronesList, setDronesList] = useState([]);
  const [sites, setSites] = useState([]);
  const [searchVal, setSearchVal] = useState('');

  // Modal controls
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [activeDrone, setActiveDrone] = useState(null);

  // Form states
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formDroneId, setFormDroneId] = useState('');
  const [formPilotName, setFormPilotName] = useState('');
  const [formFlightDate, setFormFlightDate] = useState('');
  const [formMissionType, setFormMissionType] = useState('Reconnaissance');
  const [formArea, setFormArea] = useState('');
  const [formLat, setFormLat] = useState('');
  const [formLng, setFormLng] = useState('');
  const [formRemarks, setFormRemarks] = useState('');
  const [formStatus, setFormStatus] = useState('completed');
  const [formSiteId, setFormSiteId] = useState('');

  // Upload lists
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadedVideos, setUploadedVideos] = useState([]);
  const [generatedReports, setGeneratedReports] = useState([]);
  const [reportInput, setReportInput] = useState('');

  const isRole = (roles) => roles.includes(currentUser?.role);

  const loadData = async () => {
    try {
      const droneData = await api.drones.getAll();
      setDronesList(droneData);

      const sitesData = await api.sites.getAll();
      setSites(sitesData);
    } catch (err) {
      console.warn('Unable to load drone logs:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleImagesUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(f => {
      const r = new FileReader();
      r.onload = (ev) => setUploadedImages(prev => [...prev, ev.target.result]);
      r.readAsDataURL(f);
    });
  };

  const handleVideosUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(f => {
      const r = new FileReader();
      r.onload = (ev) => setUploadedVideos(prev => [...prev, ev.target.result]);
      r.readAsDataURL(f);
    });
  };

  const handleAddReport = () => {
    if (reportInput.trim()) {
      setGeneratedReports(prev => [...prev, reportInput.trim()]);
      setReportInput('');
    }
  };

  const handleDroneSubmit = async (e) => {
    e.preventDefault();
    const siteObj = sites.find(s => s.id === formSiteId);
    const resolvedProjectId = siteObj ? siteObj.projectId : (activeProjectId !== 'all' ? activeProjectId : '');

    const payload = {
      id: formId || `drone-${Date.now()}`,
      droneName: formName,
      droneId: formDroneId,
      pilotName: formPilotName,
      flightDate: formFlightDate,
      missionType: formMissionType,
      surveyArea: Number(formArea) || 0,
      capturedImages: uploadedImages,
      capturedVideos: uploadedVideos,
      generatedReports,
      gpsCoordinates: {
        lat: Number(formLat) || 0,
        lng: Number(formLng) || 0
      },
      remarks: formRemarks,
      status: formStatus,
      siteId: formSiteId,
      projectId: resolvedProjectId
    };

    try {
      await api.drones.save(payload);
      loadData();
      setIsModalOpen(false);
    } catch (err) {
      alert(`Error saving drone record: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this drone mission log?')) return;
    try {
      await api.drones.delete(id);
      loadData();
    } catch (err) {
      alert(`Error deleting drone log: ${err.message}`);
    }
  };

  const filteredSites = sites.filter(s =>
    activeProjectId === 'all' || s.projectId === activeProjectId
  );

  const openFormModal = (mode, item = null) => {
    if (mode === 'add') {
      setFormId('');
      setFormName('');
      setFormDroneId(`DRN-${Math.floor(100 + Math.random() * 900)}`);
      setFormPilotName(currentUser?.name || '');
      setFormFlightDate(new Date().toISOString().split('T')[0]);
      setFormMissionType('Reconnaissance');
      setFormArea('');
      setFormLat('10.7854');
      setFormLng('76.5482');
      setFormRemarks('');
      setFormStatus('completed');
      setFormSiteId(filteredSites[0]?.id || '');
      setUploadedImages([]);
      setUploadedVideos([]);
      setGeneratedReports([]);
    } else if (item) {
      setFormId(item.id);
      setFormName(item.droneName || '');
      setFormDroneId(item.droneId || '');
      setFormPilotName(item.pilotName || '');
      setFormFlightDate(item.flightDate || '');
      setFormMissionType(item.missionType || 'Reconnaissance');
      setFormArea(item.surveyArea || '');
      setFormLat(item.gpsCoordinates?.lat || '');
      setFormLng(item.gpsCoordinates?.lng || '');
      setFormRemarks(item.remarks || '');
      setFormStatus(item.status || 'completed');
      setFormSiteId(item.siteId || '');
      setUploadedImages(item.capturedImages || []);
      setUploadedVideos(item.capturedVideos || []);
      setGeneratedReports(item.generatedReports || []);
    }
    setIsModalOpen(true);
  };

  const openQuickView = (item) => {
    setActiveDrone(item);
    setIsQuickViewOpen(true);
  };

  const filteredDrones = dronesList.filter(d => {
    const matchesProject = activeProjectId === 'all' || d.projectId === activeProjectId || (sites.find(s => s.id === d.siteId && s.projectId === activeProjectId));
    const matchesSearch = d.droneName?.toLowerCase().includes(searchVal.toLowerCase()) ||
                          d.pilotName?.toLowerCase().includes(searchVal.toLowerCase()) ||
                          d.droneId?.toLowerCase().includes(searchVal.toLowerCase());
    return matchesProject && matchesSearch;
  });

  return (
    <div id="view-drone" className="app-view">
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3 border-0 d-flex justify-content-between align-items-center">
          <h5 className="mb-0 font-weight-bold text-success">
            <i className="bi bi-airplane-engines me-2"></i> Drone Reconnaissance flight logs
          </h5>
          {isRole(['admin', 'manager', 'field_officer']) && (
            <button className="btn btn-primary-green btn-sm" onClick={() => openFormModal('add')}>
              <i className="bi bi-plus-lg me-1"></i> Register Flight Mission
            </button>
          )}
        </div>
        <div className="card-body p-3">
          <div className="mb-3">
            <input 
              type="text" 
              className="form-control form-control-sm" 
              placeholder="Search flight logs by ID, pilot, or drone name..." 
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
            />
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
              <thead>
                <tr>
                  <th>Mission Name</th>
                  <th>Drone ID</th>
                  <th>Pilot</th>
                  <th>Flight Date</th>
                  <th>Survey Area</th>
                  <th>GPS Coordinates</th>
                  <th>Status</th>
                  <th>Images</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrones.length === 0 ? (
                  <tr><td colSpan="9" className="text-center text-muted py-4">No flight logs registered</td></tr>
                ) : (
                  filteredDrones.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <strong className="text-success-dark d-block text-decoration-none" style={{ cursor: 'pointer' }} onClick={() => openQuickView(d)}>
                          {d.droneName}
                        </strong>
                        <small className="text-muted">{d.missionType}</small>
                      </td>
                      <td><code>{d.droneId}</code></td>
                      <td>{d.pilotName}</td>
                      <td>{d.flightDate}</td>
                      <td>{d.surveyArea} Acres</td>
                      <td>Lat: {d.gpsCoordinates?.lat}, Lng: {d.gpsCoordinates?.lng}</td>
                      <td>
                        <span className={`badge ${d.status === 'completed' ? 'bg-success' : 'bg-danger'} text-capitalize`}>
                          {d.status}
                        </span>
                      </td>
                      <td>
                        {d.capturedImages?.length > 0 ? (
                          <img 
                            src={d.capturedImages[0]} 
                            className="rounded border" 
                            style={{ width: '45px', height: '30px', objectFit: 'cover', cursor: 'pointer' }} 
                            onClick={() => openQuickView(d)} 
                            alt="Scan orthomosaic" 
                          />
                        ) : (
                          <span className="text-muted small">No images</span>
                        )}
                      </td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-1">
                          <button className="btn btn-sm btn-outline-success p-1" onClick={() => openFormModal('edit', d)}>
                            <i className="bi bi-pencil" style={{ fontSize: '11px' }}></i>
                          </button>
                          <button className="btn btn-sm btn-outline-danger p-1" onClick={() => handleDelete(d.id)}>
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

      {/* Register Drone Modal */}
      {isModalOpen && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
            <div className="modal-content">
              <form onSubmit={handleDroneSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title font-weight-bold text-success">
                    {formId ? 'Modify Flight Mission settings' : 'Register Drone Flight Mission'}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setIsModalOpen(false)}></button>
                </div>
                <div className="modal-body" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label">Drone Mission Name</label>
                      <input type="text" className="form-control" required value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Quad C sapling verification" />
                    </div>
                    <div className="col-6">
                      <label className="form-label">Drone ID</label>
                      <input type="text" className="form-control" required value={formDroneId} onChange={(e) => setFormDroneId(e.target.value)} />
                    </div>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label">Pilot Name</label>
                      <input type="text" className="form-control" required value={formPilotName} onChange={(e) => setFormPilotName(e.target.value)} />
                    </div>
                    <div className="col-6">
                      <label className="form-label">Flight Date</label>
                      <input type="date" className="form-control" required value={formFlightDate} onChange={(e) => setFormFlightDate(e.target.value)} />
                    </div>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label">Mission Type</label>
                      <input type="text" className="form-control" required value={formMissionType} onChange={(e) => setFormMissionType(e.target.value)} placeholder="e.g. Area Mapping" />
                    </div>
                    <div className="col-6">
                      <label className="form-label">Survey Area (Acres)</label>
                      <input type="number" className="form-control" required value={formArea} onChange={(e) => setFormArea(e.target.value)} placeholder="e.g. 45" />
                    </div>
                  </div>

                  {/* GPS coordinates & site links */}
                  <div className="row g-2 mb-3 border p-3 rounded bg-light">
                    <div className="col-4">
                      <label className="form-label">Site Zone Bind</label>
                      <select className="form-select form-select-sm" value={formSiteId} onChange={(e) => setFormSiteId(e.target.value)}>
                        {filteredSites.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-4">
                      <label className="form-label">Telemetry Lat</label>
                      <input type="text" className="form-control form-control-sm" required value={formLat} onChange={(e) => setFormLat(e.target.value)} />
                    </div>
                    <div className="col-4">
                      <label className="form-label">Telemetry Long</label>
                      <input type="text" className="form-control form-control-sm" required value={formLng} onChange={(e) => setFormLng(e.target.value)} />
                    </div>
                  </div>

                  {/* Upload assets */}
                  <div className="row g-2 mb-3 border-bottom pb-3">
                    <div className="col-6 border-end">
                      <label className="form-label fw-bold">Orthomosaic Images (.png)</label>
                      <input type="file" className="form-control form-control-sm" multiple onChange={handleImagesUpload} accept="image/*" />
                      {uploadedImages.length > 0 && (
                        <div className="d-flex flex-wrap gap-1 mt-2">
                          {uploadedImages.map((img, i) => (
                            <img key={i} src={img} style={{ width: '40px', height: '30px', objectFit: 'cover' }} className="rounded border" alt="preview" />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="col-6 ps-3">
                      <label className="form-label fw-bold">Flight Video clips (.mp4)</label>
                      <input type="file" className="form-control form-control-sm" multiple onChange={handleVideosUpload} accept="video/mp4" />
                      {uploadedVideos.length > 0 && (
                        <div className="mt-2"><span className="badge bg-info">{uploadedVideos.length} clips uploaded</span></div>
                      )}
                    </div>
                  </div>

                  {/* Reports builder */}
                  <div className="mb-3">
                    <label className="form-label fw-bold">AI Analysis Reports</label>
                    <div className="input-group">
                      <input type="text" className="form-control form-control-sm" placeholder="Add report log summary..." value={reportInput} onChange={(e) => setReportInput(e.target.value)} />
                      <button className="btn btn-outline-success btn-sm" type="button" onClick={handleAddReport}>Add</button>
                    </div>
                    {generatedReports.length > 0 && (
                      <ul className="list-group list-group-flush mt-2" style={{ fontSize: '12px' }}>
                        {generatedReports.map((rep, idx) => (
                          <li key={idx} className="list-group-item d-flex justify-content-between align-items-center py-1">
                            {rep}
                            <button type="button" className="btn-close" style={{ fontSize: '8px' }} onClick={() => setGeneratedReports(prev => prev.filter((_, i) => i !== idx))}></button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Pilot Remarks</label>
                    <input type="text" className="form-control" value={formRemarks} onChange={(e) => setFormRemarks(e.target.value)} placeholder="General comments" />
                  </div>

                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label">Flight Status</label>
                      <select className="form-select" value={formStatus} onChange={(e) => setFormStatus(e.target.value)}>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                        <option value="aborted">Aborted</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary-green btn-sm">Save flight log</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Drone Quickview Modal */}
      {isQuickViewOpen && activeDrone && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content border-0">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title font-weight-bold">
                  <i className="bi bi-airplane-fill"></i> Flight Mission: {activeDrone.droneName}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setIsQuickViewOpen(false)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="mb-3 text-center">
                  {activeDrone.capturedImages?.length > 0 ? (
                    <img src={activeDrone.capturedImages[0]} className="img-fluid rounded border shadow" style={{ maxHeight: '200px', objectFit: 'cover' }} alt="orthomosaic scan" />
                  ) : (
                    <div className="bg-light border text-muted py-5 rounded">No imagery mapped to flight log</div>
                  )}
                </div>

                <div className="row g-2 text-dark small mb-3 border-bottom pb-2">
                  <div className="col-6"><b>Drone ID:</b> {activeDrone.droneId}</div>
                  <div className="col-6"><b>Pilot:</b> {activeDrone.pilotName}</div>
                  <div className="col-6"><b>Flight Date:</b> {activeDrone.flightDate}</div>
                  <div className="col-6"><b>Scan Area:</b> {activeDrone.surveyArea} Acres</div>
                  <div className="col-12"><b>GPS Coordinates:</b> Lat: {activeDrone.gpsCoordinates?.lat}, Lng: {activeDrone.gpsCoordinates?.lng}</div>
                </div>

                <div className="mb-3 text-dark">
                  <span className="text-muted d-block small mb-1">Generated Reports:</span>
                  {activeDrone.generatedReports?.length > 0 ? (
                    <ul className="ps-3 mb-0" style={{ fontSize: '12px' }}>
                      {activeDrone.generatedReports.map((r, i) => (
                        <li key={i} className="fw-semibold text-success-dark">{r}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-muted small">No generated analysis reports found</span>
                  )}
                </div>

                <div className="text-dark small border-top pt-2">
                  <b>Remarks:</b> {activeDrone.remarks || 'No flight remarks provided'}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsQuickViewOpen(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
