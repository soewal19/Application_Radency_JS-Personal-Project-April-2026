# CI/CD Deployment Scripts for EventHub

This folder contains shell scripts for deploying the EventHub application.

## Scripts

### `deploy-render.sh` — Deploy to Render.com

Triggers a service redeploy on Render.com via the API and polls the status.

```bash
# Set environment variables
export RENDER_API_KEY=rnd_your_api_key_here
export RENDER_SERVICE_ID=srv-your-service-id-here

# Run the deploy script
./ci_cd/deploy-render.sh
```

### `deploy-github.sh` — Push to GitHub (+ optional Render deploy)

Stages, commits, and pushes code to GitHub. Can optionally trigger Render deploys.

```bash
# Basic usage — just push to GitHub
./ci_cd/deploy-github.sh "feat: my new feature"

# With Render auto-deploy (set all env vars)
export RENDER_API_KEY=rnd_your_api_key_here
export RENDER_BACKEND_SERVICE_ID=srv-backend-id
export RENDER_FRONTEND_SERVICE_ID=srv-frontend-id
./ci_cd/deploy-github.sh "feat: deploy to production"
```

## Environment Variables

| Variable | Description |
|---|---|
| `RENDER_API_KEY` | API key from Render Dashboard > Account > API Keys |
| `RENDER_SERVICE_ID` | Service ID (found in the Render dashboard URL) |
| `RENDER_BACKEND_SERVICE_ID` | Backend service ID for combined deploys |
| `RENDER_FRONTEND_SERVICE_ID` | Frontend service ID for combined deploys |

## GitHub Actions

The project also includes a GitHub Actions CI/CD pipeline in `.github/workflows/`. 
Merge to `main` branch will automatically trigger deployment.
