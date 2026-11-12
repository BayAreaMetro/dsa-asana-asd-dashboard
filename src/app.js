const path = require('path');
const express = require('express');
const { createDashboardRouter } = require('./routes/dashboard');
const { cors } = require('./middleware/cors');
const { apiNotFound, errorHandler } = require('./middleware/error-handler');

function createApp(options) {
  const {
    dashboardService,
    defaultPortfolioId,
    cacheDurationMs,
    corsOrigins = [],
    logger = console,
    publicDirectory = path.join(__dirname, '..', 'public')
  } = options;
  const app = express();

  app.disable('x-powered-by');
  app.use(cors(corsOrigins));
  app.use(express.json({ limit: '100kb' }));

  app.get('/', (req, res) => {
    res.sendFile(path.join(publicDirectory, 'index.html'));
  });
  app.use(express.static(publicDirectory, { index: false }));

  app.use('/api', createDashboardRouter({
    dashboardService,
    defaultPortfolioId,
    cacheDurationMs
  }));
  app.use('/api', apiNotFound);
  app.use(errorHandler(logger));

  return app;
}

module.exports = {
  createApp
};
