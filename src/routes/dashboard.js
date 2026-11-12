const express = require('express');

function isPortfolioId(value) {
  return /^\d+$/.test(value);
}

function createDashboardRouter(options) {
  const {
    dashboardService,
    defaultPortfolioId,
    cacheDurationMs,
    now = Date.now
  } = options;
  const router = express.Router();
  const cache = new Map();

  async function loadPortfolio(portfolioId) {
    const cached = cache.get(portfolioId);
    const currentTime = now();

    if (cached && currentTime - cached.createdAt < cacheDurationMs) {
      return cached.data;
    }

    const data = await dashboardService.getDashboardData(portfolioId);
    cache.set(portfolioId, { data, createdAt: currentTime });
    return data;
  }

  router.get('/dashboard', async (req, res, next) => {
    try {
      res.json(await loadPortfolio(defaultPortfolioId));
    } catch (error) {
      next(error);
    }
  });

  router.get('/portfolio/:id', async (req, res, next) => {
    if (!isPortfolioId(req.params.id)) {
      return res.status(400).json({ error: 'Portfolio ID must contain only digits' });
    }

    try {
      const data = await loadPortfolio(req.params.id);
      return res.json(data[0]);
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

module.exports = {
  createDashboardRouter,
  isPortfolioId
};
