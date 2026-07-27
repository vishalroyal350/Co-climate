const mongoose = require('mongoose');

const weatherSchema = new mongoose.Schema(
  {
    projectId: { type: String, required: true },
    date: { type: String, required: true }, // format YYYY-MM-DD
    day: { type: String, default: '' }, // day indicator e.g. day1, day2, day3
    temp: { type: Number, default: 0 },
    humidity: { type: Number, default: 0 },
    rainfall: { type: Number, default: 0 },
    windSpeed: { type: Number, default: 0 },
    windDirection: { type: String, default: 'N' },
    pressure: { type: Number, default: 1013 },
    condition: { type: String, default: 'Sunny' },
    uvIndex: { type: Number, default: 0 },
    sunrise: { type: String, default: '' },
    sunset: { type: String, default: '' }
  },
  { timestamps: true }
);

// Compound index to ensure uniqueness per project per date
weatherSchema.index({ projectId: 1, date: 1 }, { unique: true });

module.exports = mongoose.models.WeatherRecord || mongoose.model('WeatherRecord', weatherSchema);
