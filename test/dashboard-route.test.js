const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');

async function withServer(options, callback) {
  const server = createApp(options).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();

  try {
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
}

test('dashboard routes cache responses independently by portfolio ID', async () => {
  const calls = [];
  const dashboardService = {
    async getDashboardData(id) {
      calls.push(id);
      return [{
        portfolio: { gid: id, name: `Portfolio ${id}` },
        projects: []
      }];
    }
  };

  await withServer({
    dashboardService,
    defaultPortfolioId: '123',
    cacheDurationMs: 60000
  }, async (baseUrl) => {
    const dashboard = await fetch(`${baseUrl}/api/dashboard`);
    const repeatedDashboard = await fetch(`${baseUrl}/api/dashboard`);
    const portfolio = await fetch(`${baseUrl}/api/portfolio/456`);
    const repeatedPortfolio = await fetch(`${baseUrl}/api/portfolio/456`);

    assert.equal(dashboard.status, 200);
    assert.equal(repeatedDashboard.status, 200);
    assert.equal(portfolio.status, 200);
    assert.equal(repeatedPortfolio.status, 200);
    assert.equal((await portfolio.json()).portfolio.gid, '456');
    assert.deepEqual(calls, ['123', '456']);
  });
});

test('dashboard routes validate IDs and return consistent errors', async () => {
  const loggedErrors = [];
  const dashboardService = {
    async getDashboardData() {
      throw new Error('sensitive upstream details');
    }
  };

  await withServer({
    dashboardService,
    defaultPortfolioId: '123',
    cacheDurationMs: 60000,
    logger: {
      error(...args) {
        loggedErrors.push(args);
      }
    }
  }, async (baseUrl) => {
    const invalid = await fetch(`${baseUrl}/api/portfolio/not-valid`);
    assert.equal(invalid.status, 400);
    assert.deepEqual(await invalid.json(), {
      error: 'Portfolio ID must contain only digits'
    });

    const failed = await fetch(`${baseUrl}/api/dashboard`);
    assert.equal(failed.status, 502);
    assert.deepEqual(await failed.json(), {
      error: 'Unable to retrieve dashboard data'
    });
    assert.equal(loggedErrors.length, 1);

    const missing = await fetch(`${baseUrl}/api/missing`);
    assert.equal(missing.status, 404);
    assert.deepEqual(await missing.json(), {
      error: 'API endpoint not found'
    });
  });
});

test('application serves the static dashboard at the root', async () => {
  await withServer({
    dashboardService: {
      async getDashboardData() {
        return [];
      }
    },
    defaultPortfolioId: '123',
    cacheDurationMs: 60000
  }, async (baseUrl) => {
    const response = await fetch(baseUrl);
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/html/);
    assert.match(body, /Data Strategy &amp; Analytics Work Plan Dashboard/);
  });
});

test('application enables CORS only for configured origins', async () => {
  await withServer({
    dashboardService: {
      async getDashboardData() {
        return [];
      }
    },
    defaultPortfolioId: '123',
    cacheDurationMs: 60000,
    corsOrigins: ['https://allowed.example']
  }, async (baseUrl) => {
    const allowed = await fetch(`${baseUrl}/api/dashboard`, {
      headers: { Origin: 'https://allowed.example' }
    });
    const denied = await fetch(`${baseUrl}/api/dashboard`, {
      headers: { Origin: 'https://denied.example' }
    });

    assert.equal(
      allowed.headers.get('access-control-allow-origin'),
      'https://allowed.example'
    );
    assert.equal(denied.headers.get('access-control-allow-origin'), null);
  });
});
