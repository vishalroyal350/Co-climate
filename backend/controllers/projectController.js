const ProjectRecord = require('../models/Project');
const { isDbConnected, memoryDb } = require('../config/db');

async function getProjects(req, res) {
  try {
    if (!isDbConnected()) {
      return res.json(memoryDb.projects);
    }
    const records = await ProjectRecord.find({}).sort({ createdAt: -1 }).lean();
    return res.json(records);
  } catch (error) {
    console.error('Project fetch error:', error);
    return res.status(500).json({ success: false, message: 'Unable to fetch projects' });
  }
}

async function saveProject(req, res) {
  try {
    const payload = req.body || {};
    const recordId = payload.id || `proj-${Date.now()}`;

    if (!isDbConnected()) {
      const savedRecord = { ...payload, id: recordId };
      const idx = memoryDb.projects.findIndex(p => p.id === recordId);
      if (idx !== -1) {
        memoryDb.projects[idx] = savedRecord;
      } else {
        memoryDb.projects.unshift(savedRecord);
      }
      return res.json(savedRecord);
    }

    const savedRecord = await ProjectRecord.findOneAndUpdate(
      { id: recordId },
      { $set: { ...payload, id: recordId } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
    return res.json(savedRecord);
  } catch (error) {
    console.error('Project save error:', error);
    return res.status(500).json({ success: false, message: 'Unable to save project' });
  }
}

async function deleteProject(req, res) {
  try {
    const id = req.params.id;
    if (!isDbConnected()) {
      memoryDb.projects = memoryDb.projects.filter(p => p.id !== id);
      return res.json({ success: true, id });
    }
    await ProjectRecord.deleteOne({ id });
    return res.json({ success: true, id });
  } catch (error) {
    console.error('Project delete error:', error);
    return res.status(500).json({ success: false, message: 'Unable to delete project' });
  }
}

module.exports = {
  getProjects,
  saveProject,
  deleteProject
};
