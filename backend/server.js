const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { connectToMongoDB, isDbConnected } = require('./config/db');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const DEFAULT_PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve built frontend assets
app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist')));

// Static HTML fallback entry points
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'login.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'login.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'co-climate-backend',
    database: isDbConnected() ? 'connected' : 'demo-mode'
  });
});

// Import route modules
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const siteRoutes = require('./routes/siteRoutes');
const monitoringRoutes = require('./routes/monitoringRoutes');
const milestoneRoutes = require('./routes/milestoneRoutes');
const droneRoutes = require('./routes/droneRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const reportRoutes = require('./routes/reportRoutes');
const alertRoutes = require('./routes/alertRoutes');

// Map modular routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/drones', droneRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/alerts', alertRoutes);

// Compatibility fallback endpoints
const authController = require('./controllers/authController');
app.post('/api/login', authController.authenticateUser);
app.post('/api/register', authController.registerUser);

// Dashboard Overview statistics aggregator endpoint (backward compatibility)
const SiteRecord = require('./models/Site');
const ProjectRecord = require('./models/Project');
const MonitoringRecord = require('./models/Monitoring');
const AlertRecord = require('./models/Notification');
const { memoryDb } = require('./config/db');

app.get('/api/dashboard', async (req, res) => {
  try {
    if (!isDbConnected()) {
      const totalAreaNum = memoryDb.sites.reduce((sum, s) => sum + (Number(s.area) || 0), 0);
      const plantedCount = memoryDb.monitoring.reduce((sum, m) => sum + (Number(m.trees) || 0), 0);
      const alertCount = memoryDb.alerts.filter(a => a.status === 'unread').length;
      
      let survRate = '91%';
      if (memoryDb.monitoring.length > 0) {
        const sumSurv = memoryDb.monitoring.reduce((sum, m) => sum + (Number(m.survival) || 0), 0);
        survRate = `${Math.round(sumSurv / memoryDb.monitoring.length)}%`;
      }
      
      return res.json({
        totalArea: totalAreaNum > 0 ? `${totalAreaNum} Acres` : '1250 Acres',
        plantedTrees: plantedCount > 0 ? plantedCount.toLocaleString() : '480,000',
        survivalRate: survRate,
        nextMonitoring: '2026-07-20',
        alertCount: alertCount || 3,
        projects: memoryDb.projects.map(p => ({ name: p.name, status: p.status === 'active' ? 'Active' : 'Completed' }))
      });
    }
    
    const sites = await SiteRecord.find({});
    const projects = await ProjectRecord.find({});
    const alerts = await AlertRecord.find({ status: 'unread' });
    const monitoring = await MonitoringRecord.find({});
    
    const totalAreaNum = sites.reduce((sum, s) => sum + (Number(s.area) || 0), 0);
    const plantedCount = monitoring.reduce((sum, m) => sum + (Number(m.trees) || 0), 0);
    const projectList = projects.map(p => ({ name: p.name, status: p.status === 'active' ? 'Active' : 'Completed' }));
    
    let survRate = '91%';
    if (monitoring.length > 0) {
      const sumSurv = monitoring.reduce((sum, m) => sum + (Number(m.survival) || 0), 0);
      survRate = `${Math.round(sumSurv / monitoring.length)}%`;
    }
    
    res.json({
      totalArea: totalAreaNum > 0 ? `${totalAreaNum} Acres` : '1250 Acres',
      plantedTrees: plantedCount > 0 ? plantedCount.toLocaleString() : '480,000',
      survivalRate: survRate,
      nextMonitoring: '2026-07-20',
      alertCount: alerts.length,
      projects: projectList.length > 0 ? projectList : [
        { name: 'Green Valley Restoration Project', status: 'Active' },
        { name: 'Coastal Mangrove Restoration', status: 'Active' },
        { name: 'Highland Afforestation Initiative', status: 'Active' }
      ]
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    res.status(500).json({ success: false, message: 'Error loading dashboard data' });
  }
});

// Dynamic port bindings on startup
function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`server start at ${port}`);
    connectToMongoDB();
  });
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.warn(`Port ${port} is busy. Trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error(error);
      process.exit(1);
    }
  });
}

startServer(DEFAULT_PORT);
