# Asana Dashboard

A minimal Node.js application for creating Asana dashboards using the Asana REST API.

## Features

- Retrieve portfolios from your Asana workspace
- Get projects within each portfolio
- Display project statuses

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Get your Asana Personal Access Token:
   - Go to Asana → My Profile Settings → Apps → Manage Developer Apps
   - Create a Personal Access Token

3. Set environment variable:
   ```bash
   export ASANA_ACCESS_TOKEN=your_token_here
   ```

4. Run the application:
   ```bash
   npm start
   ```

## Usage

The application will display all portfolios, their projects, and current project statuses in the console.