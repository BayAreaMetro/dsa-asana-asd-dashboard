const axios = require('axios');

class AsanaClient {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.baseURL = 'https://app.asana.com/api/1.0';
    this.headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
  }

  async getWorkspaces() {
    const response = await axios.get(`${this.baseURL}/workspaces`, { headers: this.headers });
    return response.data.data;
  }

  async getPortfolios(workspaceId, ownerId) {
    try {
      const response = await axios.get(`${this.baseURL}/portfolios?workspace=${workspaceId}&owner=${ownerId}`, { headers: this.headers });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching portfolios:', error.response?.data || error.message);
      throw error;
    }
  }

  async getProjectsInPortfolio(portfolioId) {
    const response = await axios.get(`${this.baseURL}/portfolios/${portfolioId}/items`, { headers: this.headers });
    return response.data.data;
  }

  async getProjectDetails(projectId) {
    const response = await axios.get(`${this.baseURL}/projects/${projectId}?opt_fields=current_status,custom_fields,owner.name`, { headers: this.headers });
    return response.data.data;
  }

  async getUser() {
    const response = await axios.get(`${this.baseURL}/users/me`, { headers: this.headers });
    return response.data.data;
  }

  async getPortfolioById(portfolioId) {
    const response = await axios.get(`${this.baseURL}/portfolios/${portfolioId}`, { headers: this.headers });
    return response.data.data;
  }

  async getDashboardData(portfolioId = '1209134187526722') {
    const [portfolio, projects] = await Promise.all([
      this.getPortfolioById(portfolioId),
      this.getProjectsInPortfolio(portfolioId)
    ]);
    
    const projectsWithDetails = await Promise.all(
      projects.map(async (project) => {
        try {
          const details = await this.getProjectDetails(project.gid);
          const customFields = {};
          
          if (details.custom_fields) {
            details.custom_fields.forEach(field => {
              if (field.name === 'Priority') customFields.priority = field.text_value || field.enum_value?.name || '-';
              if (field.name === 'Actual Time FTEs (Hours)') customFields.actualTimeFTEs = field.number_value || 0;
              if (field.name === 'Budgeted Time') customFields.budgetedTime = field.number_value || 0;
              if (field.name === 'FY Quarter Start') customFields.fyQuarterStart = field.text_value || field.enum_value?.name || '-';
            });
          }
          
          const budgeted = customFields.budgetedTime || 0;
          const actual = customFields.actualTimeFTEs || 0;
          const remaining = budgeted && actual ? (budgeted - actual).toFixed(1) : '-';
          
          return { 
            ...project, 
            status: details.current_status,
            owner: details.owner?.name || '-',
            customFields: {
              priority: customFields.priority || '-',
              actualTimeFTEs: customFields.actualTimeFTEs || '-',
              budgetedTime: customFields.budgetedTime || '-',
              remainingTime: remaining,
              fyQuarterStart: customFields.fyQuarterStart || '-'
            }
          };
        } catch (error) {
          return { 
            ...project, 
            status: null,
            owner: '-',
            customFields: { priority: '-', actualTimeFTEs: '-', budgetedTime: '-', remainingTime: '-', fyQuarterStart: '-' }
          };
        }
      })
    );

    // Sort projects by FY Quarter Start
    const sortedProjects = projectsWithDetails.sort((a, b) => {
      const quarterA = a.customFields?.fyQuarterStart || 'ZZZ';
      const quarterB = b.customFields?.fyQuarterStart || 'ZZZ';
      return quarterA.localeCompare(quarterB);
    });

    return [{
      portfolio,
      projects: sortedProjects
    }];
  }
}

module.exports = AsanaClient;