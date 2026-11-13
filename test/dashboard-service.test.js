const test = require('node:test');
const assert = require('node:assert/strict');
const {
  DashboardService,
  extractCustomFields,
  mapWithConcurrency
} = require('../src/services/dashboard-service');

test('extractCustomFields preserves zero time values and calculates remaining time', () => {
  const fields = [
    { name: 'Priority', enum_value: { name: 'High' } },
    { name: 'Budgeted Time', number_value: 0 },
    { name: 'Actual Time FTEs (Hours)', number_value: 0 },
    { name: 'FY Quarter Start', text_value: 'Q1' }
  ];

  assert.deepEqual(extractCustomFields(fields), {
    priority: 'High',
    actualTimeFTEs: 0,
    budgetedTime: 0,
    remainingTime: '0.0',
    fyQuarterStart: 'Q1'
  });
});

test('mapWithConcurrency limits simultaneous work while preserving order', async () => {
  let active = 0;
  let peak = 0;
  const results = await mapWithConcurrency([1, 2, 3, 4], 2, async (value) => {
    active += 1;
    peak = Math.max(peak, active);
    await new Promise((resolve) => setTimeout(resolve, 5));
    active -= 1;
    return value * 2;
  });

  assert.deepEqual(results, [2, 4, 6, 8]);
  assert.equal(peak, 2);
});

test('DashboardService sorts projects and exposes individual detail failures', async () => {
  const loggedErrors = [];
  const client = {
    async getPortfolioById(id) {
      return { gid: id, name: 'Portfolio' };
    },
    async getProjectsInPortfolio() {
      return [
        { gid: '2', name: 'Missing details' },
        { gid: '1', name: 'Available details' }
      ];
    },
    async getProjectDetails(id) {
      if (id === '2') throw new Error('upstream failure');
      return {
        owner: { name: 'Owner' },
        current_status: { color: 'green', text: 'Good' },
        custom_fields: [
          { name: 'FY Quarter Start', enum_value: { name: 'Q1' } }
        ]
      };
    }
  };
  const service = new DashboardService(client, {
    concurrency: 2,
    logger: {
      error(...args) {
        loggedErrors.push(args);
      }
    }
  });

  const [dashboard] = await service.getDashboardData('123');

  assert.equal(dashboard.portfolio.asanaUrl, 'https://app.asana.com/0/portfolio/123');
  assert.deepEqual(dashboard.projects.map((project) => project.gid), ['1', '2']);
  assert.equal(dashboard.projects[0].dataAvailability.details, 'available');
  assert.equal(dashboard.projects[1].dataAvailability.details, 'unavailable');
  assert.equal(loggedErrors.length, 1);
});

test('DashboardService supports an empty portfolio', async () => {
  const service = new DashboardService({
    async getPortfolioById(id) {
      return { gid: id, name: 'Empty' };
    },
    async getProjectsInPortfolio() {
      return [];
    }
  });

  const [dashboard] = await service.getDashboardData('123');
  assert.deepEqual(dashboard.projects, []);
});

test('DashboardService does not log Axios request configuration', async () => {
  const logs = [];
  const error = new Error('request failed');
  error.code = 'ERR_REQUEST';
  error.config = {
    headers: {
      Authorization: 'Bearer secret-token'
    }
  };
  error.response = { status: 429 };
  const service = new DashboardService({
    async getPortfolioById(id) {
      return { gid: id, name: 'Portfolio' };
    },
    async getProjectsInPortfolio() {
      return [{ gid: '1', name: 'Project' }];
    },
    async getProjectDetails() {
      throw error;
    }
  }, {
    logger: {
      error(...args) {
        logs.push(args);
      }
    }
  });

  await service.getDashboardData('123');

  assert.equal(logs.length, 1);
  assert.deepEqual(logs[0][1], {
    message: 'request failed',
    code: 'ERR_REQUEST',
    status: 429
  });
  assert.doesNotMatch(JSON.stringify(logs), /secret-token/);
});
