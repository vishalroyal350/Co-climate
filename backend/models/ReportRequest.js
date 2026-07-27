const mongoose = require('mongoose');

const reportRequestSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    projectId: { type: String, required: true },
    projectName: { type: String, default: '' },
    officerId: { type: String, required: true },
    officerName: { type: String, default: '' },
    requestDate: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    settings: {
      title: { type: String, default: 'Restoration Progress Report' },
      includeMilestones: { type: Boolean, default: true },
      includeDroneData: { type: Boolean, default: true },
      includeWeatherData: { type: Boolean, default: true }
    },
    managerRemarks: { type: String, default: '' },
    pdfUrl: { type: String, default: '' } // Download link or data URI
  },
  { timestamps: true }
);

module.exports = mongoose.models.ReportRequest || mongoose.model('ReportRequest', reportRequestSchema);
