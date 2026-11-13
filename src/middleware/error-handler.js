const { summarizeError } = require('../error-summary');

function apiNotFound(req, res) {
  res.status(404).json({ error: 'API endpoint not found' });
}

function errorHandler(logger = console) {
  return (error, req, res, next) => {
    if (res.headersSent) return next(error);

    logger.error('Request failed', summarizeError(error));
    return res.status(502).json({ error: 'Unable to retrieve dashboard data' });
  };
}

module.exports = {
  apiNotFound,
  errorHandler
};
