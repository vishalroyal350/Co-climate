const DroneRecord = require('../models/Drone');
const { isDbConnected, memoryDb } = require('../config/db');
const { createNotification } = require('../utils/helpers');

async function getDrones(req, res) {
  try {
    if (!isDbConnected()) {
      return res.json(memoryDb.drones);
    }
    const records = await DroneRecord.find({}).sort({ createdAt: -1 }).lean();
    return res.json(records);
  } catch (error) {
    console.error('Drone fetch error:', error);
    return res.status(500).json({ success: false, message: 'Unable to fetch drone records' });
  }
}

async function saveDrone(req, res) {
  try {
    const payload = req.body || {};
    const recordId = payload.id || `drone-${Date.now()}`;
    let isNew = false;

    if (!isDbConnected()) {
      const idx = memoryDb.drones.findIndex(d => d.id === recordId);
      if (idx !== -1) {
        memoryDb.drones[idx] = { ...memoryDb.drones[idx], ...payload, id: recordId };
      } else {
        isNew = true;
        const newRecord = { ...payload, id: recordId };
        memoryDb.drones.unshift(newRecord);
      }
    } else {
      const exists = await DroneRecord.findOne({ id: recordId }).lean();
      if (!exists) isNew = true;

      await DroneRecord.findOneAndUpdate(
        { id: recordId },
        { $set: { ...payload, id: recordId } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    const updatedRecord = isDbConnected()
      ? await DroneRecord.findOne({ id: recordId }).lean()
      : memoryDb.drones.find(d => d.id === recordId);

    // Notify: Drone Upload Completed
    if (isNew || payload.photo) {
      await createNotification({
        type: 'Drone Upload Completed',
        message: `Drone mission "${updatedRecord.droneName}" telemetry and assets uploaded successfully.`,
        priority: 'low',
        role: 'manager'
      });
    }

    return res.json(updatedRecord);
  } catch (error) {
    console.error('Drone save error:', error);
    return res.status(500).json({ success: false, message: 'Unable to save drone record' });
  }
}

async function deleteDrone(req, res) {
  try {
    const id = req.params.id;
    if (!isDbConnected()) {
      memoryDb.drones = memoryDb.drones.filter(d => d.id !== id);
      return res.json({ success: true, id });
    }
    await DroneRecord.deleteOne({ id });
    return res.json({ success: true, id });
  } catch (error) {
    console.error('Drone delete error:', error);
    return res.status(500).json({ success: false, message: 'Unable to delete drone record' });
  }
}

module.exports = {
  getDrones,
  saveDrone,
  deleteDrone
};
