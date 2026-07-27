const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, default: '' },
    desc: { type: String, default: '' },
    location: { type: String, default: '' },
    area: { type: String, default: '' },
    start: { type: String, default: '' },
    end: { type: String, default: '' },
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
    status: { type: String, default: 'active' },
    manager: { type: String, default: '' },
    type: { type: String, default: 'Afforestation' },
    stage: { type: String, default: 'Planning' },
    healthScore: { type: Number, default: 100 },
    lat: { type: String, default: '' },
    long: { type: String, default: '' },
    totalPlantedTrees: { type: Number, default: 10000 },
    weatherStatus: { type: String, default: 'Sunny' }
  },
  { timestamps: true }
);

module.exports = mongoose.models.ProjectRecord || mongoose.model('ProjectRecord', projectSchema);
