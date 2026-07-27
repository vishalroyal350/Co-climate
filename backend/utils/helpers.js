const Alert = require('../models/Notification');
const { isDbConnected, memoryDb } = require('../config/db');

/**
 * Creates a centralized notification alert
 */
async function createNotification({ type, message, priority = 'medium', userId = '', role = '' }) {
  const alertId = `al-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const dateStr = new Date().toISOString().split('T')[0];

  const payload = {
    id: alertId,
    type,
    message,
    priority,
    date: dateStr,
    status: 'unread',
    userId,
    role
  };

  if (!isDbConnected()) {
    memoryDb.alerts.unshift(payload);
    console.log(`[Alert - Demo Mode] ${type}: ${message}`);
    return payload;
  }

  try {
    const alert = await Alert.create(payload);
    console.log(`[Alert - DB Mode] Created: ${type}`);
    return alert;
  } catch (error) {
    console.error('Error creating notification:', error.message);
    return null;
  }
}

module.exports = {
  createNotification
};
