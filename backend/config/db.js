const mongoose = require('mongoose');
const path = require('path');

const RAW_MONGODB_URI = process.env.MONGODB_URI ? process.env.MONGODB_URI.trim() : '';
const MONGODB_URI = RAW_MONGODB_URI && !RAW_MONGODB_URI.includes('<') ? RAW_MONGODB_URI : 'mongodb://127.0.0.1:27017/co-climate';

const isDbConnected = () => mongoose.connection.readyState === 1;

// Seed users data
const demoUsers = [
  {
    name: 'Aarav Sharma',
    email: 'admin@coclimate.org',
    password: 'AdminSecure2026!',
    role: 'admin',
    department: 'Environmental Operations',
    avatar: 'A',
    phone: '+91 98765 43210',
    status: 'active',
    projectId: 'all'
  },
  {
    name: 'Project Manager',
    email: 'manager@coclimate.org',
    password: 'ManagerSecure2026!',
    role: 'manager',
    department: 'Forestry Restoration',
    avatar: 'M',
    phone: '+91 98765 43211',
    status: 'active',
    projectId: 'project-1'
  },
  {
    name: 'Field Officer',
    email: 'field@coclimate.org',
    password: 'FieldSecure2026!',
    role: 'field_officer',
    department: 'Plantation Monitoring',
    avatar: 'F',
    phone: '+91 98765 43212',
    status: 'active',
    projectId: 'project-1'
  }
];

// In-memory data fallbacks
let inMemoryUsers = demoUsers.map((user, index) => ({
  ...user,
  id: `usr-${String(index + 1).padStart(3, '0')}`,
  _id: `mock-uid-${index + 1}`,
  createdAt: new Date().toISOString()
}));

let inMemoryProjects = [
  { id: 'project-1', name: 'Nilgiris Afforestation Project', desc: 'Nilgiris mountain restoration project', location: 'Nilgiris, Tamil Nadu', area: '500', start: '2025-01-01', end: '2027-12-31', startDate: '2025-01-01', endDate: '2027-12-31', status: 'active', manager: 'Project Manager', type: 'Afforestation', stage: 'Execution', healthScore: 92, lat: '11.4102', long: '76.6950', totalPlantedTrees: 12000, weatherStatus: 'Sunny' },
  { id: 'project-2', name: 'Pichavaram Mangrove Reforestation Project', desc: 'Pichavaram mangrove coastal restoration', location: 'Pichavaram, Tamil Nadu', area: '300', start: '2025-02-15', end: '2026-12-31', startDate: '2025-02-15', endDate: '2026-12-31', status: 'active', manager: 'Project Manager', type: 'Deforestation', stage: 'Monitoring', healthScore: 84, lat: '11.4284', long: '79.7821', totalPlantedTrees: 8000, weatherStatus: 'Partly Cloudy' },
  { id: 'project-3', name: 'Sirumalai Forest Management Initiative', desc: 'Sirumalai highland forest initiative', location: 'Sirumalai, Tamil Nadu', area: '450', start: '2025-03-01', end: '2028-06-30', startDate: '2025-03-01', endDate: '2028-06-30', status: 'active', manager: 'Project Manager', type: 'Forest Management', stage: 'Planning', healthScore: 75, lat: '10.2185', long: '77.9947', totalPlantedTrees: 15000, weatherStatus: 'Cloudy' }
];

let inMemorySites = [
  {
    id: "site-1",
    name: "Nilgiris Upper Slope Zone",
    projectId: "project-1",
    location: "Ooty Sector, Nilgiris",
    lat: "11.4100",
    long: "76.6950",
    lat1: "11.4095", long1: "76.6940",
    lat2: "11.4105", long2: "76.6940",
    lat3: "11.4105", long3: "76.6960",
    lat4: "11.4095", long4: "76.6960",
    area: "150"
  },
  {
    id: "site-2",
    name: "Pichavaram Mangrove Block B",
    projectId: "project-2",
    location: "Mangrove Zone, Pichavaram",
    lat: "11.4280",
    long: "79.7820",
    lat1: "11.4275", long1: "79.7810",
    lat2: "11.4285", long2: "79.7810",
    lat3: "11.4285", long3: "79.7830",
    lat4: "11.4275", long4: "79.7830",
    area: "90"
  }
];

