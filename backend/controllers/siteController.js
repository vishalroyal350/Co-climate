const SiteRecord = require('../models/Site');
const { isDbConnected, memoryDb } = require('../config/db');

async function getSites(req, res) {
  try {
    if (!isDbConnected()) {
      return res.json(memoryDb.sites);
    }
    const records = await SiteRecord.find({}).sort({ createdAt: -1 }).lean();
    return res.json(records);
  } catch (error) {
    console.error('Site fetch error:', error);
    return res.status(500).json({ success: false, message: 'Unable to fetch sites' });
  }
}

async function saveSite(req, res) {
  try {
    const payload = req.body || {};
    const recordId = payload.id || `site-${Date.now()}`;

    if (!isDbConnected()) {
      const savedRecord = { ...payload, id: recordId };
      const idx = memoryDb.sites.findIndex(s => s.id === recordId);
      if (idx !== -1) {
        memoryDb.sites[idx] = savedRecord;
      } else {
        memoryDb.sites.unshift(savedRecord);
      }
      return res.json(savedRecord);
    }

    const savedRecord = await SiteRecord.findOneAndUpdate(
      { id: recordId },
      { $set: { ...payload, id: recordId } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
    return res.json(savedRecord);
  } catch (error) {
    console.error('Site save error:', error);
    return res.status(500).json({ success: false, message: 'Unable to save site' });
  }
}

async function deleteSite(req, res) {
  try {
    const id = req.params.id;
    if (!isDbConnected()) {
      memoryDb.sites = memoryDb.sites.filter(s => s.id !== id);
      return res.json({ success: true, id });
    }
    await SiteRecord.deleteOne({ id });
    return res.json({ success: true, id });
  } catch (error) {
    console.error('Site delete error:', error);
    return res.status(500).json({ success: false, message: 'Unable to delete site' });
  }
}

module.exports = {
  getSites,
  saveSite,
  deleteSite
};
