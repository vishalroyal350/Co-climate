import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';

export default function ProjectDetails() {
  const { currentUser, activeProjectId } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [sites, setSites] = useState([]);
  const [usersList, setUsersList] = useState([]);

  // Search/Filters states
  const [projSearch, setProjSearch] = useState('');

  // Form states (Unified Project & Site)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
  const [formProjId, setFormProjId] = useState('');
  const [formSiteId, setFormSiteId] = useState('');
  const [formProjName, setFormProjName] = useState('');
  const [formSiteName, setFormSiteName] = useState('');
  const [formType, setFormType] = useState('Afforestation');
  const [formLat, setFormLat] = useState('');
  const [formLong, setFormLong] = useState('');
  const [formStage, setFormStage] = useState('Planning');
  const [formStatus, setFormStatus] = useState('active');
  const [formArea, setFormArea] = useState('');
  const [formTotalPlantedTrees, setFormTotalPlantedTrees] = useState(10000);
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formWeatherStatus, setFormWeatherStatus] = useState('Sunny');
  const [formLocation, setFormLocation] = useState('');
  const [formManager, setFormManager] = useState('');

  // Acre boundary corners states
  const [formLat1, setFormLat1] = useState('');
  const [formLong1, setFormLong1] = useState('');
  const [formLat2, setFormLat2] = useState('');
  const [formLong2, setFormLong2] = useState('');
  const [formLat3, setFormLat3] = useState('');
  const [formLong3, setFormLong3] = useState('');
  const [formLat4, setFormLat4] = useState('');
  const [formLong4, setFormLong4] = useState('');

  const handleAutoCalcCorners = () => {
    const latVal = Number(formLat);
    const lngVal = Number(formLong);
    const areaAcres = Number(formArea) || 50;
    if (!latVal || !lngVal) {
      alert('Please enter valid centroid Latitude and Longitude first.');
      return;
    }
    const sideMeters = Math.sqrt(areaAcres * 4046.86);
    const halfSide = sideMeters / 2;
    const deltaLat = halfSide / 111000;
    const deltaLng = halfSide / (111000 * Math.cos(latVal * Math.PI / 180));

    setFormLat1((latVal - deltaLat).toFixed(6));
    setFormLong1((lngVal - deltaLng).toFixed(6));
    setFormLat2((latVal + deltaLat).toFixed(6));
    setFormLong2((lngVal - deltaLng).toFixed(6));
    setFormLat3((latVal + deltaLat).toFixed(6));
    setFormLong3((lngVal + deltaLng).toFixed(6));
    setFormLat4((latVal - deltaLat).toFixed(6));
    setFormLong4((lngVal + deltaLng).toFixed(6));
  };

  const isRole = (roles) => roles.includes(currentUser?.role);

  const loadData = async () => {
    try {
      const projData = await api.projects.getAll();
      setProjects(projData);

      const sitesData = await api.sites.getAll();
      setSites(sitesData);

      const users = await api.auth.getUsers();
      setUsersList(users);
    } catch (err) {
      console.warn('Unable to load projects/sites data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(6);
          const long = position.coords.longitude.toFixed(6);
          setFormLat(lat);
          setFormLong(long);
        },
        (error) => {
          console.warn('Geolocation error:', error);
          alert('Could not retrieve current coordinates. Verify permissions or enter manually.');
        }
      );
    } else {
      alert('Browser geolocation is not supported.');
    }
  };

  // Submit Combined Project & Site
  const handleCombinedSubmit = async (e) => {
    e.preventDefault();

    const projId = formProjId.trim() || `proj-${Date.now()}`;
    const siteId = formSiteId || `site-${Date.now()}`;

    const projectPayload = {
      id: projId,
      name: formProjName,
      desc: `${formProjName} Restoration Details`,
      location: formLocation,
      area: formArea,
      start: formStartDate || new Date().toISOString().split('T')[0],
      end: formEndDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 3).toISOString().split('T')[0],
      startDate: formStartDate || new Date().toISOString().split('T')[0],
      endDate: formEndDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 3).toISOString().split('T')[0],
      manager: formManager,
      status: formStatus,
      type: formType,
      stage: formStage,
      lat: formLat,
      long: formLong,
      healthScore: 95,
      totalPlantedTrees: Number(formTotalPlantedTrees) || 10000,
      weatherStatus: formWeatherStatus
    };

    const sitePayload = {
      id: siteId,
      name: formSiteName,
      projectId: projId,
      location: formLocation,
      lat: formLat,
      long: formLong,
      lat1: formLat1 || formLat, long1: formLong1 || formLong,
      lat2: formLat2 || formLat, long2: formLong2 || formLong,
      lat3: formLat3 || formLat, long3: formLong3 || formLong,
      lat4: formLat4 || formLat, long4: formLong4 || formLong,
      area: formArea
    };

    try {
      await api.projects.save(projectPayload);
      await api.sites.save(sitePayload);
      loadData();
      setIsModalOpen(false);
    } catch (err) {
      alert(`Error saving restoration data: ${err.message}`);
    }
  };

  // Delete Combined Project & Site
  const handleCombinedDelete = async (projId, siteId) => {
    if (!confirm('Are you sure you want to delete this restoration project and its site?')) return;
    try {
      await api.projects.delete(projId);
      if (siteId) {
        await api.sites.delete(siteId);
      }
      loadData();
    } catch (err) {
      alert(`Error deleting restoration project: ${err.message}`);
    }
  };

  const openCombinedModal = (mode, projectItem = null) => {
    setFormMode(mode);
    if (mode === 'add') {
      setFormProjId('');
      setFormSiteId('');
      setFormProjName('');
      setFormSiteName('');
      setFormType('Afforestation');
      setFormLat('');
      setFormLong('');
      setFormStage('Planning');
      setFormStatus('active');
      setFormArea('');
      setFormTotalPlantedTrees(10000);
      setFormStartDate('');
      setFormEndDate('');
      setFormWeatherStatus('Sunny');
      setFormLocation('');
      setFormManager(currentUser?.name || '');
      setFormLat1('');
      setFormLong1('');
      setFormLat2('');
      setFormLong2('');
      setFormLat3('');
      setFormLong3('');
      setFormLat4('');
      setFormLong4('');
    } else if (projectItem) {
      setFormProjId(projectItem.id);
      setFormProjName(projectItem.name || '');
      setFormType(projectItem.type || 'Afforestation');
      setFormLat(projectItem.lat || '');
      setFormLong(projectItem.long || '');
      setFormStage(projectItem.stage || 'Planning');
      setFormStatus(projectItem.status || 'active');
      setFormArea(projectItem.area || '');
      setFormTotalPlantedTrees(projectItem.totalPlantedTrees || 10000);
      setFormStartDate(projectItem.startDate || projectItem.start || '');
      setFormEndDate(projectItem.endDate || projectItem.end || '');
      setFormWeatherStatus(projectItem.weatherStatus || 'Sunny');
      setFormLocation(projectItem.location || '');
      setFormManager(projectItem.manager || '');
      
      const resolvedSite = sites.find(s => s.projectId === projectItem.id);
      if (resolvedSite) {
        setFormSiteId(resolvedSite.id);
        setFormSiteName(resolvedSite.name || '');
        setFormLat1(resolvedSite.lat1 || '');
        setFormLong1(resolvedSite.long1 || '');
        setFormLat2(resolvedSite.lat2 || '');
        setFormLong2(resolvedSite.long2 || '');
        setFormLat3(resolvedSite.lat3 || '');
        setFormLong3(resolvedSite.long3 || '');
        setFormLat4(resolvedSite.lat4 || '');
        setFormLong4(resolvedSite.long4 || '');
      } else {
        setFormSiteId('');
        setFormSiteName('');
        setFormLat1('');
        setFormLong1('');
        setFormLat2('');
        setFormLong2('');
        setFormLat3('');
        setFormLong3('');
        setFormLat4('');
        setFormLong4('');
      }
    }
    setIsModalOpen(true);
  };

  const filteredProjects = projects.filter(p => {
    const matchesProject = activeProjectId === 'all' || p.id === activeProjectId;
    const matchesSearch = p.name?.toLowerCase().includes(projSearch.toLowerCase()) ||
                          p.id?.toLowerCase().includes(projSearch.toLowerCase()) ||
                          p.type?.toLowerCase().includes(projSearch.toLowerCase());
    return matchesProject && matchesSearch;
  });

  return (
    <div id="view-projects-sites" className="app-view">
      <div className="row justify-content-center">
        <div className="col-xl-8 col-lg-10 col-12">
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-white py-3 border-0 d-flex justify-content-between align-items-center flex-wrap gap-2">
              <h5 className="mb-0 font-weight-bold text-success font-Outfit">
                <i className="bi bi-folder-fill me-2"></i> Restorations & Sites Registry
              </h5>
              {isRole(['admin', 'manager']) && (
                <button className="btn btn-primary-green btn-sm" onClick={() => openCombinedModal('add')}>
                  <i className="bi bi-plus-lg me-1"></i> New Restoration Unit
                </button>
              )}
            </div>
            <div className="card-body p-3">
              <div className="mb-4">
                <input 
                  type="text" 
                  className="form-control form-control-sm" 
                  placeholder="Search by ID, Name or Type..." 
                  value={projSearch}
                  onChange={(e) => setProjSearch(e.target.value)}
                />
              </div>

              <div className="restore-list d-flex flex-column gap-3">
                {filteredProjects.length === 0 ? (
                  <div className="text-center text-muted py-5 border rounded theme-surface">
                    <i className="bi bi-folder-x display-4 text-muted mb-2"></i>
                    <p className="mb-0">No Restoration Projects Found</p>
                  </div>
                ) : (
                  filteredProjects.map((p) => {
                    const associatedSite = sites.find(s => s.projectId === p.id);
                    return (
                      <div key={p.id} className="card shadow-sm border-1 border-start-4-green p-4 position-relative" style={{ borderLeft: '4px solid var(--primary-green)' }}>
                        <div className="vertical-details-container mb-3">
                          <div className="d-flex justify-content-between align-items-center py-2 border-bottom flex-wrap">
                            <span className="text-secondary fw-semibold">Project Name:</span>
                            <span className="text-success-dark fw-bold">{p.name || 'Unnamed Project'}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center py-2 border-bottom flex-wrap">
                            <span className="text-secondary fw-semibold">Location:</span>
                            <span className="text-dark fw-semibold">{p.location || 'N/A'}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center py-2 border-bottom flex-wrap">
                            <span className="text-secondary fw-semibold">Project Manager:</span>
                            <span className="text-dark fw-semibold">{p.manager || 'N/A'}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center py-2 border-bottom flex-wrap">
                            <span className="text-secondary fw-semibold">Project ID:</span>
                            <code className="text-primary small">{p.id}</code>
                          </div>
                          <div className="d-flex justify-content-between align-items-center py-2 border-bottom flex-wrap">
                            <span className="text-secondary fw-semibold">Site Name:</span>
                            <span className="text-dark fw-bold">{associatedSite?.name || 'No Site Linked'}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center py-2 border-bottom flex-wrap">
                            <span className="text-secondary fw-semibold">Type:</span>
                            <span className="badge bg-light text-success border text-capitalize">{p.type || 'Afforestation'}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center py-2 border-bottom flex-wrap">
                            <span className="text-secondary fw-semibold">Stage:</span>
                            <span className="badge bg-light text-primary border text-capitalize">{p.stage || 'Planning'}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center py-2 border-bottom flex-wrap">
                            <span className="text-secondary fw-semibold">Status:</span>
                            <span className={`badge ${p.status === 'active' ? 'bg-success' : 'bg-secondary'} text-capitalize`}>
                              {p.status || 'Active'}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center py-2 border-bottom flex-wrap">
                            <span className="text-secondary fw-semibold">Area (Acres):</span>
                            <span className="text-dark fw-semibold">{p.area || 0} acres</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center py-2 border-bottom flex-wrap">
                            <span className="text-secondary fw-semibold">Total Planted Trees:</span>
                            <span className="text-dark fw-semibold">{(p.totalPlantedTrees || 0).toLocaleString()}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center py-2 border-bottom flex-wrap">
                            <span className="text-secondary fw-semibold">Centroid Coordinates:</span>
                            <span className="text-dark small">{p.lat && p.long ? `Lat: ${p.lat}, Lng: ${p.long}` : 'Not set'}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center py-2 border-bottom flex-wrap">
                            <span className="text-secondary fw-semibold">Corner 1 Coordinate:</span>
                            <span className="text-muted small">{associatedSite?.lat1 && associatedSite?.long1 ? `Lat: ${associatedSite.lat1}, Lng: ${associatedSite.long1}` : 'Not set'}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center py-2 border-bottom flex-wrap">
                            <span className="text-secondary fw-semibold">Corner 2 Coordinate:</span>
                            <span className="text-muted small">{associatedSite?.lat2 && associatedSite?.long2 ? `Lat: ${associatedSite.lat2}, Lng: ${associatedSite.long2}` : 'Not set'}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center py-2 border-bottom flex-wrap">
                            <span className="text-secondary fw-semibold">Corner 3 Coordinate:</span>
                            <span className="text-muted small">{associatedSite?.lat3 && associatedSite?.long3 ? `Lat: ${associatedSite.lat3}, Lng: ${associatedSite.long3}` : 'Not set'}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center py-2 border-bottom flex-wrap">
                            <span className="text-secondary fw-semibold">Corner 4 Coordinate:</span>
                            <span className="text-muted small">{associatedSite?.lat4 && associatedSite?.long4 ? `Lat: ${associatedSite.lat4}, Lng: ${associatedSite.long4}` : 'Not set'}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center py-2 border-bottom flex-wrap">
                            <span className="text-secondary fw-semibold">Weather Status:</span>
                            <span className="badge bg-info bg-opacity-10 text-info border"><i className="bi bi-cloud-sun me-1"></i> {p.weatherStatus || 'Sunny'}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center py-2 border-bottom flex-wrap">
                            <span className="text-secondary fw-semibold">Start Date:</span>
                            <span className="text-dark small">{p.startDate || p.start || 'N/A'}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center py-2 border-bottom flex-wrap">
                            <span className="text-secondary fw-semibold">End Date:</span>
                            <span className="text-dark small">{p.endDate || p.end || 'N/A'}</span>
                          </div>
                        </div>

                        {/* Actions Footer */}
                        <div className="border-top pt-3 d-flex gap-2">
                          {isRole(['admin', 'manager']) ? (
                            <>
                              <button className="btn btn-sm btn-outline-success px-3" onClick={() => openCombinedModal('edit', p)}>
                                <i className="bi bi-pencil me-1"></i> Edit
                              </button>
                              <button className="btn btn-sm btn-outline-danger px-3" onClick={() => handleCombinedDelete(p.id, associatedSite?.id)}>
                                <i className="bi bi-trash me-1"></i> Delete
                              </button>
                            </>
                          ) : (
                            <span className="text-muted small">View Only</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Combined Form Modal */}
      {isModalOpen && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <form onSubmit={handleCombinedSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title font-weight-bold text-success">
                    {formMode === 'add' ? 'Create Restoration Unit' : 'Edit Restoration Parameters'}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setIsModalOpen(false)}></button>
                </div>
                <div className="modal-body" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                  
                  {/* Project ID */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Project ID</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required 
                      disabled={formMode === 'edit'} 
                      value={formProjId} 
                      onChange={(e) => setFormProjId(e.target.value)} 
                      placeholder="e.g. project-1" 
                    />
                  </div>

                  {/* Project Name */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Project Name</label>
                    <input type="text" className="form-control" required value={formProjName} onChange={(e) => setFormProjName(e.target.value)} placeholder="e.g. Green Valley Afforestation Project" />
                  </div>

                  {/* Site Name */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Site Name</label>
                    <input type="text" className="form-control" required value={formSiteName} onChange={(e) => setFormSiteName(e.target.value)} placeholder="e.g. Zone Alpha Plantation" />
                  </div>

                  {/* Location */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Location</label>
                    <input type="text" className="form-control" required value={formLocation} onChange={(e) => setFormLocation(e.target.value)} placeholder="e.g. Ooty Sector, Nilgiris" />
                  </div>

                  {/* Manager Selection */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Assigned Manager</label>
                    <select className="form-select" value={formManager} onChange={(e) => setFormManager(e.target.value)}>
                      <option value="">Select Manager</option>
                      {usersList.filter(u => u.role === 'manager' || u.role === 'admin').map(m => (
                        <option key={m.id} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Project Type */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Type of Project</label>
                    <select className="form-select" value={formType} onChange={(e) => setFormType(e.target.value)}>
                      <option value="Afforestation">Afforestation</option>
                      <option value="Deforestation">Deforestation</option>
                      <option value="Forest Management">Forest Management</option>
                    </select>
                  </div>

                  {/* Coordinates Section with Use Current Location */}
                  <div className="mb-3 border p-3 rounded theme-surface">
                    <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                      <label className="form-label mb-0 fw-semibold">Centroid GPS Coordinates</label>
                      <div className="d-flex gap-2">
                        <button type="button" className="btn btn-sm btn-outline-success" onClick={handleUseCurrentLocation}>
                          <i className="bi bi-geo-fill me-1"></i> Current Loc
                        </button>
                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={handleAutoCalcCorners}>
                          <i className="bi bi-magic me-1"></i> Calc Corners
                        </button>
                      </div>
                    </div>
                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <input type="text" className="form-control form-control-sm" required placeholder="Latitude" value={formLat} onChange={(e) => setFormLat(e.target.value)} />
                      </div>
                      <div className="col-6">
                        <input type="text" className="form-control form-control-sm" required placeholder="Longitude" value={formLong} onChange={(e) => setFormLong(e.target.value)} />
                      </div>
                    </div>

                    <label className="form-label mb-1 fw-semibold small text-muted">Acre Boundary (Four Corners Coordinates)</label>
                    <div className="d-flex flex-column gap-2">
                      <div className="row g-2">
                        <div className="col-6">
                          <input type="text" className="form-control form-control-sm" placeholder="Corner 1 Lat" value={formLat1} onChange={(e) => setFormLat1(e.target.value)} />
                        </div>
                        <div className="col-6">
                          <input type="text" className="form-control form-control-sm" placeholder="Corner 1 Lng" value={formLong1} onChange={(e) => setFormLong1(e.target.value)} />
                        </div>
                      </div>
                      <div className="row g-2">
                        <div className="col-6">
                          <input type="text" className="form-control form-control-sm" placeholder="Corner 2 Lat" value={formLat2} onChange={(e) => setFormLat2(e.target.value)} />
                        </div>
                        <div className="col-6">
                          <input type="text" className="form-control form-control-sm" placeholder="Corner 2 Lng" value={formLong2} onChange={(e) => setFormLong2(e.target.value)} />
                        </div>
                      </div>
                      <div className="row g-2">
                        <div className="col-6">
                          <input type="text" className="form-control form-control-sm" placeholder="Corner 3 Lat" value={formLat3} onChange={(e) => setFormLat3(e.target.value)} />
                        </div>
                        <div className="col-6">
                          <input type="text" className="form-control form-control-sm" placeholder="Corner 3 Lng" value={formLong3} onChange={(e) => setFormLong3(e.target.value)} />
                        </div>
                      </div>
                      <div className="row g-2">
                        <div className="col-6">
                          <input type="text" className="form-control form-control-sm" placeholder="Corner 4 Lat" value={formLat4} onChange={(e) => setFormLat4(e.target.value)} />
                        </div>
                        <div className="col-6">
                          <input type="text" className="form-control form-control-sm" placeholder="Corner 4 Lng" value={formLong4} onChange={(e) => setFormLong4(e.target.value)} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Area Target */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Area (Acres)</label>
                    <input type="number" className="form-control" required value={formArea} onChange={(e) => setFormArea(e.target.value)} placeholder="e.g. 500" />
                  </div>

                  {/* Total Planted Trees */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Total Planted Trees</label>
                    <input type="number" className="form-control" required value={formTotalPlantedTrees} onChange={(e) => setFormTotalPlantedTrees(e.target.value)} placeholder="e.g. 12000" />
                  </div>

                  {/* Dates Row */}
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-semibold">Start Date</label>
                      <input type="date" className="form-control" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-semibold">End Date</label>
                      <input type="date" className="form-control" value={formEndDate} onChange={(e) => setFormEndDate(e.target.value)} />
                    </div>
                  </div>

                  {/* Current Weather Status */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Current Weather Status</label>
                    <select className="form-select" value={formWeatherStatus} onChange={(e) => setFormWeatherStatus(e.target.value)}>
                      <option value="Sunny">Sunny</option>
                      <option value="Partly Cloudy">Partly Cloudy</option>
                      <option value="Cloudy">Cloudy</option>
                      <option value="Rainy">Rainy</option>
                      <option value="Showers">Showers</option>
                      <option value="Thunderstorm">Thunderstorm</option>
                    </select>
                  </div>

                  {/* Current Stage */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Stage</label>
                    <select className="form-select" value={formStage} onChange={(e) => setFormStage(e.target.value)}>
                      <option value="Planning">Planning</option>
                      <option value="Execution">Execution</option>
                      <option value="Monitoring">Monitoring</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Status</label>
                    <select className="form-select" value={formStatus} onChange={(e) => setFormStatus(e.target.value)}>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary-green btn-sm">Save Restoration</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
