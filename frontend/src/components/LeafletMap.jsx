import React, { useEffect, useRef } from 'react';

export default function LeafletMap({ projects, sites, drones, activeProjectId, onFocusSite }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef([]);

  useEffect(() => {
    if (!window.L || !mapContainerRef.current) return;

    // Initialize map if it doesn't exist
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = window.L.map(mapContainerRef.current).setView([11.1271, 78.6569], 7);
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);
    } else {
      // Invalidate size to avoid rendering issues inside tabs/modals
      setTimeout(() => {
        if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
      }, 100);
    }

    const map = mapInstanceRef.current;

    // Clear old markers/polygons
    layersRef.current.forEach(layer => map.removeLayer(layer));
    layersRef.current = [];

    // Filter sites/projects based on active project
    let filteredProjects = projects;
    let filteredSites = sites;

    if (activeProjectId && activeProjectId !== 'all') {
      filteredProjects = projects.filter(p => p.id === activeProjectId);
      filteredSites = sites.filter(s => s.projectId === activeProjectId);
    }

    // 1. Plot Project Markers
    filteredProjects.forEach(proj => {
      if (proj.lat && proj.long) {
        const marker = window.L.marker([Number(proj.lat), Number(proj.long)], {
          icon: window.L.divIcon({
            className: 'custom-leaflet-marker project-marker',
            html: `<div style="background-color: #2E7D32; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"><i class="bi bi-folder-fill" style="font-size: 11px;"></i></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })
        }).addTo(map);

        marker.bindPopup(`
          <div style="font-family: 'Outfit', sans-serif; font-size: 12px; width: 180px;">
            <strong style="color: #2E7D32; font-size: 13px;">${proj.name}</strong><br/>
            <b>Level</b>: Project Marker<br/>
            <b>Stage</b>: ${proj.stage || 'Planning'}<br/>
            <b>Manager</b>: ${proj.manager || 'Unassigned'}<br/>
            <b>Coords</b>: ${proj.lat}, ${proj.long}
          </div>
        `);
        layersRef.current.push(marker);
      }
    });

    // 2. Plot Site Markers & Polygons
    filteredSites.forEach(site => {
      const proj = projects.find(p => p.id === site.projectId) || {};
      
      // Plot centroid marker
      if (site.lat && site.long) {
        const marker = window.L.marker([Number(site.lat), Number(site.long)], {
          icon: window.L.divIcon({
            className: 'custom-leaflet-marker site-marker',
            html: `<div style="background-color: #1976D2; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"><i class="bi bi-pin-map-fill" style="font-size: 11px;"></i></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })
        }).addTo(map);

        marker.bindPopup(`
          <div style="font-family: 'Outfit', sans-serif; font-size: 12px; width: 200px;">
            <strong style="color: #1976D2; font-size: 13px;">${site.name}</strong><br/>
            <b>Project</b>: ${proj.name || 'Unknown'}<br/>
            <b>Area</b>: ${site.area || 0} Acres<br/>
            <b>Weather</b>: ${site.weather || 'Sunny 27°C'}<br/>
            <b>Manager</b>: ${proj.manager || 'Unassigned'}<br/>
            <b>Stage</b>: ${proj.stage || 'Planning'}<br/>
            <b>Coords</b>: ${site.lat}, ${site.long}
          </div>
        `);
        layersRef.current.push(marker);
      }

      // Plot boundary polygon
      let latlngs = [];
      const hasDistinctCorners = site.lat1 && site.long1 && site.lat2 && site.long2 && site.lat3 && site.long3 && site.lat4 && site.long4 &&
        (Math.abs(Number(site.lat1) - Number(site.lat2)) > 0.0001 || Math.abs(Number(site.long1) - Number(site.long2)) > 0.0001);
      
      if (hasDistinctCorners) {
        latlngs = [
          [Number(site.lat1), Number(site.long1)],
          [Number(site.lat2), Number(site.long2)],
          [Number(site.lat3), Number(site.long3)],
          [Number(site.lat4), Number(site.long4)]
        ];
      } else if (site.lat && site.long) {
        const areaAcres = Number(site.area) || Number(proj.area) || 50;
        const latVal = Number(site.lat);
        const lngVal = Number(site.long);
        
        const sideMeters = Math.sqrt(areaAcres * 4046.86);
        const halfSide = sideMeters / 2;
        const deltaLat = halfSide / 111000;
        const deltaLng = halfSide / (111000 * Math.cos(latVal * Math.PI / 180));
        
        latlngs = [
          [latVal - deltaLat, lngVal - deltaLng], // bottom left
          [latVal + deltaLat, lngVal - deltaLng], // top left
          [latVal + deltaLat, lngVal + deltaLng], // top right
          [latVal - deltaLat, lngVal + deltaLng]  // bottom right
        ];
      }

      if (latlngs.length > 0) {
        const polygon = window.L.polygon(latlngs, {
          color: '#2E7D32',
          fillColor: '#66BB6A',
          fillOpacity: 0.4
        }).addTo(map);

        polygon.bindPopup(`
          <div style="font-family: 'Outfit', sans-serif; font-size: 12px; width: 180px;">
            <strong style="color: #2E7D32;">${site.name} Boundary</strong><br/>
            <b>Calculated Area</b>: ${site.area || proj.area || 0} Acres<br/>
            <b>Center Coords</b>: ${Number(site.lat).toFixed(4)}, ${Number(site.long).toFixed(4)}
          </div>
        `);
        layersRef.current.push(polygon);
      }
    });

    // 3. Plot Drone Markers
    drones.forEach(drone => {
      const droneLat = drone.gpsCoordinates?.lat;
      const droneLng = drone.gpsCoordinates?.lng;

      if (droneLat && droneLng) {
        const site = sites.find(s => s.id === drone.siteId) || {};
        const proj = projects.find(p => p.id === site.projectId) || {};

        const marker = window.L.marker([Number(droneLat), Number(droneLng)], {
          icon: window.L.divIcon({
            className: 'custom-leaflet-marker drone-marker',
            html: `<div style="background-color: #E65100; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"><i class="bi bi-airplane-fill" style="font-size: 11px;"></i></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })
        }).addTo(map);

        marker.bindPopup(`
          <div style="font-family: 'Outfit', sans-serif; font-size: 12px; width: 200px;">
            <strong style="color: #E65100; font-size: 13px;">${drone.droneName}</strong><br/>
            <b>Pilot</b>: ${drone.pilotName || 'N/A'}<br/>
            <b>Site</b>: ${site.name || 'N/A'}<br/>
            <b>Area</b>: ${drone.surveyArea || 0} Acres<br/>
            <b>Status</b>: <span style="text-transform: capitalize;">${drone.status}</span><br/>
            <b>Coords</b>: ${droneLat}, ${droneLng}
          </div>
        `);
        layersRef.current.push(marker);
      }
    });

    // Fit map bounds to show all markers if any layers exist
    if (layersRef.current.length > 0) {
      const group = new window.L.featureGroup(layersRef.current.filter(l => l instanceof window.L.Marker || l instanceof window.L.Polygon));
      try {
        map.fitBounds(group.getBounds(), { padding: [30, 30] });
      } catch (e) {
        // Bounds fit error fallback
      }
    }

  }, [projects, sites, drones, activeProjectId]);

  return (
    <div 
      ref={mapContainerRef} 
      style={{ height: '380px', width: '100%', borderRadius: '8px', zIndex: 1 }} 
      className="leaflet-map-element border shadow-sm"
    />
  );
}
