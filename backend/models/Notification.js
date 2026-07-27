const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    type: { type: String, default: '' },
    message: { type: String, default: '' },
    priority: { type: String, default: 'medium' },
    date: { type: String, default: '' },
    status: { type: String, default: 'unread' }, // 'unread' or 'read'
    userId: { type: String, default: '' }, // Specific target user ID
    role: { type: String, default: '' } // Specific target role
  },
  { timestamps: true }
);

module.exports = mongoose.models.AlertRecord || mongoose.model('AlertRecord', alertSchema);
