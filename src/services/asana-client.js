const axios = require('axios');

class AsanaClient {
  constructor(accessToken, options = {}) {
    if (!accessToken) {
      throw new Error('An Asana access token is required');
    }

    this.http = options.httpClient || axios.create({
      baseURL: options.baseURL || 'https://app.asana.com/api/1.0',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      timeout: options.timeoutMs || 15000
    });
  }

  async getPortfolioById(portfolioId) {
    const response = await this.http.get(`/portfolios/${portfolioId}`);
    return response.data.data;
  }

  async getProjectsInPortfolio(portfolioId) {
    const projects = [];
    let offset;

    do {
      const response = await this.http.get(`/portfolios/${portfolioId}/items`, {
        params: {
          limit: 100,
          ...(offset ? { offset } : {})
        }
      });
      projects.push(...response.data.data);
      offset = response.data.next_page?.offset;
    } while (offset);

    return projects;
  }

  async getProjectDetails(projectId) {
    const response = await this.http.get(`/projects/${projectId}`, {
      params: {
        opt_fields: [
          'current_status.color',
          'current_status.created_at',
          'current_status.text',
          'custom_fields.name',
          'custom_fields.number_value',
          'custom_fields.text_value',
          'custom_fields.enum_value.name',
          'owner.name'
        ].join(',')
      }
    });
    return response.data.data;
  }
}

module.exports = AsanaClient;
