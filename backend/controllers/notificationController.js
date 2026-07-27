const AlertRecord = require('../models/Notification');
const { isDbConnected, memoryDb } = require('../config/db');

async function getAlerts(req, res) {
  try {
    if (!isDbConnected()) {
      return res.json(memoryDb.alerts);
    }
    const records = await AlertRecord.find({}).sort({ createdAt: -1 }).lean();
    return res.json(records);
  } catch (error) {
    console.error('Alert fetch error:', error);
    return res.status(500).json({ success: false, message: 'Unable to fetch alerts' });
  }
}

async function saveAlert(req, res) {
  try {
    const payload = req.body || {};
    const recordId = payload.id || `al-${Date.now()}`;

    if (!isDbConnected()) {
      const idx = memoryDb.alerts.findIndex(a => a.id === recordId);
      const savedRecord = { ...payload, id: recordId };
      if (idx !== -1) {
        memoryDb.alerts[idx] = { ...memoryDb.alerts[idx], ...savedRecord };
      } else {
        memoryDb.alerts.unshift(savedRecord);
      }
      return res.json(memoryDb.alerts.find(a => a.id === recordId));
    }

    const savedRecord = await AlertRecord.findOneAndUpdate(
      { id: recordId },
      { $set: { ...payload, id: recordId } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
    return res.json(savedRecord);
  } catch (error) {
    console.error('Alert save error:', error);
    return res.status(500).json({ success: false, message: 'Unable to save alert' });
  }
}

async function deleteAlert(req, res) {
  try {
    const id = req.params.id;
    if (!isDbConnected()) {
      memoryDb.alerts = memoryDb.alerts.filter(a => a.id !== id);
      return res.json({ success: true, id });
    }
    await AlertRecord.deleteOne({ id });
    return res.json({ success: true, id });
  } catch (error) {
    console.error('Alert delete error:', error);
    return res.status(500).json({ success: false, message: 'Unable to delete alert' });
  }
}

module.exports = {
  getAlerts,
  saveAlert,
  deleteAlert
};
