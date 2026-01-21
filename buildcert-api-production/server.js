require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Import routes
const oauthRoutes = require('./routes/oauth');
const quoteRoutes = require('./routes/quotes');
const planningPortalRoutes = require('./routes/planning-portal');
const frontRoutes = require('./routes/front');
const pipedriveRoutes = require('./routes/pipedrive');

// API Routes
app.use('/oauth', oauthRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/planning-portal', planningPortalRoutes);
app.use('/api/front', frontRoutes);
app.use('/api/pipedrive', pipedriveRoutes);

// Serve Pipedrive Custom Panel
app.get('/pipedrive-panel', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pipedrive-panel.html'));
});

// Serve Front Sidebar Plugin
app.get('/front-sidebar', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'front-sidebar.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Buildcert Automation API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      quote: '/api/quotes/calculate',
      planningPortal: '/api/planning-portal/check',
      pipedrivePanel: '/pipedrive-panel',
      frontSidebar: '/front-sidebar'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Buildcert API running on port ${PORT}`);
  console.log(`   Pipedrive Panel: http://localhost:${PORT}/pipedrive-panel`);
  console.log(`   Front Sidebar: http://localhost:${PORT}/front-sidebar`);
});
