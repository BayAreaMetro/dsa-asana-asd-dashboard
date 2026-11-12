const FIELD_NAMES = {
  priority: 'Priority',
  actualTimeFTEs: 'Actual Time FTEs (Hours)',
  budgetedTime: 'Budgeted Time',
  fyQuarterStart: 'FY Quarter Start'
};
const { summarizeError } = require('../error-summary');

function fieldValue(field) {
  if (field.number_value !== null && field.number_value !== undefined) {
    return field.number_value;
  }

  return field.text_value || field.enum_value?.name || null;
}

function extractCustomFields(fields = []) {
  const values = {};

  for (const field of fields) {
    const key = Object.entries(FIELD_NAMES).find(([, name]) => field.name === name)?.[0];
    if (key) values[key] = fieldValue(field);
  }

  const budgetedTime = values.budgetedTime ?? '-';
  const actualTimeFTEs = values.actualTimeFTEs ?? '-';
  const hasTimeValues =
    typeof budgetedTime === 'number' && typeof actualTimeFTEs === 'number';

  return {
    priority: values.priority ?? '-',
    actualTimeFTEs,
    budgetedTime,
    remainingTime: hasTimeValues
      ? (budgetedTime - actualTimeFTEs).toFixed(1)
      : '-',
    fyQuarterStart: values.fyQuarterStart ?? '-'
  };
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index], index);
    }
  }

  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

class DashboardService {
  constructor(asanaClient, options = {}) {
    this.asanaClient = asanaClient;
    this.concurrency = options.concurrency || 5;
    this.logger = options.logger || console;
  }

  async getDashboardData(portfolioId) {
    const [portfolio, projects] = await Promise.all([
      this.asanaClient.getPortfolioById(portfolioId),
      this.asanaClient.getProjectsInPortfolio(portfolioId)
    ]);

    const detailedProjects = await mapWithConcurrency(
      projects,
      this.concurrency,
      async (project) => this.buildProject(project)
    );

    detailedProjects.sort((a, b) => {
      const quarterA = a.customFields.fyQuarterStart;
      const quarterB = b.customFields.fyQuarterStart;

      if (quarterA === '-' && quarterB !== '-') return 1;
      if (quarterB === '-' && quarterA !== '-') return -1;
      return String(quarterA).localeCompare(String(quarterB));
    });

    return [{
      portfolio: {
        ...portfolio,
        asanaUrl: `https://app.asana.com/0/portfolio/${portfolioId}`
      },
      projects: detailedProjects
    }];
  }

  async buildProject(project) {
    try {
      const details = await this.asanaClient.getProjectDetails(project.gid);

      return {
        ...project,
        status: details.current_status || null,
        owner: details.owner?.name || '-',
        customFields: extractCustomFields(details.custom_fields),
        dataAvailability: {
          details: 'available'
        }
      };
    } catch (error) {
      this.logger.error(
        `Unable to load Asana project ${project.gid}`,
        summarizeError(error)
      );

      return {
        ...project,
        status: null,
        owner: '-',
        customFields: extractCustomFields(),
        dataAvailability: {
          details: 'unavailable',
          message: 'Project details could not be loaded'
        }
      };
    }
  }
}

module.exports = {
  DashboardService,
  extractCustomFields,
  mapWithConcurrency
};
