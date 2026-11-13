# Data Strategy & Analytics Work Plan Dashboard

A Node.js and Express dashboard that retrieves portfolio and project status data from the Asana REST API.

## Requirements

- Node.js 22 or later
- An Asana personal access token with access to the target portfolio

## Local setup

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Copy the environment template and supply your Asana values:

   ```bash
   cp .env.example .env
   ```

3. Start the web application:

   ```bash
   npm run server
   ```
4. Open `http://localhost:8080`.
5. Open the dashboard:
```bash
http://localhost:8080
```
## Usage


## Environment variables

| Variable | Required | Default | Description |
|---|---:|---:|---|
| `ASANA_ACCESS_TOKEN` | Yes | - | Personal access token used for Asana API requests |
| `ASANA_PORTFOLIO_ID` | Yes | - | Numeric ID of the portfolio shown by the dashboard |
| `PORT` | No | `8080` | HTTP server port |
| `CACHE_DURATION_MS` | No | `300000` | Per-portfolio API cache lifetime in milliseconds |
| `ASANA_CONCURRENCY` | No | `5` | Maximum concurrent project-detail requests |
| `CORS_ORIGINS` | No | Empty | Comma-separated origins allowed to call the API cross-origin |

The application validates configuration at startup and exits with an actionable error when a required or numeric setting is invalid.

## Commands

```bash
npm start       # Start the web server
npm test        # Run the Node.js test suite
npm run check   # Check server and browser JavaScript syntax
```

## API

- `GET /api/dashboard` returns the configured default portfolio.
- `GET /api/portfolio/:id` returns a numeric portfolio ID.

Responses are cached by portfolio ID. An individual project-detail failure leaves the rest of the portfolio available and marks that project's `dataAvailability.details` as `unavailable`.

## Architecture

```text
Browser assets
    |
    v
Express app and dashboard routes
    |
    v
Dashboard service and portfolio cache
    |
    v
Asana API client
```

- `src/app.js` assembles the HTTP application with injected dependencies.
- `src/routes/` owns HTTP validation and response behavior.
- `src/services/asana-client.js` owns Asana transport.
- `src/services/dashboard-service.js` maps Asana data into the dashboard model.
- `public/` contains framework-free HTML, CSS, and JavaScript.
- `test/` uses Node.js's built-in test runner.

## Design system

The browser UI follows the MTC design language used in the Regional Data Portal workshop materials:

- Nunito typography with clear editorial hierarchy
- Deep teal (`#0B2D3A`) mastheads and navigation surfaces
- Golden yellow (`#F5A800`) emphasis and primary actions
- Off-white (`#F0F4F5`) page canvas with lightly bordered content surfaces
- MTC blue (`#2C5F8A`) for secondary actions and informational states
- Slate text and restrained green/rust status colors for accessible data displays

Shared visual values are defined as CSS custom properties at the top of `public/css/dashboard.css`.

## AWS App Runner

`apprunner.yaml` installs dependencies with `npm ci` and starts the application with `npm start`. Configure `ASANA_ACCESS_TOKEN` and `ASANA_PORTFOLIO_ID` in the App Runner service environment before deployment.

Pushes to `main` trigger the deployment workflow. The repository must provide the `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `APPRUNNER_SERVICE_ARN` GitHub Actions secrets.