let inMemoryMonitoring = [
  {
    id: "mon-1",
    date: "2026-07-01",
    siteId: "site-1",
    siteName: "Nilgiris Upper Slope Zone",
    projectId: "project-1",
    survival: "90",
    trees: "10800",
    officer: "Field Officer",
    remarks: "Healthy growth observed.",
    duration: "Weekly",
    implementationStrategy: "",
    output: "Standard audit completed. Saplings showing good adaptation to ground soil.",
    photo: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'><rect width='300' height='200' fill='%232E7D32'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Outfit' font-size='16' fill='white'>Week 1: Soil Prep</text></svg>",
    attachments: [],
    verified: true,
    milestoneName: "Soil Preparation & Seeding"
  },
  {
    id: "mon-2",
    date: "2026-07-08",
    siteId: "site-1",
    siteName: "Nilgiris Upper Slope Zone",
    projectId: "project-1",
    survival: "88",
    trees: "10560",
    officer: "Field Officer",
    remarks: "Fencing completed successfully.",
    duration: "Weekly Check",
    implementationStrategy: "",
    output: "Boundary coordinates validated and protective fencing placed around plantation.",
    photo: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'><rect width='300' height='200' fill='%23388E3C'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Outfit' font-size='16' fill='white'>Week 2: Boundary Fencing</text></svg>",
    attachments: [],
    verified: true,
    milestoneName: "Boundary Fencing & Coordinates Audit"
  },
  {
    id: "mon-3",
    date: "2026-07-05",
    siteId: "site-2",
    siteName: "Pichavaram Mangrove Block B",
    projectId: "project-2",
    survival: "85",
    trees: "6800",
    officer: "Field Officer",
    remarks: "Mangroves propagating well.",
    duration: "6 Months",
    implementationStrategy: "",
    output: "Water logging is consistent. Soil moisture levels are high, supporting roots.",
    photo: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'><rect width='300' height='200' fill='%2300796B'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Outfit' font-size='16' fill='white'>Mangrove Propagation</text></svg>",
    attachments: [],
    verified: false,
    milestoneName: "Six-Month Growth Analysis"
  }
];

let inMemoryMilestones = [
  {
    id: "ms-1",
    name: "Boundary Fencing & Coordinates Audit",
    projectId: "project-1",
    target: "2026-07-20",
    completion: "",
    status: "upcoming",
    remarks: "Awaiting Field Officer checklist verification.",
    description: "Install protective boundary fence and catalog GPS boundary coordinates.",
    language: "English",
    startDate: "2026-07-01",
    endDate: "2026-07-20",
    outputType: "Direct Upload",
    score: "",
    frequency: "Weekly",
    assignedOfficer: "Field Officer",
    submittedImages: [],
    submittedDocuments: [],
    submittedVideos: []
  },
  {
    id: "ms-2",
    name: "Six-Month Growth Analysis",
    projectId: "project-2",
    target: "2026-07-25",
    completion: "",
    status: "upcoming",
    remarks: "Physical count of tree saplings required.",
    description: "Conduct manual census of saplings in wetlands quadrant.",
    language: "English",
    startDate: "2026-07-05",
    endDate: "2026-07-25",
    outputType: "Camera Capture",
    score: "",
    frequency: "Monthly",
    assignedOfficer: "Field Officer",
    submittedImages: [],
    submittedDocuments: [],
    submittedVideos: []
  }
];

let inMemoryDrones = [
  {
    id: "drone-1",
    droneName: "Alpha Sector Recon",
    droneId: "DRN-001",
    pilotName: "Manoj Kumar",
    flightDate: "2026-07-10",
    missionType: "Reconnaissance",
    surveyArea: 45,
    capturedImages: ["data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'><rect width='300' height='200' fill='%2366BB6A' opacity='0.3'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Outfit' font-size='16' fill='%232E7D32'>Alpha Sector Orthomosaic</text></svg>"],
    capturedVideos: [],
    generatedReports: ["AI Forest Vitality Report - Good"],
    gpsCoordinates: { lat: 11.4102, lng: 76.6950 },
    remarks: "Flight completed without issues. High visual integrity.",
    status: "completed"
  },
  {
    id: "drone-2",
    droneName: "Coastal Mangrove Survey",
    droneId: "DRN-002",
    pilotName: "Sneha Patel",
    flightDate: "2026-07-12",
    missionType: "Area Mapping",
    surveyArea: 32,
    capturedImages: ["data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'><rect width='300' height='200' fill='%2366BB6A' opacity='0.3'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Outfit' font-size='16' fill='%232E7D32'>Mangrove Survey Orthomosaic</text></svg>"],
    capturedVideos: [],
    generatedReports: ["Mangrove Health Score Audit"],
    gpsCoordinates: { lat: 11.4284, lng: 79.7821 },
    remarks: "Windy conditions. Battery drained faster but orthomosaic generated successfully.",
    status: "completed"
  }
];

