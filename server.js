require('dotenv').config();
const express = require('express');
const cors = require('cors');
const AsanaClient = require('./asana-client');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const client = new AsanaClient(process.env.ASANA_ACCESS_TOKEN);
let cachedData = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

app.get('/', (req, res) => {
  res.json({ message: 'Data Strategy & Analytics Workplan Dashboard API', endpoints: ['/api/dashboard', '/api/portfolio/:id'] });
});

app.get('/api/dashboard', async (req, res) => {
  try {
    const now = Date.now();
    if (cachedData && (now - cacheTime) < CACHE_DURATION) {
      return res.json(cachedData);
    }
    
    const dashboardData = await client.getDashboardData();
    cachedData = dashboardData;
    cacheTime = now;
    res.json(dashboardData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/portfolio/:id', async (req, res) => {
  try {
    const dashboardData = await client.getDashboardData(req.params.id);
    res.json(dashboardData[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Data Strategy & Analytics Workplan Dashboard running on http://localhost:${PORT}`);
  console.log(`Dashboard endpoint: http://localhost:${PORT}/api/dashboard`);
});