const MilestoneRecord = require('../models/Milestone');
const { isDbConnected, memoryDb } = require('../config/db');
const { createNotification } = require('../utils/helpers');

async function getMilestones(req, res) {
  try {
    if (!isDbConnected()) {
      return res.json(memoryDb.milestones);
    }
    const records = await MilestoneRecord.find({}).sort({ createdAt: -1 }).lean();
    return res.json(records);
  } catch (error) {
    console.error('Milestone fetch error:', error);
    return res.status(500).json({ success: false, message: 'Unable to fetch milestones' });
  }
}

async function saveMilestone(req, res) {
  try {
    const payload = req.body || {};
    const recordId = payload.id || `ms-${Date.now()}`;
    let isNew = false;
    let oldRecord = null;

    if (!isDbConnected()) {
      const idx = memoryDb.milestones.findIndex(m => m.id === recordId);
      if (idx !== -1) {
        oldRecord = memoryDb.milestones[idx];
        memoryDb.milestones[idx] = { ...memoryDb.milestones[idx], ...payload, id: recordId };
      } else {
        isNew = true;
        const newRecord = { ...payload, id: recordId };
        memoryDb.milestones.push(newRecord);
      }
    } else {
      oldRecord = await MilestoneRecord.findOne({ id: recordId }).lean();
      if (!oldRecord) {
        isNew = true;
      }
      await MilestoneRecord.findOneAndUpdate(
        { id: recordId },
        { $set: { ...payload, id: recordId } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    const updatedRecord = isDbConnected() 
      ? await MilestoneRecord.findOne({ id: recordId }).lean()
      : memoryDb.milestones.find(m => m.id === recordId);

    // CENTRALIZED NOTIFICATION WORKFLOWS
    // 1. Milestone Assigned
    if (isNew) {
      await createNotification({
        type: 'Milestone Assigned',
        message: `New milestone scheduled: "${updatedRecord.name}"`,
        priority: 'medium',
        role: 'field_officer'
      });
    }

    // 2. State transition changes
    if (oldRecord && oldRecord.status !== updatedRecord.status) {
      if (updatedRecord.status === 'completed') {
        // Milestone Approved
        await createNotification({
          type: 'Milestone Approved',
          message: `Milestone "${updatedRecord.name}" has been approved by the Project Manager. Remarks: ${updatedRecord.remarks || 'None'}`,
          priority: 'medium',
          role: 'field_officer'
        });
        
        // Score Published
        if (updatedRecord.score) {
          await createNotification({
            type: 'Score Published',
            message: `Milestone "${updatedRecord.name}" evaluated. Score: ${updatedRecord.score}`,
            priority: 'medium',
            role: 'field_officer'
          });
        }
      } else if (updatedRecord.status === 'rejected') {
        // Milestone Rejected
        await createNotification({
          type: 'Milestone Rejected',
          message: `Milestone "${updatedRecord.name}" rejected. Remarks: ${updatedRecord.remarks}`,
          priority: 'high',
          role: 'field_officer'
        });
      }
    }

    return res.json(updatedRecord);
  } catch (error) {
    console.error('Milestone save error:', error);
    return res.status(500).json({ success: false, message: 'Unable to save milestone' });
  }
}

async function deleteMilestone(req, res) {
  try {
    const id = req.params.id;
    if (!isDbConnected()) {
      memoryDb.milestones = memoryDb.milestones.filter(m => m.id !== id);
      return res.json({ success: true, id });
    }
    await MilestoneRecord.deleteOne({ id });
    return res.json({ success: true, id });
  } catch (error) {
    console.error('Milestone delete error:', error);
    return res.status(500).json({ success: false, message: 'Unable to delete milestone' });
  }
}

module.exports = {
  getMilestones,
  saveMilestone,
  deleteMilestone
};
