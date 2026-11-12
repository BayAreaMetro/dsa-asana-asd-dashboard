require('dotenv').config();

const { createApp } = require('./app');
const { loadConfig } = require('./config');
const AsanaClient = require('./services/asana-client');
const { DashboardService } = require('./services/dashboard-service');

function startServer() {
  const config = loadConfig();
  const asanaClient = new AsanaClient(config.asanaAccessToken);
  const dashboardService = new DashboardService(asanaClient, {
    concurrency: config.asanaConcurrency
  });
  const app = createApp({
    dashboardService,
    defaultPortfolioId: config.defaultPortfolioId,
    cacheDurationMs: config.cacheDurationMs,
    corsOrigins: config.corsOrigins
  });
  const server = app.listen(config.port, () => {
    console.log(`DSA Work Plan Dashboard listening on port ${config.port}`);
  });

  function shutdown(signal) {
    console.log(`${signal} received; closing HTTP server`);
    server.close((error) => {
      if (error) {
        console.error('HTTP server shutdown failed', error);
        process.exitCode = 1;
      }
    });
  }

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));

  return server;
}

if (require.main === module) {
  try {
    startServer();
  } catch (error) {
    console.error(`Unable to start dashboard: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  startServer
};
