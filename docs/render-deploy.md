# Deploying EventHub on Render.com

## Prerequisites

- A [Render.com](https://render.com) account
- This repository pushed to GitHub or GitLab

## Option 1: Blueprint (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **Blueprint**
3. Connect your repository
4. Render will detect `render.yaml` and provision:
   - SQLite database (`eventhub-db`)
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

### 1. Create SQLite Database

- SQLite is file-based, no separate database service needed
- SQLite database file will be created automatically

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

## Troubleshooting

### "Database: Offline" or "WebSocket: Offline" on Render

If you see these errors after deployment, check the following:

1. **Backend Environment Variables**:
   - `DATABASE_URL`: Must be a valid SQLite connection string (e.g., `postgresql://...`).
   - `ALLOWED_ORIGINS`: Must include your frontend URL (e.g., `https://your-frontend.onrender.com`). No trailing slashes!
   - `JWT_SECRET`: Must be set.

2. **Frontend Environment Variables**:
   - `VITE_API_URL`: Must be your backend URL + `/api` (e.g., `https://your-backend.onrender.com/api`).
   - `VITE_SOCKET_URL`: Must be your backend URL (e.g., `https://your-backend.onrender.com`).

3. **Database Migrations**:
   - Ensure `npx prisma migrate deploy` has run. You can check this in the "Events" tab of your backend service on Render.

### Automated Fix Script

If you have a Render API Key, you can use the following script to automatically configure your services:

```bash
# Set your keys
export RENDER_API_KEY="your_api_key"
export FRONTEND_URL="https://application-frontend-fjji.onrender.com"
export BACKEND_URL="https://application-backend-54iw.onrender.com"

# Run the deployment helper (if available in ci_cd/)
./ci_cd/deploy-render.sh
```
