const test = require('node:test');
const assert = require('node:assert/strict');
const { DEFAULTS, loadConfig } = require('../src/config');

test('loadConfig parses required values and applies defaults', () => {
  const config = loadConfig({
    ASANA_ACCESS_TOKEN: 'token',
    ASANA_PORTFOLIO_ID: '123'
  });

  assert.deepEqual(config, {
    port: DEFAULTS.port,
    cacheDurationMs: DEFAULTS.cacheDurationMs,
    asanaConcurrency: DEFAULTS.asanaConcurrency,
    asanaAccessToken: 'token',
    defaultPortfolioId: '123',
    corsOrigins: []
  });
});

test('loadConfig parses an explicit CORS origin allowlist', () => {
  const config = loadConfig({
    ASANA_ACCESS_TOKEN: 'token',
    ASANA_PORTFOLIO_ID: '123',
    CORS_ORIGINS: 'https://one.example, https://two.example'
  });

  assert.deepEqual(config.corsOrigins, [
    'https://one.example',
    'https://two.example'
  ]);
});

test('loadConfig validates required environment variables', () => {
  assert.throws(
    () => loadConfig({ ASANA_PORTFOLIO_ID: '123' }),
    /ASANA_ACCESS_TOKEN is required/
  );
  assert.throws(
    () => loadConfig({ ASANA_ACCESS_TOKEN: 'token' }),
    /ASANA_PORTFOLIO_ID is required/
  );
  assert.throws(
    () => loadConfig({
      ASANA_ACCESS_TOKEN: 'token',
      ASANA_PORTFOLIO_ID: 'not-a-number'
    }),
    /must contain only digits/
  );
});

test('loadConfig validates positive integer settings', () => {
  assert.throws(
    () => loadConfig({
      ASANA_ACCESS_TOKEN: 'token',
      ASANA_PORTFOLIO_ID: '123',
      CACHE_DURATION_MS: '0'
    }),
    /CACHE_DURATION_MS must be a positive integer/
  );
});
