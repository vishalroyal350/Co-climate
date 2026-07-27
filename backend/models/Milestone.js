const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, default: '' },
    description: { type: String, default: '' },
    language: { type: String, default: 'Any' },
    projectId: { type: String, default: '' },
    target: { type: String, default: '' }, // backward compatibility target date
    completion: { type: String, default: '' },
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
    outputType: { type: String, enum: ['Camera Capture', 'Direct Upload'], default: 'Direct Upload' },
    status: { type: String, enum: ['upcoming', 'in_progress', 'pending_manager_approval', 'completed', 'rejected'], default: 'upcoming' },
    remarks: { type: String, default: '' },
    score: { type: String, default: '' },
    frequency: { type: String, enum: ['Weekly', 'Monthly'], default: 'Monthly' },
    assignedOfficer: { type: String, default: '' },
    submittedImages: { type: [String], default: [] },
    submittedDocuments: { type: [String], default: [] },
    submittedVideos: { type: [String], default: [] },
    reviewHistory: { type: Array, default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.models.MilestoneRecord || mongoose.model('MilestoneRecord', milestoneSchema);
