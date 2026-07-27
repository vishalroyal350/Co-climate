const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, default: '' },
    projectId: { type: String, default: '' },
    location: { type: String, default: '' },
    lat: { type: String, default: '' },
    long: { type: String, default: '' },
    lat1: { type: String, default: '' },
    long1: { type: String, default: '' },
    lat2: { type: String, default: '' },
    long2: { type: String, default: '' },
    lat3: { type: String, default: '' },
    long3: { type: String, default: '' },
    lat4: { type: String, default: '' },
    long4: { type: String, default: '' },
    area: { type: String, default: '' },
    weather: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.models.SiteRecord || mongoose.model('SiteRecord', siteSchema);
