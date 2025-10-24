# Data Strategy & Analytics Workplan Dashboard

A Node.js application for tracking Data Strategy and Analytics section workplan progress using the Asana REST API.

## Features

- Real-time tracking of DSA workplan projects and deliverables
- Portfolio-based project organization and status monitoring
- Progress visualization with priority and timeline tracking

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