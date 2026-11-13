const test = require('node:test');
const assert = require('node:assert/strict');
const AsanaClient = require('../src/services/asana-client');

test('AsanaClient retrieves every portfolio page', async () => {
  const requests = [];
  const responses = [
    {
      data: {
        data: [{ gid: '1' }],
        next_page: { offset: 'next-page' }
      }
    },
    {
      data: {
        data: [{ gid: '2' }],
        next_page: null
      }
    }
  ];
  const client = new AsanaClient('token', {
    httpClient: {
      async get(path, options) {
        requests.push({ path, options });
        return responses.shift();
      }
    }
  });

  const projects = await client.getProjectsInPortfolio('123');

  assert.deepEqual(projects, [{ gid: '1' }, { gid: '2' }]);
  assert.deepEqual(requests, [
    {
      path: '/portfolios/123/items',
      options: { params: { limit: 100 } }
    },
    {
      path: '/portfolios/123/items',
      options: { params: { limit: 100, offset: 'next-page' } }
    }
  ]);
});
