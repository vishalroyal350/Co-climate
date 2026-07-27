const mongoose = require('mongoose');

const droneSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true }, // custom identifier like drone-123
    droneName: { type: String, required: true },
    droneId: { type: String, required: true },
    pilotName: { type: String, required: true },
    flightDate: { type: String, required: true },
    missionType: { type: String, default: 'Mapping' },
    surveyArea: { type: Number, default: 0 }, // in acres
    capturedImages: { type: [String], default: [] }, // data URIs or image links
    capturedVideos: { type: [String], default: [] }, // video links/paths
    generatedReports: { type: [String], default: [] }, // text summaries or report files
    gpsCoordinates: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 }
    },
    remarks: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'completed', 'aborted', 'scheduled'], default: 'pending' },
    projectId: { type: String, default: '' },
    siteId: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.models.DroneRecord || mongoose.model('DroneRecord', droneSchema);
