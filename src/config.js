const DEFAULTS = {
  port: 8080,
  cacheDurationMs: 5 * 60 * 1000,
  asanaConcurrency: 5
};

function parsePositiveInteger(name, value, fallback) {
  if (value === undefined || value === '') return fallback;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }

  return parsed;
}

function loadConfig(env = process.env) {
  const asanaAccessToken = env.ASANA_ACCESS_TOKEN?.trim();
  const defaultPortfolioId = env.ASANA_PORTFOLIO_ID?.trim();

  if (!asanaAccessToken) {
    throw new Error('ASANA_ACCESS_TOKEN is required');
  }

  if (!defaultPortfolioId) {
    throw new Error('ASANA_PORTFOLIO_ID is required');
  }

  if (!/^\d+$/.test(defaultPortfolioId)) {
    throw new Error('ASANA_PORTFOLIO_ID must contain only digits');
  }

  return {
    port: parsePositiveInteger('PORT', env.PORT, DEFAULTS.port),
    cacheDurationMs: parsePositiveInteger(
      'CACHE_DURATION_MS',
      env.CACHE_DURATION_MS,
      DEFAULTS.cacheDurationMs
    ),
    asanaConcurrency: parsePositiveInteger(
      'ASANA_CONCURRENCY',
      env.ASANA_CONCURRENCY,
      DEFAULTS.asanaConcurrency
    ),
    asanaAccessToken,
    defaultPortfolioId,
    corsOrigins: (env.CORS_ORIGINS || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
  };
}

module.exports = {
  DEFAULTS,
  loadConfig,
  parsePositiveInteger
};