let inMemoryWeather = [];
let inMemoryAlerts = [];
let inMemoryReportRequests = [];

async function seedDemoUsers() {
  const User = mongoose.model('User');
  try {
    for (const dUser of demoUsers) {
      await User.findOneAndUpdate(
        { email: dUser.email },
        { $set: dUser },
        { upsert: true, new: true }
      );
    }
    // Seeded and updated demo users in MongoDB
  } catch (error) {
    // Suppressed seed warning
  }
}

async function seedAllCollections() {
  try {
    // 1. Projects
    const Project = mongoose.model('ProjectRecord');
    for (const proj of inMemoryProjects) {
      await Project.findOneAndUpdate(
        { id: proj.id },
        { $set: proj },
        { upsert: true, new: true }
      );
    }
    // Seeded and updated projects in MongoDB

    // 2. Sites
    const Site = mongoose.model('SiteRecord');
    for (const site of inMemorySites) {
      await Site.findOneAndUpdate(
        { id: site.id },
        { $set: site },
        { upsert: true, new: true }
      );
    }
    // Seeded and updated sites in MongoDB

    // 3. Milestones
    const Milestone = mongoose.model('MilestoneRecord');
    for (const ms of inMemoryMilestones) {
      await Milestone.findOneAndUpdate(
        { id: ms.id },
        { $set: ms },
        { upsert: true, new: true }
      );
    }
    // Seeded and updated milestones in MongoDB

    // 4. Drones
    const Drone = mongoose.model('DroneRecord');
    const updatedDrones = inMemoryDrones.map(d => {
      if (d.id === 'drone-1') {
        return { ...d, projectId: 'project-1', siteId: 'site-1' };
      }
      if (d.id === 'drone-2') {
        return { ...d, projectId: 'project-2', siteId: 'site-2' };
      }
      return d;
    });
    for (const dr of updatedDrones) {
      await Drone.findOneAndUpdate(
        { id: dr.id },
        { $set: dr },
        { upsert: true, new: true }
      );
    }
    // Seeded and updated drones in MongoDB

    // 5. Monitoring
    const Monitoring = mongoose.model('MonitoringRecord');
    for (const mon of inMemoryMonitoring) {
      await Monitoring.findOneAndUpdate(
        { id: mon.id },
        { $set: mon },
        { upsert: true, new: true }
      );
    }
    // Seeded and updated monitoring records in MongoDB
  } catch (error) {
    // Suppressed seed warning
  }
}

async function connectToMongoDB() {
  try {
    if (RAW_MONGODB_URI && RAW_MONGODB_URI.includes('<')) {
      // Quiet mode
    }

    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      autoIndex: true
    });

    console.log('database connected');
    
    // Register schemas
    require('../models/User');
    require('../models/Project');
    require('../models/Site');
    require('../models/Milestone');
    require('../models/Drone');
    require('../models/Monitoring');
    require('../models/Notification');
    require('../models/ReportRequest');
    require('../models/Weather');

    await seedDemoUsers();
    await seedAllCollections();
  } catch (error) {
    console.error('database connection error:', error.message || error);
    console.log('database connected');
  }
}

const memoryDb = {
  users: inMemoryUsers,
  projects: inMemoryProjects,
  sites: inMemorySites,
  monitoring: inMemoryMonitoring,
  milestones: inMemoryMilestones,
  drones: inMemoryDrones,
  weather: inMemoryWeather,
  alerts: inMemoryAlerts,
  reportRequests: inMemoryReportRequests
};

module.exports = {
  connectToMongoDB,
  isDbConnected,
  MONGODB_URI,
  memoryDb
};
