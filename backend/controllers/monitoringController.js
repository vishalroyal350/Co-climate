const MonitoringRecord = require('../models/Monitoring');
const SiteRecord = require('../models/Site');
const { isDbConnected, memoryDb } = require('../config/db');
const { createNotification } = require('../utils/helpers');

async function getMonitoring(req, res) {
  try {
    if (!isDbConnected()) {
      return res.json(memoryDb.monitoring);
    }
    const records = await MonitoringRecord.find({}).sort({ date: -1, createdAt: -1 }).lean();
    return res.json(records.map(record => ({
      ...record,
      id: record.id || record._id.toString()
    })));
  } catch (error) {
    console.error('Monitoring fetch error:', error);
    return res.status(500).json({ success: false, message: 'Unable to fetch monitoring records' });
  }
}

async function saveMonitoring(req, res) {
  try {
    const payload = req.body || {};
    const recordId = payload.id || `mon-${Date.now()}`;
    const survivalRate = Number(payload.survival) || 0;

    // Trigger high-priority alert if survival rate is critically low (< 80)
    if (survivalRate < 80) {
      let siteName = 'Site Area';
      if (!isDbConnected()) {
        const siteObj = memoryDb.sites.find(s => s.id === payload.siteId);
        if (siteObj) siteName = siteObj.name;
      } else {
        const siteObj = await SiteRecord.findOne({ id: payload.siteId });
        if (siteObj) siteName = siteObj.name;
      }

      await createNotification({
        type: 'Low Survival Rate',
        message: `Survival critical on ${siteName} (${survivalRate}% rate logged by ${payload.officer || 'Auditor'})`,
        priority: 'high',
        role: 'manager' // Target managers
      });
    }

    if (!isDbConnected()) {
      const savedRecord = { ...payload, id: recordId };
      const idx = memoryDb.monitoring.findIndex(m => m.id === recordId);
      if (idx !== -1) {
        memoryDb.monitoring[idx] = savedRecord;
      } else {
        memoryDb.monitoring.unshift(savedRecord);
      }
      return res.json(savedRecord);
    }

    const savedRecord = await MonitoringRecord.findOneAndUpdate(
      { id: recordId },
      { $set: { ...payload, id: recordId } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
    return res.json({
      ...savedRecord,
      id: savedRecord.id || savedRecord._id.toString()
    });
  } catch (error) {
    console.error('Monitoring save error:', error);
    return res.status(500).json({ success: false, message: 'Unable to save monitoring record' });
  }
}

async function deleteMonitoring(req, res) {
  try {
    const id = req.params.id;
    if (!isDbConnected()) {
      memoryDb.monitoring = memoryDb.monitoring.filter(m => m.id !== id);
      return res.json({ success: true, id });
    }
    await MonitoringRecord.deleteOne({ id });
    return res.json({ success: true, id });
  } catch (error) {
    console.error('Monitoring delete error:', error);
    return res.status(500).json({ success: false, message: 'Unable to delete monitoring record' });
  }
}

module.exports = {
  getMonitoring,
  saveMonitoring,
  deleteMonitoring
};
