const PDFDocument = require('pdfkit');

/**
 * Generates a PDF report using pdfkit and returns a promise resolving to a base64 data URI
 */
function generateReportPDF(project, sites, milestones, drones, weather, requestSettings) {
  return new Promise((resolve, reject) => {
    try {
      const settings = requestSettings || {};
      const includeMilestones = settings.includeMilestones !== false;
      const includeDroneData = settings.includeDroneData !== false;
      const includeWeatherData = settings.includeWeatherData !== false;

      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const result = Buffer.concat(chunks);
        const base64Pdf = `data:application/pdf;base64,${result.toString('base64')}`;
        resolve(base64Pdf);
      });

      // Header Brand
      doc.fillColor('#2E7D32')
         .fontSize(22)
         .text('CO-CLIMATE FOREST RESTORATION REPORT', { align: 'center' });
      
      doc.moveDown(0.5);
      doc.fillColor('#555555')
         .fontSize(10)
         .text(`Generated Date: ${new Date().toLocaleDateString()} | System Generated Audit`, { align: 'center' });
      
      doc.moveDown(1.5);
      
      // Divider
      doc.moveTo(50, 110).lineTo(560, 110).stroke('#2E7D32');
      doc.moveDown(1);

      // Project Overview Section
      doc.fillColor('#333333')
         .fontSize(14)
         .text('PROJECT OVERVIEW', { underline: true });
      
      doc.moveDown(0.5);
      doc.fontSize(11);
      doc.text(`Project Name: ${project.name || 'N/A'}`);
      doc.text(`Project ID: ${project.id || 'N/A'}`);
      doc.text(`Location: ${project.location || 'N/A'}`);
      doc.text(`Restoration Type: ${project.type || 'N/A'}`);
      doc.text(`Current Stage: ${project.stage || 'N/A'}`);
      doc.text(`Project Health Score: ${project.healthScore || 100}%`);
      doc.text(`Manager: ${project.manager || 'N/A'}`);
      
      doc.moveDown(1.5);

      // Sites Table Section
      doc.fontSize(14)
         .text('PLANTED SITES & AREAS', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      
      if (sites && sites.length > 0) {
        sites.forEach((site, index) => {
          doc.text(`${index + 1}. Site: ${site.name} | Area: ${site.area} Acres | Centroid Lat: ${site.lat}, Lng: ${site.long}`);
        });
      } else {
        doc.text('No site zones mapped to this project yet.');
      }
      doc.moveDown(1.5);

      // Milestones Section
      if (includeMilestones) {
        doc.fontSize(14)
           .text('RESTORATION MILESTONES STATUS', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);
        
        const projMilestones = milestones.filter(m => m.projectId === project.id);
        if (projMilestones.length > 0) {
          projMilestones.forEach((m) => {
            const dateStr = m.endDate || m.target || 'N/A';
            doc.text(`• Milestone: ${m.name}`);
            doc.text(`  Status: ${m.status.toUpperCase()} | Frequency: ${m.frequency || 'Monthly'} | Target Date: ${dateStr}`);
            doc.text(`  PM Score: ${m.score || 0}/100 | Remarks: ${m.remarks || 'None'}`);
            doc.moveDown(0.3);
          });
        } else {
          doc.text('No milestones assigned to this project.');
        }
        doc.moveDown(1.5);
      }

      // Drone Monitoring Section
      if (includeDroneData) {
        doc.fontSize(14)
           .text('DRONE FLIGHT MONITORING HISTORY', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);
        
        if (drones && drones.length > 0) {
          drones.forEach((d) => {
            doc.text(`• Drone Name: ${d.droneName} (ID: ${d.droneId})`);
            doc.text(`  Pilot: ${d.pilotName} | Flight Date: ${d.flightDate} | Mission: ${d.missionType}`);
            doc.text(`  Survey Area: ${d.surveyArea} Acres | GPS Coordinates: Lat ${d.gpsCoordinates?.lat || 0}, Lng ${d.gpsCoordinates?.lng || 0}`);
            doc.text(`  Remarks: ${d.remarks || 'N/A'}`);
            doc.moveDown(0.3);
          });
        } else {
          doc.text('No drone reconnaissance missions recorded.');
        }
        doc.moveDown(1.5);
      }

      // Weather Caching Section
      if (includeWeatherData) {
        doc.fontSize(14)
           .text('CLIMATE CONDITIONS SUMMARY', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);
        
        if (weather && weather.length > 0) {
          weather.forEach((w) => {
            doc.text(`Date: ${w.date} | Temp: ${w.temp}°C | Humidity: ${w.humidity}% | Rainfall: ${w.rainfall}mm | Wind: ${w.windSpeed} km/h (${w.windDirection}) | Condition: ${w.condition}`);
          });
        } else {
          doc.text('No climate parameters recorded.');
        }
      }

      // End document
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function generateCustomReportPDF({ reportType, projectType, dateRange, projects, sites, milestones, drones, weather, monitoring }) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const result = Buffer.concat(chunks);
        const base64Pdf = `data:application/pdf;base64,${result.toString('base64')}`;
        resolve(base64Pdf);
      });

      // Header Brand
      doc.fillColor('#2E7D32')
         .fontSize(22)
         .text(`${reportType.toUpperCase()}`, { align: 'center' });
      
      doc.moveDown(0.5);
      doc.fillColor('#555555')
         .fontSize(12)
         .text(`Project Type: ${projectType} | Date Range: ${dateRange}`, { align: 'center' });
      doc.text(`Generated Date: ${new Date().toLocaleDateString()} | System Generated Audit`, { align: 'center' });
      
      doc.moveDown(1.5);
      doc.moveTo(50, 120).lineTo(560, 120).stroke('#2E7D32');
      doc.moveDown(1.5);

      // Section: Executive Summary
      doc.fillColor('#333333').fontSize(14).text('EXECUTIVE SUMMARY', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      doc.text(`Total Mapped Projects: ${projects.length}`);
      doc.text(`Total Planted Sites: ${sites.length}`);
      doc.text(`Active Monitoring Logs: ${monitoring.length}`);
      doc.text(`Milestones Tracked: ${milestones.length}`);
      doc.text(`Drone Recon Scans: ${drones.length}`);
      doc.moveDown(1);

      // Section: Projects
      doc.fontSize(14).text('PROJECTS AND SITES LIST', { underline: true });
      doc.moveDown(0.5);
      if (projects.length > 0) {
        projects.forEach((proj, idx) => {
          doc.fontSize(11).text(`${idx + 1}. Project: ${proj.name} (ID: ${proj.id})`);
          doc.fontSize(9).text(`   Location: ${proj.location} | Area: ${proj.area} Acres | Stage: ${proj.stage} | Health Score: ${proj.healthScore}%`);
          const projSites = sites.filter(s => s.projectId === proj.id);
          if (projSites.length > 0) {
            doc.text(`   Sites: ${projSites.map(s => `${s.name} (${s.area} ac)`).join(', ')}`);
          } else {
            doc.text(`   Sites: No sites linked.`);
          }
          doc.moveDown(0.5);
        });
      } else {
        doc.fontSize(10).text('No projects of this type found.');
      }
      doc.moveDown(1);

      // Section: Milestones
      doc.fontSize(14).text('MILESTONES LIST', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      if (milestones.length > 0) {
        milestones.forEach((m) => {
          doc.text(`• ${m.name} [${m.status.toUpperCase()}] - Target: ${m.endDate || m.target} | Score: ${m.score || 'N/A'}`);
        });
      } else {
        doc.text('No milestones found in this date range.');
      }
      doc.moveDown(1);

      // Section: Weather & Monitoring Details
      doc.fontSize(14).text('MONITORING LOGS SUMMARY', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);
      if (monitoring.length > 0) {
        monitoring.forEach((mon) => {
          doc.text(`• Site: ${mon.siteName} | Date: ${mon.date} | Auditor: ${mon.officer} | Survival: ${mon.survival}% | Live Trees: ${mon.trees}`);
        });
      } else {
        doc.text('No monitoring logs found.');
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateReportPDF,
  generateCustomReportPDF
};
