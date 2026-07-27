const WeatherRecord = require('../models/Weather');
const ProjectRecord = require('../models/Project');
const { isDbConnected, memoryDb } = require('../config/db');

// Map open-meteo weather codes to user-friendly conditions
function getWeatherCondition(code) {
  if (code === 0) return 'Sunny';
  if ([1, 2, 3].includes(code)) return 'Partly Cloudy';
  if ([45, 48].includes(code)) return 'Foggy';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle';
  if ([61, 63, 65, 66, 67].includes(code)) return 'Rainy';
  if ([71, 73, 75, 77].includes(code)) return 'Snowy';
  if ([80, 81, 82].includes(code)) return 'Showers';
  if ([95, 96, 99].includes(code)) return 'Thunderstorm';
  return 'Cloudy';
}

function getWindDirection(deg) {
  if (deg >= 337.5 || deg < 22.5) return 'N';
  if (deg >= 22.5 && deg < 67.5) return 'NE';
  if (deg >= 67.5 && deg < 112.5) return 'E';
  if (deg >= 112.5 && deg < 157.5) return 'SE';
  if (deg >= 157.5 && deg < 202.5) return 'S';
  if (deg >= 202.5 && deg < 247.5) return 'SW';
  if (deg >= 247.5 && deg < 292.5) return 'W';
  return 'NW';
}

// Generate mock 30-day weather records for a project
function generateMockWeather(projectId) {
  const weather = [];
  const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rainy', 'Showers'];
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

  for (let i = 30; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayNumber = 31 - i;

    weather.push({
      projectId,
      date: dateStr,
      day: `day${dayNumber}`,
      temp: Math.round(20 + Math.random() * 12),
      humidity: Math.round(50 + Math.random() * 40),
      rainfall: Math.round(Math.random() > 0.4 ? Math.random() * 25 : 0),
      windSpeed: Math.round(3 + Math.random() * 25),
      windDirection: directions[Math.floor(Math.random() * directions.length)],
      pressure: Math.round(1005 + Math.random() * 15),
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      uvIndex: Math.round(1 + Math.random() * 9),
      sunrise: '06:05 AM',
      sunset: '06:45 PM'
    });
  }
  return weather;
}

async function getWeatherHistory(req, res) {
  try {
    const { projectId } = req.params;

    if (!isDbConnected()) {
      let records = memoryDb.weather.filter(w => w.projectId === projectId);
      if (records.length === 0) {
        records = generateMockWeather(projectId);
        memoryDb.weather.push(...records);
      }
      return res.json(records.sort((a,b) => new Date(a.date) - new Date(b.date)));
    }

    // Try fetching existing DB records
    let records = await WeatherRecord.find({ projectId }).sort({ date: 1 }).lean();

    // If no records exist, try fetching from Open-Meteo or fallback to mock
    if (records.length === 0) {
      const project = await ProjectRecord.findOne({ id: projectId }).lean();
      let lat = project?.lat;
      let long = project?.long;

      // Fallback coordinates for demo purposes if empty
      if (!lat || !long) {
        lat = '10.7854';
        long = '76.5482';
      }

      try {
        const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
        // Use a dynamic import or standard global fetch in Node 18+
        const response = await (global.fetch || fetch)(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${long}&daily=temperature_2m_max,relative_humidity_2m_mean,rain_sum,wind_speed_10m_max,wind_direction_10m_dominant,pressure_msl_mean,weather_code,uv_index_max,sunrise,sunset&timezone=auto`
        );

        if (response.ok) {
          const data = await response.json();
          const daily = data.daily;
          const newRecords = [];

          for (let i = 0; i < 5; i++) {
            const dateStr = daily.time[i];
            const sunriseTime = daily.sunrise[i] ? new Date(daily.sunrise[i]).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '06:00 AM';
            const sunsetTime = daily.sunset[i] ? new Date(daily.sunset[i]).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '06:30 PM';

            newRecords.push({
              projectId,
              date: dateStr,
              day: `day${i + 1}`,
              temp: Math.round(daily.temperature_2m_max[i] || 27),
              humidity: Math.round(daily.relative_humidity_2m_mean[i] || 60),
              rainfall: Math.round(daily.rain_sum[i] || 0),
              windSpeed: Math.round(daily.wind_speed_10m_max[i] || 12),
              windDirection: getWindDirection(daily.wind_direction_10m_dominant[i] || 0),
              pressure: Math.round(daily.pressure_msl_mean[i] || 1013),
              condition: getWeatherCondition(daily.weather_code[i] || 0),
              uvIndex: Math.round(daily.uv_index_max[i] || 5),
              sunrise: sunriseTime,
              sunset: sunsetTime
            });
          }

          // Insert or update DB weather cache
          for (const item of newRecords) {
            await WeatherRecord.findOneAndUpdate(
              { projectId: item.projectId, date: item.date },
              { $set: item },
              { upsert: true, new: true }
            );
          }

          records = await WeatherRecord.find({ projectId }).sort({ date: 1 }).lean();
        } else {
          throw new Error('Open-Meteo API response not ok');
        }
      } catch (apiErr) {
        console.warn('Weather API fetch failed, seeding mock weather history:', apiErr.message);
        const seededMock = generateMockWeather(projectId);
        for (const item of seededMock) {
          await WeatherRecord.findOneAndUpdate(
            { projectId: item.projectId, date: item.date },
            { $set: item },
            { upsert: true, new: true }
          );
        }
        records = await WeatherRecord.find({ projectId }).sort({ date: 1 }).lean();
      }
    }

    return res.json(records);
  } catch (error) {
    console.error('Weather history load failed:', error);
    return res.status(500).json({ success: false, message: 'Unable to load weather history' });
  }
}

// Allows posting custom weather entries (admin/PM update)
async function saveWeather(req, res) {
  try {
    const payload = req.body || {};
    if (!payload.projectId || !payload.date) {
      return res.status(400).json({ success: false, message: 'Project ID and date are required' });
    }

    if (!isDbConnected()) {
      const idx = memoryDb.weather.findIndex(w => w.projectId === payload.projectId && w.date === payload.date);
      if (idx !== -1) {
        memoryDb.weather[idx] = { ...memoryDb.weather[idx], ...payload };
      } else {
        memoryDb.weather.push(payload);
      }
      return res.json({ success: true, record: payload });
    }

    const savedRecord = await WeatherRecord.findOneAndUpdate(
      { projectId: payload.projectId, date: payload.date },
      { $set: payload },
      { upsert: true, new: true }
    ).lean();

    return res.json({ success: true, record: savedRecord });
  } catch (error) {
    console.error('Weather save failed:', error);
    return res.status(500).json({ success: false, message: 'Unable to save weather record' });
  }
}

module.exports = {
  getWeatherHistory,
  saveWeather
};
