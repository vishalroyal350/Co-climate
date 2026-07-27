const mongoose = require('mongoose');

const monitoringSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    date: { type: String, required: true },
    siteId: { type: String, default: '' },
    siteName: { type: String, default: '' },
    projectId: { type: String, default: '' },
    duration: { type: String, default: '' },
    officer: { type: String, default: '' },
    implementationStrategy: { type: String, default: '' }, // path or data URI for strategy doc
    output: { type: String, default: '' }, // long text
    survival: { type: String, default: '' }, // rate
    trees: { type: String, default: '' }, // live count
    remarks: { type: String, default: '' },
    photo: { type: String, default: '' }, // primary picture
    attachments: { type: [String], default: [] }, // other uploaded files
    verified: { type: Boolean, default: false },
    milestoneName: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.models.MonitoringRecord || mongoose.model('MonitoringRecord', monitoringSchema);
