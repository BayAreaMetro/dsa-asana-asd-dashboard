const test = require('node:test');
const assert = require('node:assert/strict');
const {
  calculateStats,
  displayValue,
  generateProgressDescription
} = require('../public/js/dashboard-utils');

test('dashboard utilities preserve zero values', () => {
  assert.equal(displayValue(0), '0');
  assert.equal(displayValue(null), '-');
});

test('dashboard utilities describe empty portfolios without invalid percentages', () => {
  const stats = calculateStats([]);
  assert.equal(
    generateProgressDescription(stats, 0),
    'This portfolio does not currently contain any projects.'
  );
});

test('dashboard utilities count known status colors', () => {
  const stats = calculateStats([
    { status: { color: 'green' } },
    { status: { color: 'yellow' } },
    { status: { color: 'red' } },
    { status: { color: 'blue' } },
    { status: { color: 'purple' } },
    { status: null }
  ]);

  assert.deepEqual(stats, {
    onTrack: 1,
    atRisk: 1,
    offTrack: 1,
    complete: 1,
    onHold: 1
  });
});
