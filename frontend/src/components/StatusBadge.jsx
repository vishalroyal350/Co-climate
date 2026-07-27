import React from 'react';

export default function StatusBadge({ status }) {
  const cleanStatus = String(status || '').toLowerCase().trim().replace(/_/g, ' ');
  
  let label = status;
  let colorClass = 'bg-secondary';
  let dot = '⚫';

  if (cleanStatus === 'active') {
    colorClass = 'bg-success';
    dot = '🟢';
    label = 'Active';
  } else if (cleanStatus === 'in progress' || cleanStatus === 'pending' || cleanStatus === 'scheduled') {
    colorClass = 'bg-warning text-dark';
    dot = '🟡';
    label = cleanStatus === 'scheduled' ? 'Scheduled' : 'In Progress';
  } else if (cleanStatus === 'monitoring') {
    colorClass = 'bg-info';
    dot = '🔵';
    label = 'Monitoring';
  } else if (cleanStatus === 'review pending' || cleanStatus === 'pending manager approval') {
    colorClass = 'bg-purple';
    dot = '🟣';
    label = 'Review Pending';
  } else if (cleanStatus === 'delayed') {
    colorClass = 'bg-orange text-white';
    dot = '🟠';
    label = 'Delayed';
  } else if (cleanStatus === 'rejected') {
    colorClass = 'bg-danger';
    dot = '🔴';
    label = 'Rejected';
  } else if (cleanStatus === 'completed' || cleanStatus === 'approved') {
    colorClass = 'bg-dark text-white';
    dot = '⚫';
    label = cleanStatus === 'approved' ? 'Approved' : 'Completed';
  }
  
  // Weather conditions mapping
  else if (cleanStatus === 'sunny') {
    colorClass = 'bg-success';
    dot = '🟢';
    label = 'Sunny';
  } else if (cleanStatus === 'partly cloudy' || cleanStatus === 'cloudy' || cleanStatus === 'foggy') {
    colorClass = 'bg-secondary';
    dot = '⚫';
    label = status;
  } else if (cleanStatus === 'rainy' || cleanStatus === 'showers' || cleanStatus === 'drizzle') {
    colorClass = 'bg-info';
    dot = '🔵';
    label = status;
  } else if (cleanStatus === 'thunderstorm') {
    colorClass = 'bg-danger';
    dot = '🔴';
    label = 'Thunderstorm';
  }

  return (
    <span 
      className={`status-badge d-inline-flex align-items-center gap-1.5 px-2.5 py-1 rounded-pill fw-semibold text-white ${colorClass}`}
      style={{ fontSize: '11px', whiteSpace: 'nowrap', letterSpacing: '0.3px', textTransform: 'capitalize' }}
    >
      <span className="status-dot" style={{ fontSize: '9px', lineHeight: 1 }}>{dot}</span>
      <span>{label}</span>
    </span>
  );
}
