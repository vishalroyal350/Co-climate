import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';

export default function Reports() {
  const { currentUser, activeProjectId } = useContext(AuthContext);
  const [requestsList, setRequestsList] = useState([]);
  const [projects, setProjects] = useState([]);

  // Form states (Request report - Field Officer)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [formProjectId, setFormProjectId] = useState('');
  const [reportTitle, setReportTitle] = useState('Restoration Progress Report');
  const [includeMilestones, setIncludeMilestones] = useState(true);
  const [includeDrones, setIncludeDrones] = useState(true);
  const [includeWeather, setIncludeWeather] = useState(true);

  // Form states (PM review / settings adjustments)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewRemarks, setReviewRemarks] = useState('');

  // Custom PM Report Engine States
  const [customReportType, setCustomReportType] = useState('Field Report');
  const [customProjectType, setCustomProjectType] = useState('Afforestation');
  const [customDateRange, setCustomDateRange] = useState('3 Months');
  const [generatingCustom, setGeneratingCustom] = useState(false);
  const [generatedPdfBase64, setGeneratedPdfBase64] = useState('');

  const isRole = (roles) => roles.includes(currentUser?.role);

  const filteredRequestsList = requestsList.filter(r => 
    activeProjectId === 'all' || r.projectId === activeProjectId
  );

  const filteredProjects = projects.filter(p =>
    activeProjectId === 'all' || p.id === activeProjectId
  );

  const loadData = async () => {
    try {
      const requests = await api.reports.getAll();
      setRequestsList(requests);

      const projData = await api.projects.getAll();
      setProjects(projData);
      
      const filteredProj = projData.filter(p => activeProjectId === 'all' || p.id === activeProjectId);
      if (filteredProj.length > 0) {
        setFormProjectId(filteredProj[0].id);
      }
    } catch (err) {
      console.warn('Unable to load reports data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // PM Custom Report generation trigger
  const handleGenerateCustomReport = async () => {
    setGeneratingCustom(true);
    setGeneratedPdfBase64('');
    try {
      const response = await api.reports.generate({
        reportType: customReportType,
        projectType: customProjectType,
        dateRange: customDateRange
      });
      if (response.success && (response.pdfBase64 || response.pdfUrl)) {
        setGeneratedPdfBase64(response.pdfBase64 || response.pdfUrl);
      } else {
        alert(response.message || 'Report generation failed');
      }
    } catch (err) {
      alert('Error generating report: ' + err.message);
    } finally {
      setGeneratingCustom(false);
    }
  };

  const handlePreviewPdf = () => {
    if (!generatedPdfBase64) return;
    const newTab = window.open();
    newTab.document.write(`<iframe src="${generatedPdfBase64}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
  };

  // FO creates report request
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    const projObj = projects.find(p => p.id === formProjectId);
    const payload = {
      projectId: formProjectId,
      projectName: projObj ? projObj.name : 'Restoration Project',
      officerId: currentUser?.id || 'Field Officer',
      officerName: currentUser?.name || 'Field Officer',
      settings: {
        title: reportTitle,
        includeMilestones,
        includeDroneData: includeDrones,
        includeWeatherData: includeWeather
      }
    };

    try {
      await api.reports.create(payload);
      loadData();
      setIsRequestModalOpen(false);
    } catch (err) {
      alert(`Error creating report request: ${err.message}`);
    }
  };

  // PM updates request status
  const handleUpdateStatus = async (status) => {
    if (!selectedRequest) return;
    const payload = {
      status,
      managerRemarks: reviewRemarks,
      settings: {
        title: reportTitle,
        includeMilestones,
        includeDroneData: includeDrones,
        includeWeatherData: includeWeather
      }
    };

    try {
      await api.reports.update(selectedRequest.id, payload);
      loadData();
      setIsReviewModalOpen(false);
    } catch (err) {
      alert(`Error updating report request: ${err.message}`);
    }
  };

  const openReviewModal = (reqItem) => {
    setSelectedRequest(reqItem);
    setReportTitle(reqItem.settings?.title || 'Restoration Progress Report');
    setIncludeMilestones(reqItem.settings?.includeMilestones !== false);
    setIncludeDrones(reqItem.settings?.includeDroneData !== false);
    setIncludeWeather(reqItem.settings?.includeWeatherData !== false);
    setReviewRemarks(reqItem.managerRemarks || '');
    setIsReviewModalOpen(true);
  };

  const getStatusBadge = (status) => {
    if (status === 'approved') return 'bg-success';
    if (status === 'rejected') return 'bg-danger';
    return 'bg-warning text-dark';
  };

  return (
    <div id="view-reports" className="app-view">
      {/* PM/Admin Custom Generate Engine */}
      {isRole(['manager', 'admin']) && (
        <div className="card shadow-sm border-0 mb-4 p-4" style={{ borderRadius: '12px', background: '#F8FAF9' }}>
          <h5 className="fw-bold text-success mb-3">
            <i className="bi bi-file-earmark-bar-graph-fill me-2"></i> Custom Report Generation Engine
          </h5>
          
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label small fw-semibold text-muted">Report Type</label>
              <select className="form-select form-select-sm" value={customReportType} onChange={(e) => setCustomReportType(e.target.value)}>
                <option value="Field Report">Field Report</option>
                <option value="Performance Report">Performance Report</option>
                <option value="Impact Report">Impact Report</option>
              </select>
            </div>
            
            <div className="col-md-3">
              <label className="form-label small fw-semibold text-muted">Project Type</label>
              <select className="form-select form-select-sm" value={customProjectType} onChange={(e) => setCustomProjectType(e.target.value)}>
                <option value="Afforestation">Afforestation</option>
                <option value="Deforestation">Deforestation</option>
                <option value="Forest Management">Forest Management</option>
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label small fw-semibold text-muted">Date Range</label>
              <select className="form-select form-select-sm" value={customDateRange} onChange={(e) => setCustomDateRange(e.target.value)}>
                <option value="1 Month">1 Month</option>
                <option value="3 Months">3 Months</option>
                <option value="6 Months">6 Months</option>
              </select>
            </div>

            <div className="col-md-3">
              <button className="btn btn-primary-green btn-sm w-100 py-2.5" onClick={handleGenerateCustomReport} disabled={generatingCustom}>
                {generatingCustom ? 'Generating PDF...' : 'Generate PDF Audit'}
              </button>
            </div>
          </div>

          {generatedPdfBase64 && (
            <div className="mt-4 border p-3 rounded theme-surface">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="fw-bold text-success-dark">Report Preview Ready: {customReportType} ({customProjectType})</span>
                <div className="d-flex gap-2">
                  <button className="btn btn-sm btn-outline-success" onClick={handlePreviewPdf}>
                    <i className="bi bi-eye"></i> Fullscreen Preview
                  </button>
                  <a href={generatedPdfBase64} download={`CoClimate_${customReportType.replace(' ', '_')}.pdf`} className="btn btn-sm btn-success">
                    <i className="bi bi-download"></i> Download PDF
                  </a>
                </div>
              </div>
              <div style={{ height: '350px' }} className="border rounded bg-light overflow-hidden">
                <iframe src={generatedPdfBase64} title="PDF Preview" className="w-100 h-100" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Request Queue */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3 border-0 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h5 className="mb-0 font-weight-bold text-success">
            <i className="bi bi-file-earmark-pdf me-2"></i> Report
          </h5>
          {isRole(['field_officer']) && (
            <button className="btn btn-primary-green btn-sm" onClick={() => setIsRequestModalOpen(true)}>
              <i className="bi bi-plus-lg me-1"></i> Request Report Generation
            </button>
          )}
        </div>
        
        <div className="card-body p-3">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
              <thead>
                <tr>
                  <th>Request Date</th>
                  <th>Project Name</th>
                  <th>Requester Officer</th>
                  <th>Report Title</th>
                  <th>Workflow Status</th>
                  <th>Manager Feedback</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequestsList.length === 0 ? (
                  <tr><td colSpan="7" className="text-center text-muted py-4">No report requests logged in history</td></tr>
                ) : (
                  filteredRequestsList.map((reqItem) => (
                    <tr key={reqItem.id}>
                      <td>{reqItem.requestDate}</td>
                      <td className="fw-semibold text-success-dark">{reqItem.projectName}</td>
                      <td>{reqItem.officerName}</td>
                      <td>{reqItem.settings?.title}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(reqItem.status)} text-capitalize`}>
                          {reqItem.status}
                        </span>
                      </td>
                      <td>{reqItem.managerRemarks || <span className="text-muted small">-</span>}</td>
                      <td className="text-end">
                        {isRole(['manager', 'admin']) && reqItem.status === 'pending' ? (
                          <button className="btn btn-sm btn-success py-1 px-3" onClick={() => openReviewModal(reqItem)}>
                            Review & Configure
                          </button>
                        ) : reqItem.status === 'approved' && reqItem.pdfUrl ? (
                          <a href={reqItem.pdfUrl} download={`${reqItem.projectName}_Report.pdf`} className="btn btn-sm btn-outline-success py-1 px-3 fw-bold">
                            <i className="bi bi-file-earmark-arrow-down-fill me-1"></i> Download PDF
                          </a>
                        ) : (
                          <span className="text-muted small">No action required</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal: FO Request Report */}
      {isRequestModalOpen && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content animate-slide-up">
              <form onSubmit={handleRequestSubmit}>
                <div className="modal-header">
                  <h5 className="modal-title font-weight-bold text-success">Request Report Generation</h5>
                  <button type="button" className="btn-close" onClick={() => setIsRequestModalOpen(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Project Restoration</label>
                    <select 
                      className="form-select" 
                      required 
                      value={formProjectId} 
                      onChange={(e) => setFormProjectId(e.target.value)}
                      disabled={activeProjectId !== 'all'}
                    >
                      {filteredProjects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Custom Report Title</label>
                    <input type="text" className="form-control" required value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} />
                  </div>
                  
                  <div className="border p-3 rounded theme-surface">
                    <label className="form-label fw-bold d-block mb-2">Sections to Request</label>
                    <div className="form-check mb-2">
                      <input className="form-check-input" type="checkbox" id="checkMilestones" checked={includeMilestones} onChange={(e) => setIncludeMilestones(e.target.checked)} />
                      <label className="form-check-label" htmlFor="checkMilestones">Include Milestones logs</label>
                    </div>
                    <div className="form-check mb-2">
                      <input className="form-check-input" type="checkbox" id="checkDrones" checked={includeDrones} onChange={(e) => setIncludeDrones(e.target.checked)} />
                      <label className="form-check-label" htmlFor="checkDrones">Include Drone recon scan data</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="checkWeather" checked={includeWeather} onChange={(e) => setIncludeWeather(e.target.checked)} />
                      <label className="form-check-label" htmlFor="checkWeather">Include Climate weather history</label>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsRequestModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary-green btn-sm">Request Audit</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: PM Review & Approve/Reject */}
      {isReviewModalOpen && selectedRequest && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content animate-slide-up">
              <div className="modal-header">
                <h5 className="modal-title font-weight-bold text-success">Review Report Request</h5>
                <button type="button" className="btn-close" onClick={() => setIsReviewModalOpen(false)}></button>
              </div>
              <div className="modal-body">
                <div className="alert bg-light border small text-dark py-2 mb-3">
                  <b>Requester:</b> {selectedRequest.officerName} | <b>Date:</b> {selectedRequest.requestDate}
                </div>
                <div className="mb-3">
                  <label className="form-label">Adjust Report Title</label>
                  <input type="text" className="form-control form-control-sm" value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} />
                </div>

                <div className="border p-3 rounded mb-3 bg-light">
                  <label className="form-label fw-bold d-block mb-2">Sections to Generate</label>
                  <div className="form-check mb-2">
                    <input className="form-check-input" type="checkbox" id="pmCheckMilestones" checked={includeMilestones} onChange={(e) => setIncludeMilestones(e.target.checked)} />
                    <label className="form-check-label" htmlFor="pmCheckMilestones">Include Milestones</label>
                  </div>
                  <div className="form-check mb-2">
                    <input className="form-check-input" type="checkbox" id="pmCheckDrones" checked={includeDrones} onChange={(e) => setIncludeDrones(e.target.checked)} />
                    <label className="form-check-label" htmlFor="pmCheckDrones">Include Drone recon telemetry</label>
                  </div>
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="pmCheckWeather" checked={includeWeather} onChange={(e) => setIncludeWeather(e.target.checked)} />
                    <label className="form-check-label" htmlFor="pmCheckWeather">Include Weather history logs</label>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Review comments / feedback</label>
                  <input type="text" className="form-control" placeholder="Remarks notes" value={reviewRemarks} onChange={(e) => setReviewRemarks(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer d-flex justify-content-between">
                <button className="btn btn-outline-danger btn-sm" onClick={() => handleUpdateStatus('rejected')}>
                  <i className="bi bi-x-circle me-1"></i> Reject Request
                </button>
                <div className="d-flex gap-2">
                  <button className="btn btn-secondary btn-sm" onClick={() => setIsReviewModalOpen(false)}>Cancel</button>
                  <button className="btn btn-success btn-sm" onClick={() => handleUpdateStatus('approved')}>
                    <i className="bi bi-file-earmark-check me-1"></i> Approve & Generate PDF
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
