import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';

export default function Performance() {
  const { currentUser } = useContext(AuthContext);
  const [milestones, setMilestones] = useState([]);

  const loadData = async () => {
    try {
      const data = await api.milestones.getAll();
      setMilestones(data);
    } catch (err) {
      console.warn('Unable to load milestones for performance:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter milestones assigned to this specific logged-in officer
  const myMilestones = milestones.filter(m => 
    m.assignedOfficer && m.assignedOfficer.toLowerCase() === currentUser?.name?.toLowerCase()
  );

  const totalAssigned = myMilestones.length;
  const approvedCount = myMilestones.filter(m => m.status === 'completed' || m.status === 'approved').length;
  const pendingCount = myMilestones.filter(m => m.status === 'pending_manager_approval').length;
  const rejectedCount = myMilestones.filter(m => m.status === 'rejected').length;
  const upcomingCount = myMilestones.filter(m => m.status === 'upcoming' || m.status === 'in_progress').length;

  const completionRate = totalAssigned > 0 ? Math.round((approvedCount / totalAssigned) * 100) : 0;

  // Score distribution
  const ratingsCount = {
    Good: myMilestones.filter(m => m.score === 'Good').length,
    Moderate: myMilestones.filter(m => m.score === 'Moderate').length,
    Attention: myMilestones.filter(m => m.score === 'Needs Attention').length
  };

  return (
    <div id="view-performance" className="app-view">
      <div className="row justify-content-center">
        <div className="col-xl-8 col-lg-10 col-12">
          
          {/* Header */}
          <div className="card shadow-sm border-0 mb-4 p-4 active-scope-banner" style={{ borderRadius: '12px' }}>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div>
                <span className="text-success small fw-bold text-uppercase d-block mb-1">Performance Suite</span>
                <h2 className="mb-0 font-weight-bold text-success-dark">Officer Performance Analytics</h2>
                <p className="text-secondary small mb-0 mt-1">Real-time task feedback, metrics, and quality scores</p>
              </div>
              <div className="text-end">
                <span className="badge bg-success-dark py-1.5 px-3 text-uppercase" style={{ fontSize: '11px' }}>
                  Auditor: {currentUser?.name}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Row */}
          <div className="row g-3 mb-4">
            <div className="col-3">
              <div className="p-3 border rounded bg-white text-center shadow-sm">
                <span className="text-muted d-block small mb-1">Assigned Tasks</span>
                <strong className="fs-4 text-dark">{totalAssigned}</strong>
              </div>
            </div>
            <div className="col-3">
              <div className="p-3 border rounded bg-white text-center shadow-sm">
                <span className="text-muted d-block small mb-1">Approved</span>
                <strong className="fs-4 text-success">{approvedCount}</strong>
              </div>
            </div>
            <div className="col-3">
              <div className="p-3 border rounded bg-white text-center shadow-sm">
                <span className="text-muted d-block small mb-1">Pending Review</span>
                <strong className="fs-4 text-warning">{pendingCount}</strong>
              </div>
            </div>
            <div className="col-3">
              <div className="p-3 border rounded bg-white text-center shadow-sm">
                <span className="text-muted d-block small mb-1">Needs Revision</span>
                <strong className="fs-4 text-danger">{rejectedCount}</strong>
              </div>
            </div>
          </div>

          {/* Circular Progress & Ratings Split */}
          <div className="row g-4 mb-4">
            <div className="col-md-6">
              <div className="card shadow-sm border-0 h-100 p-4">
                <h6 className="fw-bold text-success mb-3"><i className="bi bi-graph-up-arrow me-1"></i> Completion Efficiency</h6>
                <div className="d-flex align-items-center justify-content-center flex-column gap-3 py-3">
                  <div style={{ width: '120px', height: '120px' }} className="position-relative">
                    <svg width="120" height="120" viewBox="0 0 36 36" className="circular-chart success w-100 h-100">
                      <path className="circle-bg"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none" stroke="#e6f4ea" strokeWidth="3"
                      />
                      <path className="circle"
                        strokeDasharray={`${completionRate}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none" stroke="#2e7d32" strokeWidth="3" strokeLinecap="round"
                      />
                      <text x="18" y="20.35" className="percentage" fontSize="8" textAnchor="middle" fontWeight="bold" fill="#2e7d32">
                        {completionRate}%
                      </text>
                    </svg>
                  </div>
                  <div className="text-center">
                    <strong className="d-block text-success-dark">{approvedCount} of {totalAssigned} Milestones Verified</strong>
                    <span className="text-muted small">Target 100% completion per weekly cycle</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card shadow-sm border-0 h-100 p-4">
                <h6 className="fw-bold text-success mb-3"><i className="bi bi-award-fill me-1"></i> PM Evaluation Rating Distribution</h6>
                <div className="d-flex flex-column gap-3 py-2">
                  <div>
                    <div className="d-flex justify-content-between mb-1">
                      <span className="small fw-semibold text-success"><i className="bi bi-emoji-smile-fill me-1"></i> Good Quality Rating</span>
                      <span className="small text-muted">{ratingsCount.Good} Tasks</span>
                    </div>
                    <div className="progress" style={{ height: '8px' }}>
                      <div className="progress-bar bg-success" style={{ width: totalAssigned > 0 ? `${(ratingsCount.Good / totalAssigned) * 100}%` : '0%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="d-flex justify-content-between mb-1">
                      <span className="small fw-semibold text-warning"><i className="bi bi-emoji-neutral-fill me-1"></i> Moderate Rating</span>
                      <span className="small text-muted">{ratingsCount.Moderate} Tasks</span>
                    </div>
                    <div className="progress" style={{ height: '8px' }}>
                      <div className="progress-bar bg-warning" style={{ width: totalAssigned > 0 ? `${(ratingsCount.Moderate / totalAssigned) * 100}%` : '0%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="d-flex justify-content-between mb-1">
                      <span className="small fw-semibold text-danger"><i className="bi bi-emoji-frown-fill me-1"></i> Needs Attention</span>
                      <span className="small text-muted">{ratingsCount.Attention} Tasks</span>
                    </div>
                    <div className="progress" style={{ height: '8px' }}>
                      <div className="progress-bar bg-danger" style={{ width: totalAssigned > 0 ? `${(ratingsCount.Attention / totalAssigned) * 100}%` : '0%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Performance History Log */}
          <div className="card shadow-sm border-0 p-4">
            <h6 className="fw-bold text-success mb-3"><i className="bi bi-clock-history me-1"></i> Evaluation Logs & Feedback History</h6>
            
            {myMilestones.length === 0 ? (
              <div className="text-center text-muted py-4">No tasks evaluated yet.</div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {myMilestones.map(m => (
                  <div key={m.id} className="p-3 border rounded-3 bg-light">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <strong className="text-success-dark d-block">{m.name}</strong>
                        <span className="text-muted small">Deadline: {m.endDate || m.target}</span>
                      </div>
                      <div>
                        <span className={`badge ${m.status === 'completed' ? 'bg-success' : 'bg-warning text-dark'} text-capitalize`}>
                          {m.status === 'completed' ? 'Approved' : m.status}
                        </span>
                      </div>
                    </div>
                    {m.score && (
                      <div className="mt-2">
                        <span className="badge bg-success bg-opacity-10 text-success border border-success me-2">Rating: {m.score}</span>
                        <span className="small text-dark font-Outfit"><b>Feedback:</b> {m.remarks || 'No evaluation remarks.'}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
