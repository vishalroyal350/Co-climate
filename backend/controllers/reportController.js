const ReportRequest = require('../models/ReportRequest');
const ProjectRecord = require('../models/Project');
const SiteRecord = require('../models/Site');
const MilestoneRecord = require('../models/Milestone');
const DroneRecord = require('../models/Drone');
const WeatherRecord = require('../models/Weather');
const { isDbConnected, memoryDb } = require('../config/db');
const { createNotification } = require('../utils/helpers');
const { generateReportPDF } = require('../services/pdfService');

async function getReportRequests(req, res) {
  try {
    if (!isDbConnected()) {
      return res.json(memoryDb.reportRequests);
    }
    const records = await ReportRequest.find({}).sort({ createdAt: -1 }).lean();
    return res.json(records);
  } catch (error) {
    console.error('Report requests fetch error:', error);
    return res.status(500).json({ success: false, message: 'Unable to fetch report requests' });
  }
}

async function createReportRequest(req, res) {
  try {
    const payload = req.body || {};
    const recordId = payload.id || `req-${Date.now()}`;
    const dateStr = new Date().toISOString().split('T')[0];

    const newRequest = {
      id: recordId,
      projectId: payload.projectId,
      projectName: payload.projectName || 'Project',
      officerId: payload.officerId,
      officerName: payload.officerName || 'Field Officer',
      requestDate: dateStr,
      status: 'pending',
      settings: {
        title: payload.settings?.title || 'Restoration Progress Report',
        includeMilestones: payload.settings?.includeMilestones !== false,
        includeDroneData: payload.settings?.includeDroneData !== false,
        includeWeatherData: payload.settings?.includeWeatherData !== false
      },
      managerRemarks: '',
      pdfUrl: ''
    };

    if (!isDbConnected()) {
      memoryDb.reportRequests.unshift(newRequest);
      
      // Notify PM about report request
      await createNotification({
        type: 'Report Requested',
        message: `Field Officer ${newRequest.officerName} requested a report for "${newRequest.projectName}"`,
        priority: 'medium',
        role: 'manager'
      });

      return res.status(201).json(newRequest);
    }

    const savedRequest = await ReportRequest.create(newRequest);
    
    // Notify PM about report request
    await createNotification({
      type: 'Report Requested',
      message: `Field Officer ${newRequest.officerName} requested a report for "${newRequest.projectName}"`,
      priority: 'medium',
      role: 'manager'
    });

    return res.status(201).json(savedRequest);
  } catch (error) {
    console.error('Report request creation error:', error);
    return res.status(500).json({ success: false, message: 'Unable to create report request' });
  }
}

async function updateReportRequest(req, res) {
  try {
    const { id } = req.params;
    const { status, settings, managerRemarks } = req.body || {};

    let targetRequest = null;
    if (!isDbConnected()) {
      const idx = memoryDb.reportRequests.findIndex(r => r.id === id);
      if (idx === -1) return res.status(404).json({ success: false, message: 'Report request not found' });
      targetRequest = memoryDb.reportRequests[idx];
    } else {
      targetRequest = await ReportRequest.findOne({ id }).lean();
      if (!targetRequest) return res.status(404).json({ success: false, message: 'Report request not found' });
    }

    // Apply settings and remarks
    if (settings) targetRequest.settings = { ...targetRequest.settings, ...settings };
    if (managerRemarks !== undefined) targetRequest.managerRemarks = managerRemarks;
    if (status) targetRequest.status = status;

    // Handle approval & PDF generation
    if (status === 'approved') {
      let project = null;
      let sites = [];
      let milestones = [];
      let drones = [];
      let weather = [];

      if (!isDbConnected()) {
        project = memoryDb.projects.find(p => p.id === targetRequest.projectId) || { id: targetRequest.projectId, name: targetRequest.projectName };
        sites = memoryDb.sites.filter(s => s.projectId === targetRequest.projectId);
        milestones = memoryDb.milestones.filter(m => m.projectId === targetRequest.projectId);
        drones = memoryDb.drones.filter(d => d.siteId && sites.map(s => s.id).includes(d.siteId));
        weather = memoryDb.weather.filter(w => w.projectId === targetRequest.projectId);
      } else {
        project = await ProjectRecord.findOne({ id: targetRequest.projectId }).lean() || { id: targetRequest.projectId, name: targetRequest.projectName };
        sites = await SiteRecord.find({ projectId: targetRequest.projectId }).lean();
        milestones = await MilestoneRecord.find({ projectId: targetRequest.projectId }).lean();
        const siteIds = sites.map(s => s.id);
        drones = await DroneRecord.find({ siteId: { $in: siteIds } }).lean();
        weather = await WeatherRecord.find({ projectId: targetRequest.projectId }).lean();
      }

      // Generate base64 PDF
      try {
        const pdfDataUri = await generateReportPDF(project, sites, milestones, drones, weather, targetRequest.settings);
        targetRequest.pdfUrl = pdfDataUri;
      } catch (pdfErr) {
        console.error('PDF Generation failed:', pdfErr);
        return res.status(500).json({ success: false, message: 'PDF Generation failed', error: pdfErr.message });
      }

      // Notify FO: Report Approved
      await createNotification({
        type: 'Report Approved',
        message: `Report for "${targetRequest.projectName}" has been approved and is ready to download.`,
        priority: 'medium',
        userId: targetRequest.officerId
      });

    } else if (status === 'rejected') {
      // Notify FO: Report Rejected
      await createNotification({
        type: 'Report Rejected',
        message: `Report request for "${targetRequest.projectName}" was rejected: ${managerRemarks || 'No remarks provided'}`,
        priority: 'high',
        userId: targetRequest.officerId
      });
    }

    if (!isDbConnected()) {
      const idx = memoryDb.reportRequests.findIndex(r => r.id === id);
      memoryDb.reportRequests[idx] = targetRequest;
      return res.json(targetRequest);
    }

    const updated = await ReportRequest.findOneAndUpdate(
      { id },
      { $set: targetRequest },
      { new: true }
    ).lean();

    return res.json(updated);
  } catch (error) {
    console.error('Report request update error:', error);
    return res.status(500).json({ success: false, message: 'Unable to update report request' });
  }
}

