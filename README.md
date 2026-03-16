# EventHub — Event Management Platform

## 📋 About

**EventHub** is a full-stack event management platform built with React and NestJS. The application allows users to create, edit, and discover events, register for them, and track activity in real time via WebSocket.

### Key Features

- 🎫 **Events** — create, edit, delete with pagination (15/page), search, and category filtering
- 👥 **Participants** — join/leave events with atomic transactions (Prisma)
- 🔐 **Authentication** — JWT (access 1h + refresh 7d), bcrypt, automatic token refresh
- 📊 **Analytics** — activity charts (Recharts) in the user dashboard
- 🖼 **Profile** — avatar upload, profile editing
- ⚡ **Real-time** — Socket.IO notifications with JWT verification
- 📱 **Responsive** — mobile menu, skeleton loading, lazy loading
- 📚 **Swagger** — auto-generated API documentation at `/api/docs`

### Tech Stack

| Frontend | Backend |
|---|---|
| React 18, Vite, TypeScript | NestJS 10, Fastify |
| Zustand, React Router v6 | Prisma ORM, PostgreSQL |
| Tailwind CSS, Framer Motion | Passport JWT, Socket.IO |
| Recharts, Sonner, Zod | Swagger, class-validator |

## 🏗 Architecture

```
[Browser] ←→ [React SPA :5173] ←REST/WS→ [NestJS API :3000] ←→ [PostgreSQL :5432]
```

Detailed C4 diagram: [docs/C4.md](docs/C4.md)

## 📂 Project Structure

- `src/` — Frontend (React + Zustand + Tailwind CSS)
- `backend/` — Backend (NestJS + Prisma + Socket.IO)
- `docs/` — Documentation and agent guides
- `.github/workflows/` — CI/CD pipelines

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 16 (or use Docker)

### Option 1: Manual Setup

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/Application_Radency_JS.git
cd Application_Radency_JS

# 2. Start the backend
cd backend
cp .env.example .env
# Edit .env and set your DATABASE_URL and JWT_SECRET
npm install
npx prisma db push
npm run start:dev

# 3. Start the frontend (in a new terminal)
cd ..
npm install
npm run dev
```

Frontend will be available at: `http://localhost:5173`  
API will be available at: `http://localhost:3000`

### Option 2: Docker (Full Stack)

```bash
docker-compose up -d
```

This starts PostgreSQL, the NestJS backend, and the React frontend served via Nginx.

## 🧪 Testing

```bash
npm run test                          # Frontend unit tests (Vitest)
cd backend && npm test                # Backend unit tests
cd backend && npm run test:e2e        # E2E tests
```

## 🔑 Test Account

| Field    | Value              |
|----------|-------------------|
| Email    | test@eventhub.com  |
| Password | Test123!           |

## 📡 API Documentation

Swagger UI is available at `http://localhost:3000/api/docs` when the backend is running.

## 🚀 Deployment (Render.com)

See [docs/render-deploy.md](docs/render-deploy.md) for the step-by-step deployment guide.

The project includes a `render.yaml` Blueprint for one-click deployment.

## 🔐 Security

- JWT authentication (access + refresh tokens)
- CORS whitelist for allowed origins
- Input validation on both client (Zod) and server (class-validator)
- Passwords hashed with bcrypt (12 rounds)

## 📊 SOLID Principles

Applied throughout the architecture. See [docs/](docs/) for details.
