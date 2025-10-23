require('dotenv').config();
const AsanaClient = require('./asana-client');

async function main() {
  const accessToken = process.env.ASANA_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.error('Please set ASANA_ACCESS_TOKEN environment variable');
    process.exit(1);
  }

  const client = new AsanaClient(accessToken);

  try {
    console.log('Fetching dashboard data...');
    const dashboardData = await client.getDashboardData();
    
    console.log('\n=== ASANA DASHBOARD ===\n');
    
    dashboardData.forEach(portfolioData => {
      console.log(`Portfolio: ${portfolioData.portfolio.name}`);
      console.log(`Projects (${portfolioData.projects.length}):`);
      
      portfolioData.projects.forEach(project => {
        const statusText = project.status ? 
          `${project.status.color} - ${project.status.text}` : 
          'No status';
        console.log(`  • ${project.name}: ${statusText}`);
      });
      
      console.log('');
    });
    
    console.log('Dashboard updated. Press Ctrl+C to exit or wait 30 seconds for refresh...');
    setTimeout(() => main(), 30000);
    
  } catch (error) {
    console.error('Error fetching dashboard data:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    setTimeout(() => main(), 30000);
  }
}

main();