async function generateCustomReport(req, res) {
  try {
    const { reportType, projectType, dateRange } = req.body || {};
    if (!reportType || !projectType || !dateRange) {
      return res.status(400).json({ success: false, message: 'All filters (reportType, projectType, dateRange) are required' });
    }

    const today = new Date();
    let thresholdDate = new Date();
    if (dateRange === 'Last 1 Month') {
      thresholdDate.setMonth(today.getMonth() - 1);
    } else if (dateRange === 'Last 3 Months') {
      thresholdDate.setMonth(today.getMonth() - 3);
    } else if (dateRange === 'Last 6 Months') {
      thresholdDate.setMonth(today.getMonth() - 6);
    }

    let projects = [];
    let sites = [];
    let milestones = [];
    let drones = [];
    let weather = [];
    let monitoring = [];

    if (!isDbConnected()) {
      projects = memoryDb.projects.filter(p => p.type === projectType);
      const projectIds = projects.map(p => p.id);
      sites = memoryDb.sites.filter(s => projectIds.includes(s.projectId));
      const siteIds = sites.map(s => s.id);
      
      milestones = memoryDb.milestones.filter(m => projectIds.includes(m.projectId) && new Date(m.endDate || m.target || m.createdAt) >= thresholdDate);
      drones = memoryDb.drones.filter(d => (d.projectId && projectIds.includes(d.projectId)) || (d.siteId && siteIds.includes(d.siteId)));
      weather = memoryDb.weather.filter(w => projectIds.includes(w.projectId) && new Date(w.date) >= thresholdDate);
      monitoring = memoryDb.monitoring.filter(m => (m.projectId && projectIds.includes(m.projectId)) || (m.siteId && siteIds.includes(m.siteId)));
    } else {
      const ProjectRecord = require('../models/Project');
      const SiteRecord = require('../models/Site');
      const MilestoneRecord = require('../models/Milestone');
      const DroneRecord = require('../models/Drone');
      const WeatherRecord = require('../models/Weather');
      const MonitoringRecord = require('../models/Monitoring');

      projects = await ProjectRecord.find({ type: projectType }).lean();
      const projectIds = projects.map(p => p.id);
      sites = await SiteRecord.find({ projectId: { $in: projectIds } }).lean();
      const siteIds = sites.map(s => s.id);

      milestones = await MilestoneRecord.find({
        projectId: { $in: projectIds },
        $or: [
          { endDate: { $gte: thresholdDate.toISOString().split('T')[0] } },
          { target: { $gte: thresholdDate.toISOString().split('T')[0] } }
        ]
      }).lean();

      drones = await DroneRecord.find({
        $or: [
          { projectId: { $in: projectIds } },
          { siteId: { $in: siteIds } }
        ]
      }).lean();

      weather = await WeatherRecord.find({
        projectId: { $in: projectIds },
        date: { $gte: thresholdDate.toISOString().split('T')[0] }
      }).lean();

      monitoring = await MonitoringRecord.find({
        $or: [
          { projectId: { $in: projectIds } },
          { siteId: { $in: siteIds } }
        ]
      }).lean();
    }

    const { generateCustomReportPDF } = require('../services/pdfService');
    const pdfDataUri = await generateCustomReportPDF({
      reportType,
      projectType,
      dateRange,
      projects,
      sites,
      milestones,
      drones,
      weather,
      monitoring
    });

    return res.json({
      success: true,
      pdfUrl: pdfDataUri,
      pdfBase64: pdfDataUri,
      previewData: {
        reportType,
        projectType,
        dateRange,
        projectCount: projects.length,
        siteCount: sites.length,
        milestoneCount: milestones.length,
        droneCount: drones.length,
        weatherCount: weather.length,
        monitoringCount: monitoring.length,
        projects: projects.map(p => p.name),
        sites: sites.map(s => s.name)
      }
    });

  } catch (error) {
    console.error('Custom report generation error:', error);
    return res.status(500).json({ success: false, message: 'Unable to generate custom report', error: error.message });
  }
}

module.exports = {
  getReportRequests,
  createReportRequest,
  updateReportRequest,
  generateCustomReport
};
