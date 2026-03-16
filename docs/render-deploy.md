# Deploying EventHub on Render.com

## Prerequisites

- A [Render.com](https://render.com) account
- This repository pushed to GitHub or GitLab

## Option 1: Blueprint (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **Blueprint**
3. Connect your repository
4. Render will detect `render.yaml` and provision:
   - PostgreSQL database (`eventhub-db`)
   - Backend web service (`eventhub-backend`)
   - Frontend static site (`eventhub-frontend`)
5. After deployment, set `ALLOWED_ORIGINS` on the backend:
   ```
   https://eventhub-frontend.onrender.com
   ```
6. Set `VITE_API_URL` on the frontend:
   ```
   https://eventhub-backend.onrender.com/api
   ```

## Option 2: Manual Setup

### 1. Create PostgreSQL Database

- Go to **New** → **PostgreSQL**
- Name: `eventhub-db`
- Plan: Free
- PostgreSQL version: 16

### 2. Deploy Backend

- **New** → **Web Service**
- Runtime: Node
- Root Directory: `backend`
- Build Command: `npm ci && npm run build`
- Start Command: `node dist/main`
- Environment Variables:
  | Key | Value |
  |---|---|
  | `NODE_ENV` | `production` |
  | `PORT` | `3000` |
  | `DB_HOST` | *(from database)* |
  | `DB_PORT` | *(from database)* |
  | `DB_USERNAME` | *(from database)* |
  | `DB_PASSWORD` | *(from database)* |
  | `DB_DATABASE` | *(from database)* |
  | `JWT_SECRET` | *(generate a strong secret)* |
  | `ALLOWED_ORIGINS` | `https://your-frontend.onrender.com` |

### 3. Deploy Frontend

- **New** → **Static Site**
- Build Command: `npm ci && npm run build`
- Publish Directory: `dist`
- Environment Variables:
  | Key | Value |
  |---|---|
  | `VITE_API_URL` | `https://your-backend.onrender.com/api` |
  | `VITE_SOCKET_URL` | `https://your-backend.onrender.com` |
- Add rewrite rule: `/*` → `/index.html`

## Post-Deployment Checklist

- [ ] Backend health check passes (`/api`)
- [ ] Frontend loads and shows login page
- [ ] Test account works: `test@eventhub.com` / `Test123!`
- [ ] Events list loads with pagination
- [ ] Swagger docs accessible at `/api/docs`
- [ ] WebSocket connection established
- [ ] CORS properly configured
