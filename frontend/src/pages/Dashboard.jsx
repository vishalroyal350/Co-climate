import React, { useContext, useEffect, useState, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';
import LeafletMap from '../components/LeafletMap';
import WeatherSection from '../components/WeatherSection';

export default function Dashboard() {
  const { currentUser, activeProjectId, setActiveProjectId } = useContext(AuthContext);
  const [projects, setProjects] = useState([]);
  const [sites, setSites] = useState([]);
  const [drones, setDrones] = useState([]);
  const [monitoring, setMonitoring] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [weatherHistory, setWeatherHistory] = useState([]);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [milestoneFilter, setMilestoneFilter] = useState('All'); // 'All', 'Weekly', 'Monthly'

  // Stats PM Manual Edit
  const [isEditingPlanted, setIsEditingPlanted] = useState(false);
  const [newPlantedVal, setNewPlantedVal] = useState('');

  // Chart Refs
  const lineChartRef = useRef(null);
  const lineChartInstance = useRef(null);

  const statusPieRef = useRef(null);
  const survivalPieRef = useRef(null);
  const healthPieRef = useRef(null);

  const statusPieInstance = useRef(null);
  const survivalPieInstance = useRef(null);
  const healthPieInstance = useRef(null);

  const [stats, setStats] = useState({
    totalArea: 0,
    totalTreesPlanted: 0,
    liveTreeCount: 0,
    avgSurvival: 0,
    nextMonSite: '',
    nextMonDate: '',
    nextMonDays: '',
    isOverdue: false
  });

  // Automatically switch from 'all' to project-1 to support type dropdown mapping
  useEffect(() => {
    if (activeProjectId === 'all' && projects.length > 0) {
      setActiveProjectId('project-1');
    }
  }, [activeProjectId, projects]);

  const loadDashboardData = async () => {
    try {
      const projData = await api.projects.getAll();
      setProjects(projData);

      const sitesData = await api.sites.getAll();
      setSites(sitesData);

      const dronesData = await api.drones.getAll();
      setDrones(dronesData);

      const monData = await api.monitoring.getAll();
      setMonitoring(monData);

      const milestonesData = await api.milestones.getAll();
      setMilestones(milestonesData);

      const currentProjId = activeProjectId === 'all' ? 'project-1' : activeProjectId;

      // Filter data for stats
      const activeProj = projData.find(p => p.id === currentProjId) || projData[0];
      const activeSites = sitesData.filter(s => s.projectId === currentProjId);
      const activeSiteIds = activeSites.map(s => s.id);
      const activeMon = monData.filter(m => activeSiteIds.includes(m.siteId) || m.projectId === currentProjId);

      // 1. Total Area
      const totalArea = activeProj ? (Number(activeProj.area) || 0) : 0;

      // 2. Planted Trees (PM Manual Entry field)
      const totalTreesPlanted = activeProj ? (Number(activeProj.totalPlantedTrees) || 10000) : 10000;

      // 3. Live Tree Count (Latest monitoring records trees sum)
      let liveTreeCount = 0;
      activeSites.forEach(s => {
        const siteLogs = activeMon.filter(m => m.siteId === s.id);
        if (siteLogs.length > 0) {
          siteLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
          liveTreeCount += Number(siteLogs[0].trees) || 0;
        }
      });
      // Fallback if no logs
      if (liveTreeCount === 0 && activeMon.length > 0) {
        liveTreeCount = activeMon.reduce((sum, m) => sum + (Number(m.trees) || 0), 0);
      }

      // 4. Survival Rate = (Live Tree Count / Total Planted Trees) * 100
      const avgSurvival = totalTreesPlanted > 0 ? Math.round((liveTreeCount / totalTreesPlanted) * 100) : 0;

      // 5. Next Monitoring Due (earliest uncompleted milestone)
      const projectMilestones = milestonesData.filter(m => {
        const matchProj = m.projectId === currentProjId;
        const notDone = m.status !== 'completed' && m.status !== 'approved';
        return matchProj && notDone;
      });

      projectMilestones.sort((a, b) => new Date(a.endDate || a.target) - new Date(b.endDate || b.target));

      let nextMonSite = activeSites[0]?.name || 'Sector A Plantation';
      let nextMonDate = '';
      let nextMonDays = '';
      let isOverdue = false;

      if (projectMilestones.length > 0) {
        const nextMilestone = projectMilestones[0];
        nextMonDate = nextMilestone.endDate || nextMilestone.target;
        if (nextMonDate) {
          const todayDate = new Date();
          todayDate.setHours(0, 0, 0, 0);
          const due = new Date(nextMonDate);
          due.setHours(0, 0, 0, 0);

          const diffMs = due.getTime() - todayDate.getTime();
          const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
            isOverdue = true;
            nextMonDays = `${Math.abs(diffDays)} days overdue`;
          } else if (diffDays === 0) {
            nextMonDays = 'Due Today';
          } else {
            nextMonDays = `${diffDays} days remaining`;
          }
        }
      }

      setStats({
        totalArea,
        totalTreesPlanted,
        liveTreeCount,
        avgSurvival,
        nextMonSite,
        nextMonDate,
        nextMonDays,
        isOverdue
      });
    } catch (err) {
      console.warn('Dashboard data fetch failed:', err);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [activeProjectId]);

  // Fetch weather history when active project updates
  useEffect(() => {
    const fetchWeather = async () => {
      const currentProjId = activeProjectId === 'all' ? 'project-1' : activeProjectId;
      setWeatherLoading(true);
      try {
        const data = await api.weather.getHistory(currentProjId);
        setWeatherHistory(data);
      } catch (err) {
        console.warn('Weather fetch failed:', err);
      } finally {
        setWeatherLoading(false);
      }
    };
    fetchWeather();
  }, [activeProjectId]);

  // PM Save Planted Trees handler
  const handleSavePlantedTrees = async (e) => {
    e.preventDefault();
    const currentProjId = activeProjectId === 'all' ? 'project-1' : activeProjectId;
    const activeProj = projects.find(p => p.id === currentProjId);
    if (!activeProj) return;

    const updatedProj = {
      ...activeProj,
      totalPlantedTrees: Number(newPlantedVal) || 0
    };

    try {
      await api.projects.save(updatedProj);
      setIsEditingPlanted(false);
      loadDashboardData();
    } catch (err) {
      alert('Failed to save planted trees: ' + err.message);
    }
  };

  // Line Chart hook (Survival Rate Trend)
  useEffect(() => {
    const currentProjId = activeProjectId === 'all' ? 'project-1' : activeProjectId;
    const projSites = sites.filter(s => s.projectId === currentProjId).map(s => s.id);
    let filteredMon = monitoring.filter(m => projSites.includes(m.siteId) || m.projectId === currentProjId);

    filteredMon.sort((a, b) => new Date(a.date) - new Date(b.date));

    if (filteredMon.length === 0) {
      if (lineChartInstance.current) {
        lineChartInstance.current.destroy();
        lineChartInstance.current = null;
      }
      return;
    }

    const ctx = lineChartRef.current;
    if (!ctx) return;

    if (lineChartInstance.current) {
      lineChartInstance.current.destroy();
    }

    const labels = filteredMon.map(m => {
      const d = new Date(m.date);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const data = filteredMon.map(m => Number(m.survival) || 0);

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const activeBorderColor = isDark ? '#81c784' : '#2e7d32';
    const activeBgColor = isDark ? 'rgba(129, 199, 132, 0.08)' : 'rgba(46, 125, 50, 0.05)';

    if (window.Chart) {
      lineChartInstance.current = new window.Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Survival Rate (%)',
            data,
            borderColor: activeBorderColor,
            backgroundColor: activeBgColor,
            tension: 0.25,
            fill: true,
            pointBackgroundColor: activeBorderColor,
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: {
              grid: {
                display: true,
                color: document.documentElement.getAttribute('data-theme') === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'
              },
              ticks: {
                color: document.documentElement.getAttribute('data-theme') === 'dark' ? '#cbd5e1' : '#334155'
              }
            },
            y: {
              min: 0,
              max: 100,
              grid: {
                display: true,
                color: document.documentElement.getAttribute('data-theme') === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'
              },
              ticks: {
                color: document.documentElement.getAttribute('data-theme') === 'dark' ? '#cbd5e1' : '#334155',
                callback: (val) => val + '%'
              }
            }
          }
        }
      });
    }

    return () => {
      if (lineChartInstance.current) {
        lineChartInstance.current.destroy();
        lineChartInstance.current = null;
      }
    };
  }, [activeProjectId, monitoring, sites]);

  // 3 Pie Charts (Status, Survival, Health over ENTIRE Project Duration)
  useEffect(() => {
    const currentProjId = activeProjectId === 'all' ? 'project-1' : activeProjectId;

    // 1. Status Chart Data
    const projMilestones = milestones.filter(m => m.projectId === currentProjId);
    const completedMs = projMilestones.filter(m => m.status === 'completed' || m.status === 'approved').length;
    const pendingMs = projMilestones.length - completedMs;

    // 2. Survival Chart Data
    const projSites = sites.filter(s => s.projectId === currentProjId).map(s => s.id);
    const projMon = monitoring.filter(m => projSites.includes(m.siteId) || m.projectId === currentProjId);
    let avgSurv = 0;
    if (projMon.length > 0) {
      const sum = projMon.reduce((acc, m) => acc + (Number(m.survival) || 0), 0);
      avgSurv = Math.round(sum / projMon.length);
    } else {
      avgSurv = 90;
    }
    const lossSurv = 100 - avgSurv;

    // 3. Health Chart Data
    let good = 0;
    let moderate = 0;
    let attention = 0;
    projMon.forEach(m => {
      const survival = Number(m.survival) || 0;
      if (survival >= 85) {
        good++;
      } else if (survival >= 80) {
        moderate++;
      } else {
        attention++;
      }
    });

    if (window.Chart) {
      // Create status chart
      const statusCtx = statusPieRef.current;
      if (statusCtx) {
        if (statusPieInstance.current) statusPieInstance.current.destroy();
        statusPieInstance.current = new window.Chart(statusCtx, {
          type: 'pie',
          data: {
            labels: ['Completed', 'Pending'],
            datasets: [{
              data: [completedMs || 1, pendingMs || 0],
              backgroundColor: ['#2e7d32', '#ffc107'],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
          }
        });
      }

      // Create survival chart
      const survivalCtx = survivalPieRef.current;
      if (survivalCtx) {
        if (survivalPieInstance.current) survivalPieInstance.current.destroy();
        survivalPieInstance.current = new window.Chart(survivalCtx, {
          type: 'pie',
          data: {
            labels: ['Survived', 'Lost'],
            datasets: [{
              data: [avgSurv, lossSurv],
              backgroundColor: ['#2e7d32', '#dc3545'],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
          }
        });
      }

      // Create health chart
      const healthCtx = healthPieRef.current;
      if (healthCtx) {
        if (healthPieInstance.current) healthPieInstance.current.destroy();
        healthPieInstance.current = new window.Chart(healthCtx, {
          type: 'pie',
          data: {
            labels: ['Good', 'Moderate', 'Needs Attention'],
            datasets: [{
              data: [good || 1, moderate || 0, attention || 0],
              backgroundColor: ['#2e7d32', '#ffc107', '#dc3545'],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
          }
        });
      }
    }

    return () => {
      if (statusPieInstance.current) { statusPieInstance.current.destroy(); statusPieInstance.current = null; }
      if (survivalPieInstance.current) { survivalPieInstance.current.destroy(); survivalPieInstance.current = null; }
      if (healthPieInstance.current) { healthPieInstance.current.destroy(); healthPieInstance.current = null; }
    };
  }, [activeProjectId, milestones, sites, monitoring]);

  // Helper functions for listings
  const getFilteredMilestones = () => {
    const currentProjId = activeProjectId === 'all' ? 'project-1' : activeProjectId;
    let filtered = milestones.filter(m => m.projectId === currentProjId);
    if (milestoneFilter === 'Weekly') {
      filtered = filtered.filter(m => m.frequency === 'Weekly');
    } else if (milestoneFilter === 'Monthly') {
      filtered = filtered.filter(m => m.frequency === 'Monthly');
    }
    filtered.sort((a, b) => {
      const aDone = a.status === 'completed' || a.status === 'approved';
      const bDone = b.status === 'completed' || b.status === 'approved';
      if (aDone === bDone) {
        return new Date(a.endDate || a.target) - new Date(b.endDate || b.target);
      }
      return aDone ? -1 : 1;
    });
    return filtered;
  };

  const getPhotoRecords = () => {
    const currentProjId = activeProjectId === 'all' ? 'project-1' : activeProjectId;
    const projSites = sites.filter(s => s.projectId === currentProjId).map(s => s.id);
    const filteredMon = monitoring.filter(m => projSites.includes(m.siteId) || m.projectId === currentProjId);
    const withPhotos = filteredMon.filter(m => m.photo && m.photo.trim() !== '');
    withPhotos.sort((a, b) => new Date(b.date) - new Date(a.date));
    return withPhotos;
  };

  const getActiveProjectName = () => {
    const currentProjId = activeProjectId === 'all' ? 'project-1' : activeProjectId;
    const proj = projects.find(p => p.id === currentProjId);
    return proj ? proj.name : 'Selected Project';
  };

  const getProjectTypeFromId = (id) => {
    const proj = projects.find(p => p.id === id);
    return proj ? proj.type : 'Afforestation';
  };

  const getProjectIdFromType = (type) => {
    const proj = projects.find(p => p.type === type);
    return proj ? proj.id : 'project-1';
  };

  return (
    <div id="view-dashboard" className="app-view">
      {/* Active Project Card */}
      <div className="card shadow-sm border-0 mb-4 p-4 active-scope-banner" style={{ borderRadius: '12px' }}>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <span className="text-success small fw-bold text-uppercase d-block mb-1">Active Project Scope</span>
            <h2 className="mb-0 font-weight-bold text-success-dark">{getActiveProjectName()}</h2>
          </div>
          
          <div className="d-flex align-items-center gap-2">
            <span className="small text-muted"><i className="bi bi-funnel-fill"></i> Project Type:</span>
            <select 
              className="form-select form-select-sm" 
              style={{ width: '220px', borderRadius: '8px' }}
              value={getProjectTypeFromId(activeProjectId)}
              disabled={currentUser?.role !== 'admin' && currentUser?.role !== 'manager'}
              onChange={(e) => setActiveProjectId(getProjectIdFromType(e.target.value))}
            >
              <option value="Afforestation">Afforestation</option>
              <option value="Deforestation">Deforestation</option>
              <option value="Forest Management">Forest Management</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Counter Row */}
      <div className="row g-4 mb-4">
        {/* Total Area */}
        <div className="col-xl-2 col-sm-6">
          <div className="card-stat card shadow-sm border-0">
            <div className="card-body p-4 d-flex align-items-center gap-3">
              <div className="stat-icon bg-success bg-opacity-10 text-success rounded-3 p-3">
                <i className="bi bi-tree" style={{ fontSize: '24px' }}></i>
              </div>
              <div>
                <h3 className="mb-0 font-weight-bold">
                  {stats.totalArea ? `${stats.totalArea.toLocaleString()} Ac` : '-'}
                </h3>
                <span className="text-muted small">Total Area</span>
              </div>
            </div>
          </div>
        </div>

        {/* Total Planted Trees (Editable by PM/Admin) */}
        <div className="col-xl-3 col-sm-6">
          <div className="card-stat card shadow-sm border-0">
            <div className="card-body p-4 d-flex align-items-center gap-3">
              <div className="stat-icon bg-info bg-opacity-10 text-info rounded-3 p-3">
                <i className="bi bi-flower1" style={{ fontSize: '24px' }}></i>
              </div>
              <div style={{ flexGrow: 1 }}>
                {isEditingPlanted ? (
                  <form onSubmit={handleSavePlantedTrees} className="d-flex align-items-center gap-2 mt-1">
                    <input 
                      type="number" 
                      className="form-control form-control-sm" 
                      style={{ width: '100px' }}
                      value={newPlantedVal} 
                      onChange={(e) => setNewPlantedVal(e.target.value)} 
                      required
                    />
                    <button type="submit" className="btn btn-sm btn-success p-1"><i className="bi bi-check-lg"></i></button>
                    <button type="button" className="btn btn-sm btn-secondary p-1" onClick={() => setIsEditingPlanted(false)}><i className="bi bi-x-lg"></i></button>
                  </form>
                ) : (
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <h3 className="mb-0 font-weight-bold">
                        {stats.totalTreesPlanted ? stats.totalTreesPlanted.toLocaleString() : '-'}
                      </h3>
                      <span className="text-muted small">Total Planted Trees</span>
                    </div>
                    {['admin', 'manager'].includes(currentUser?.role) && (
                      <button 
                        type="button" 
                        className="btn btn-link p-0 text-success" 
                        onClick={() => {
                          setIsEditingPlanted(true);
                          setNewPlantedVal(stats.totalTreesPlanted);
                        }}
                        title="Edit Planted Trees"
                      >
                        <i className="bi bi-pencil-square" style={{ fontSize: '16px' }}></i>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Live Tree Count */}
        <div className="col-xl-2 col-sm-6">
          <div className="card-stat card shadow-sm border-0">
            <div className="card-body p-4 d-flex align-items-center gap-3">
              <div className="stat-icon bg-success bg-opacity-10 text-success rounded-3 p-3">
                <i className="bi bi-heart-pulse-fill" style={{ fontSize: '24px' }}></i>
              </div>
              <div>
                <h3 className="mb-0 font-weight-bold">
                  {stats.liveTreeCount ? stats.liveTreeCount.toLocaleString() : '0'}
                </h3>
                <span className="text-muted small">Live Tree Count</span>
              </div>
            </div>
          </div>
        </div>

        {/* Survival Rate (With Circular Progress SVG Chart) */}
        <div className="col-xl-3 col-sm-6">
          <div className="card-stat card shadow-sm border-0">
            <div className="card-body p-3 d-flex align-items-center gap-3">
              <div className="circular-chart-container position-relative" style={{ width: '60px', height: '60px' }}>
                <svg width="60" height="60" viewBox="0 0 36 36" className="circular-chart success">
                  <path className="circle-bg"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="#e6f4ea" strokeWidth="3"
                  />
                  <path className="circle"
                    strokeDasharray={`${stats.avgSurvival || 0}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="#2e7d32" strokeWidth="3" strokeLinecap="round"
                  />
                  <text x="18" y="20.35" className="percentage" fontSize="8" textAnchor="middle" fontWeight="bold" fill="#2e7d32">
                    {stats.avgSurvival || 0}%
                  </text>
                </svg>
              </div>
              <div>
                <h3 className="mb-0 font-weight-bold">{stats.avgSurvival || 0}%</h3>
                <span className="text-muted small">Survival Rate</span>
              </div>
            </div>
          </div>
        </div>

        {/* Next Monitoring Due */}
        <div className="col-xl-2 col-sm-6">
          <div className={`card-stat card shadow-sm border-0 ${stats.isOverdue ? 'border-start-4-danger' : ''}`} style={stats.isOverdue ? { borderLeft: '4px solid #dc3545' } : {}}>
            <div className="card-body p-3 d-flex align-items-center gap-2">
              <div className={`stat-icon rounded-3 p-2.5 ${stats.isOverdue ? 'bg-danger bg-opacity-10 text-danger' : 'bg-warning bg-opacity-10 text-warning'}`}>
                <i className={`bi ${stats.isOverdue ? 'bi-exclamation-triangle-fill' : 'bi-calendar-event'}`} style={{ fontSize: '20px' }}></i>
              </div>
              <div className="overflow-hidden" style={{ flexGrow: 1 }}>
                <span className={`fw-bold text-truncate d-block ${stats.isOverdue ? 'text-danger' : 'text-success-dark'}`} style={{ fontSize: '12px' }}>
                  {stats.nextMonSite}
                </span>
                <span className="text-muted d-block text-truncate" style={{ fontSize: '11px' }}>
                  Due: {stats.nextMonDate || 'None'}
                </span>
                <strong className={`small d-block ${stats.isOverdue ? 'text-danger fw-bold' : 'text-muted'}`}>
                  {stats.nextMonDays || 'No schedule'}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map and Survival Rate Trend Row */}
      <div className="row g-4 mb-4">
        <div className="col-lg-7">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white py-3 border-0">
              <h5 className="mb-0 font-weight-bold text-success">
                <i className="bi bi-geo-alt-fill me-1"></i> Interactive Sites Boundary Polygons Map
              </h5>
            </div>
            <div className="card-body p-0" style={{ minHeight: '350px' }}>
              <LeafletMap 
                projects={projects}
                sites={sites}
                drones={drones}
                activeProjectId={activeProjectId === 'all' ? 'project-1' : activeProjectId}
              />
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white py-3 border-0">
              <h5 className="mb-0 font-weight-bold text-success">
                <i className="bi bi-graph-up me-1"></i> Survival Rate Trend
              </h5>
            </div>
            <div className="card-body position-relative d-flex align-items-center justify-content-center" style={{ minHeight: '350px' }}>
              {monitoring.filter(m => m.projectId === (activeProjectId === 'all' ? 'project-1' : activeProjectId) || (sites.find(s => s.id === m.siteId && s.projectId === (activeProjectId === 'all' ? 'project-1' : activeProjectId)))).length === 0 ? (
                <div className="text-center text-muted">No monitoring data available for trend</div>
              ) : (
                <div className="w-100 h-100" style={{ position: 'relative', height: '300px' }}>
                  <canvas ref={lineChartRef}></canvas>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Weather Section directly below Map */}
      <div className="mb-4">
        <WeatherSection 
          weatherHistory={weatherHistory}
          loading={weatherLoading}
        />
      </div>

      {/* Milestones, Monitoring Summary, and Field Photos Row */}
      <div className="row g-4 mb-4">
        {/* Milestone Status */}
        <div className="col-lg-4 col-md-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white py-3 border-0 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 font-weight-bold text-success">
                <i className="bi bi-flag-fill me-2"></i> Milestone Status
              </h5>
              <select 
                className="form-select form-select-sm" 
                style={{ width: '120px', borderRadius: '8px' }}
                value={milestoneFilter}
                onChange={(e) => setMilestoneFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>
            <div className="card-body p-3 overflow-auto" style={{ maxHeight: '350px' }}>
              {getFilteredMilestones().length === 0 ? (
                <div className="text-center text-muted py-5">No milestones scheduled</div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {getFilteredMilestones().map(ms => {
                    const isCompleted = ms.status === 'completed' || ms.status === 'approved';
                    return (
                      <div key={ms.id} className="d-flex align-items-center justify-content-between p-3 border rounded-3" style={{ background: 'var(--bg-light)' }}>
                        <div className="d-flex align-items-center gap-3">
                          <div className={isCompleted ? "text-success" : "text-info"}>
                            <i className={isCompleted ? "bi bi-check-circle-fill" : "bi bi-clock-fill"} style={{ fontSize: '24px' }}></i>
                          </div>
                          <div>
                            <h6 className="mb-0 fw-bold" style={{ fontSize: '14px' }}>{ms.name}</h6>
                            <small className="text-muted d-block" style={{ fontSize: '11px' }}>{ms.description}</small>
                          </div>
                        </div>
                        <div className="text-end">
                          <span className={`badge ${isCompleted ? 'bg-success bg-opacity-10 text-success' : 'bg-info bg-opacity-10 text-info'} text-capitalize`} style={{ fontSize: '10px' }}>
                            {isCompleted ? 'Completed' : 'Upcoming'}
                          </span>
                          <small className="text-muted d-block mt-1" style={{ fontSize: '11px' }}>
                            {isCompleted ? (ms.completion || ms.endDate || ms.target) : (ms.endDate || ms.target)}
                          </small>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Monitoring Summary (3 Pie Charts) */}
        <div className="col-lg-5 col-md-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white py-3 border-0 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 font-weight-bold text-success">
                <i className="bi bi-pie-chart-fill me-2"></i> Monitoring Summary Analytics
              </h5>
            </div>
            <div className="card-body p-3">
              <div className="row g-2 align-items-center justify-content-center">
                {/* Status Pie */}
                <div className="col-4 text-center">
                  <div style={{ height: '110px', position: 'relative' }}>
                    <canvas ref={statusPieRef}></canvas>
                  </div>
                  <small className="d-block mt-2 fw-semibold text-success-dark" style={{ fontSize: '11px' }}>
                    Monitoring Tasks
                  </small>
                </div>
                {/* Survival Pie */}
                <div className="col-4 text-center">
                  <div style={{ height: '110px', position: 'relative' }}>
                    <canvas ref={survivalPieRef}></canvas>
                  </div>
                  <small className="d-block mt-2 fw-semibold text-success-dark" style={{ fontSize: '11px' }}>
                    Survival vs Loss
                  </small>
                </div>
                {/* Health Pie */}
                <div className="col-4 text-center">
                  <div style={{ height: '110px', position: 'relative' }}>
                    <canvas ref={healthPieRef}></canvas>
                  </div>
                  <small className="d-block mt-2 fw-semibold text-success-dark" style={{ fontSize: '11px' }}>
                    Health Classification
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Field Photos */}
        <div className="col-lg-3 col-md-12">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white py-3 border-0 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 font-weight-bold text-success">
                <i className="bi bi-images me-2"></i> Recent Field Photos
              </h5>
            </div>
            <div className="card-body p-2" style={{ overflowY: 'auto', maxHeight: '350px' }}>
              {getPhotoRecords().length === 0 ? (
                <div className="text-center text-muted py-5">No field photos uploaded</div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {getPhotoRecords().map(rec => (
                    <div key={rec.id} className="border rounded p-2 bg-light">
                      <div className="d-flex gap-2 align-items-center">
                        <img 
                          src={rec.photo} 
                          alt="Milestone" 
                          className="rounded object-fit-cover" 
                          style={{ width: '60px', height: '60px' }}
                        />
                        <div className="overflow-hidden">
                          <strong className="d-block text-truncate text-success-dark" style={{ fontSize: '11.5px' }}>
                            {rec.milestoneName || 'Verification Audit'}
                          </strong>
                          <span className="text-muted d-block" style={{ fontSize: '10.5px' }}>
                            Date: {rec.date}
                          </span>
                          <span className="text-muted d-block text-truncate" style={{ fontSize: '10.5px' }}>
                            Site: {rec.siteName} | By: {rec.officer}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
