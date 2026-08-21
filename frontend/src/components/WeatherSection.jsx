import React, { useState, useEffect, useRef } from 'react';

export default function WeatherSection({ weatherHistory, loading }) {
  const [filter, setFilter] = useState('Weekly'); // 'Today', 'Weekly', 'Monthly'

  // Chart refs
  const tempChartRef = useRef(null);
  const humChartRef = useRef(null);
  const rainChartRef = useRef(null);
  const windChartRef = useRef(null);

  const tempInstance = useRef(null);
  const humInstance = useRef(null);
  const rainInstance = useRef(null);
  const windInstance = useRef(null);

  const getWeatherIcon = (condition) => {
    const cond = String(condition || 'sunny').toLowerCase();
    if (cond.includes('sunny')) return 'bi-sun-fill text-warning';
    if (cond.includes('partly')) return 'bi-cloud-sun-fill text-warning';
    if (cond.includes('cloudy') || cond.includes('foggy')) return 'bi-cloud-fill text-secondary';
    if (cond.includes('drizzle') || cond.includes('rain')) return 'bi-cloud-drizzle-fill text-info';
    if (cond.includes('shower')) return 'bi-cloud-rain-heavy-fill text-primary';
    if (cond.includes('thunder')) return 'bi-cloud-lightning-rain-fill text-danger';
    return 'bi-cloud-sun-fill';
  };

  const getFilteredData = () => {
    if (!weatherHistory || weatherHistory.length === 0) return [];
    // Sort chronological first
    const sorted = [...weatherHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Assign days chronological dynamically if they are missing
    const enriched = sorted.map((w, idx) => ({
      ...w,
      day: w.day || `day${idx + 1}`
    }));

    if (filter === 'Today') {
      return enriched.slice(-1); // latest 1 record
    }
    if (filter === 'Weekly') {
      return enriched.slice(-7); // latest 7 records
    }
    if (filter === 'Monthly') {
      return enriched.slice(-30); // latest 30 records
    }
    return enriched;
  };

  useEffect(() => {
    const dataPoints = getFilteredData();
    if (filter === 'Today' || dataPoints.length === 0 || !window.Chart) {
      // Destroy charts if we are in 'Today' or have no data
      if (tempInstance.current) { tempInstance.current.destroy(); tempInstance.current = null; }
      if (humInstance.current) { humInstance.current.destroy(); humInstance.current = null; }
      if (rainInstance.current) { rainInstance.current.destroy(); rainInstance.current = null; }
      if (windInstance.current) { windInstance.current.destroy(); windInstance.current = null; }
      return;
    }

    const labels = dataPoints.map(w => {
      if (w.day) {
        const num = w.day.replace('day', '');
        return `Day ${num}`;
      }
      const date = new Date(w.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
    const textColor = isDark ? '#cbd5e1' : '#334155';

    // Temp Chart
    const tempCtx = tempChartRef.current;
    if (tempCtx) {
      if (tempInstance.current) tempInstance.current.destroy();
      tempInstance.current = new window.Chart(tempCtx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Temp (°C)',
            data: dataPoints.map(w => w.temp),
            borderColor: '#ff6f00',
            backgroundColor: 'rgba(255, 111, 0, 0.08)',
            borderWidth: 3,
            tension: 0.35,
            fill: true,
            pointBackgroundColor: '#ff6f00',
            pointRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: gridColor }, ticks: { color: textColor } },
            y: { grid: { color: gridColor }, ticks: { color: textColor } }
          }
        }
      });
    }

    // Humidity Chart
    const humCtx = humChartRef.current;
    if (humCtx) {
      if (humInstance.current) humInstance.current.destroy();
      humInstance.current = new window.Chart(humCtx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Humidity (%)',
            data: dataPoints.map(w => w.humidity),
            borderColor: '#0288d1',
            backgroundColor: 'rgba(2, 136, 209, 0.08)',
            borderWidth: 3,
            tension: 0.35,
            fill: true,
            pointBackgroundColor: '#0288d1',
            pointRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: gridColor }, ticks: { color: textColor } },
            y: { grid: { color: gridColor }, ticks: { color: textColor } }
          }
        }
      });
    }

    // Rainfall Chart
    const rainCtx = rainChartRef.current;
    if (rainCtx) {
      if (rainInstance.current) rainInstance.current.destroy();
      rainInstance.current = new window.Chart(rainCtx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Rainfall (mm)',
            data: dataPoints.map(w => w.rainfall),
            backgroundColor: '#00796b',
            borderRadius: 4,
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: gridColor }, ticks: { color: textColor } },
            y: { grid: { color: gridColor }, ticks: { color: textColor } }
          }
        }
      });
    }

    // Wind Speed Chart
    const windCtx = windChartRef.current;
    if (windCtx) {
      if (windInstance.current) windInstance.current.destroy();
      windInstance.current = new window.Chart(windCtx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Wind Speed (km/h)',
            data: dataPoints.map(w => w.windSpeed),
            borderColor: '#546e7a',
            backgroundColor: 'rgba(84, 110, 122, 0.08)',
            borderWidth: 3,
            tension: 0.35,
            fill: true,
            pointBackgroundColor: '#546e7a',
            pointRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: gridColor }, ticks: { color: textColor } },
            y: { grid: { color: gridColor }, ticks: { color: textColor } }
          }
        }
      });
    }

    return () => {
      if (tempInstance.current) { tempInstance.current.destroy(); tempInstance.current = null; }
      if (humInstance.current) { humInstance.current.destroy(); humInstance.current = null; }
      if (rainInstance.current) { rainInstance.current.destroy(); rainInstance.current = null; }
      if (windInstance.current) { windInstance.current.destroy(); windInstance.current = null; }
    };
  }, [filter, weatherHistory]);

  if (loading) {
    return (
      <div className="card shadow-sm border-0 mt-4 overflow-hidden" style={{ borderRadius: '16px' }}>
        <div className="card-body p-5 text-center text-muted" style={{ background: 'linear-gradient(135deg, rgba(46,125,50,0.05) 0%, rgba(240,248,240,0.8) 100%)' }}>
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading weather logs...</span>
          </div>
          <p className="mt-3 mb-0 fw-semibold text-success-dark">Syncing historical weather database...</p>
        </div>
      </div>
    );
  }

  const allSortedEnriched = weatherHistory && weatherHistory.length > 0 
    ? [...weatherHistory].sort((a,b) => new Date(a.date) - new Date(b.date)).map((w, idx) => ({
      ...w,
      day: w.day || `day${idx + 1}`
    }))
    : [];

  const todayRecord = allSortedEnriched.length > 0 
    ? allSortedEnriched.slice(-1)[0]
    : null;

  const displayDataPoints = getFilteredData();

  return (
    <div className="card shadow border-0 mt-4 overflow-hidden" style={{ borderRadius: '16px' }}>
      {/* Sleek Gradient Header */}
      <div className="card-header border-0 d-flex justify-content-between align-items-center flex-wrap gap-3 py-3 px-4" 
        style={{ background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)', color: 'white' }}>
        <h5 className="mb-0 font-weight-bold text-white d-flex align-items-center gap-2">
          <i className="bi bi-cloud-sun" style={{ fontSize: '24px' }}></i>
          <span>Weather Analytics & Historical Log</span>
        </h5>
        
        {/* Toggle Filters */}
        <div className="btn-group btn-group-sm p-1 rounded-pill" style={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)' }}>
          {['Today', 'Weekly', 'Monthly'].map(f => (
            <button 
              key={f}
              type="button" 
              className={`btn rounded-pill border-0 px-3.5 py-1.5 fw-semibold transition-all ${filter === f ? 'btn-light text-success shadow-sm' : 'text-white'}`}
              style={{ fontSize: '12px' }}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      
      <div className="card-body p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
        {allSortedEnriched.length === 0 ? (
          <div className="text-center text-muted py-5">
            <i className="bi bi-cloud-slash display-4 mb-2 d-block"></i>
            <span>No weather history logs available for this project scope.</span>
          </div>
        ) : filter === 'Today' && todayRecord ? (
          /* Premium Today Widget */
          <div className="row g-4 align-items-center">
            <div className="col-lg-4 text-center border-end py-3">
              <div style={{ transform: 'scale(1.2)' }} className="mb-3">
                <i className={`bi ${getWeatherIcon(todayRecord.condition)}`} style={{ fontSize: '72px' }}></i>
              </div>
              <h1 className="display-4 fw-extrabold mb-1 text-success-dark font-Outfit">{todayRecord.temp}°C</h1>
              <span className="badge bg-success bg-opacity-15 text-success border border-success border-opacity-20 text-uppercase py-2 px-3 rounded-pill mt-2 fw-bold" style={{ fontSize: '11px', letterSpacing: '0.5px' }}>
                {todayRecord.condition}
              </span>
              <p className="text-muted small mt-3 mb-0 fw-semibold">
                Recorded on {todayRecord.date} ({todayRecord.day ? `Day ${todayRecord.day.replace('day', '')}` : 'Today'})
              </p>
            </div>
            
            <div className="col-lg-8">
              <div className="row g-3">
                {[
                  { label: 'Humidity', val: `${todayRecord.humidity}%`, icon: 'bi-droplet-fill text-primary', bg: 'rgba(2,136,209,0.04)' },
                  { label: 'Rainfall', val: `${todayRecord.rainfall} mm`, icon: 'bi-cloud-drizzle-fill text-teal', bg: 'rgba(0,121,107,0.04)' },
                  { label: 'Wind Speed', val: `${todayRecord.windSpeed} km/h`, icon: 'bi-wind text-secondary', bg: 'rgba(69,90,100,0.04)' },
                  { label: 'Wind Direction', val: todayRecord.windDirection, icon: 'bi-compass text-info', bg: 'rgba(0,188,212,0.04)' },
                  { label: 'Sunrise Time', val: todayRecord.sunrise || '06:05 AM', icon: 'bi-sunrise text-warning', bg: 'rgba(255,193,7,0.04)' },
                  { label: 'Sunset Time', val: todayRecord.sunset || '06:45 PM', icon: 'bi-sunset text-danger', bg: 'rgba(244,67,54,0.04)' }
                ].map((item, i) => (
                  <div className="col-6 col-sm-4" key={i}>
                    <div className="p-3 border rounded-3 text-center transition-all hover-translate-y shadow-sm" style={{ background: item.bg, border: '1px solid rgba(0,0,0,0.04)' }}>
                      <span className="text-muted d-block small mb-1.5 fw-semibold">{item.label}</span>
                      <strong className="fs-5 font-Outfit"><i className={`bi ${item.icon} me-1.5`}></i>{item.val}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Premium Graph & Scrolling Cards View */
          <div>
            <div className="row g-4">
              <div className="col-md-6">
                <div className="border border-opacity-10 rounded-3 p-3 bg-light bg-opacity-50">
                  <h6 className="fw-bold mb-3 text-success-dark font-Outfit"><i className="bi bi-thermometer-half text-danger"></i> Temperature Trend (°C)</h6>
                  <div style={{ height: '200px' }}>
                    <canvas ref={tempChartRef}></canvas>
                  </div>
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="border border-opacity-10 rounded-3 p-3 bg-light bg-opacity-50">
                  <h6 className="fw-bold mb-3 text-success-dark font-Outfit"><i className="bi bi-droplet text-primary"></i> Humidity Profile (%)</h6>
                  <div style={{ height: '200px' }}>
                    <canvas ref={humChartRef}></canvas>
                  </div>
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="border border-opacity-10 rounded-3 p-3 bg-light bg-opacity-50">
                  <h6 className="fw-bold mb-3 text-success-dark font-Outfit"><i className="bi bi-cloud-rain text-success"></i> Rainfall Accumulation (mm)</h6>
                  <div style={{ height: '200px' }}>
                    <canvas ref={rainChartRef}></canvas>
                  </div>
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="border border-opacity-10 rounded-3 p-3 bg-light bg-opacity-50">
                  <h6 className="fw-bold mb-3 text-success-dark font-Outfit"><i className="bi bi-wind text-secondary"></i> Wind Speed Records (km/h)</h6>
                  <div style={{ height: '200px' }}>
                    <canvas ref={windChartRef}></canvas>
                  </div>
                </div>
              </div>
            </div>

            {/* Horizontal Scrollable Weather Log */}
            <div className="mt-4 pt-3 border-top">
              <h6 className="fw-bold text-success-dark mb-3 font-Outfit">
                <i className="bi bi-list-columns-reverse me-1.5"></i> Daily Weather Log List (Sorted Chronologically)
              </h6>
              
              <div className="d-flex gap-3 overflow-auto pb-3 scrolling-cards-container" style={{ scrollbarWidth: 'thin' }}>
                {displayDataPoints.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="border rounded-3 p-3 theme-surface shadow-sm flex-shrink-0 text-center hover-translate-y" 
                    style={{ width: '135px', transition: 'all 0.2s', border: '1px solid rgba(46, 125, 50, 0.08)' }}
                  >
                    <span className="badge bg-success bg-opacity-10 text-success fw-bold px-2 py-1 rounded mb-1" style={{ fontSize: '10px' }}>
                      Day {item.day ? item.day.replace('day', '') : idx + 1}
                    </span>
                    <small className="d-block text-muted mb-2 font-Outfit" style={{ fontSize: '10.5px' }}>{item.date}</small>
                    <div className="mb-2">
                      <i className={`bi ${getWeatherIcon(item.condition)}`} style={{ fontSize: '28px' }}></i>
                    </div>
                    <strong className="fs-6 font-Outfit d-block">{item.temp}°C</strong>
                    <span className="text-secondary small d-block text-truncate mt-1" style={{ fontSize: '10px' }}>{item.condition}</span>
                    <div className="mt-2 pt-2 border-top d-flex justify-content-between align-items-center text-muted" style={{ fontSize: '10px' }}>
                      <span><i className="bi bi-droplet-fill text-primary"></i> {item.humidity}%</span>
                      <span><i className="bi bi-cloud-drizzle-fill text-teal"></i> {item.rainfall}mm</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
