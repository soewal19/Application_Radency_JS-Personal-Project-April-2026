# EventHub — Event Management Platform

## 🌐 Live Demo

| Service | URL |
|---|---|
| **Frontend** | https://application-frontend-fjji.onrender.com |
| **Backend API** | https://application-backend-54iw.onrender.com |
| **Swagger Docs** | https://application-backend-54iw.onrender.com/api/docs |

> ⚠️ Free-tier Render services may take ~30 seconds to wake up after inactivity.

## 📋 About

**EventHub** is a full-stack event management platform built with React and NestJS. The application allows users to create, edit, and discover events, register for them, and track activity in real time via WebSocket.

### Key Features

- 🎫 **Events** — create, edit, delete with pagination (15/page), search, and category filtering
- 👥 **Participants** — join/leave events with atomic transactions (Prisma)
- 🔐 **Authentication** — JWT (access 1h + refresh 7d), bcrypt, automatic token refresh
- 🤖 **AI Swarm Orchestrator** — Advanced Multi-Agent architecture with specialized agents (Search, Management, Analytics) and an "Event Concierge" for every event page.
- ⚡ **Real-time WebSockets** — High-performance Socket.IO integration for all interactive actions (join, create, delete, AI chat) with automatic reconnection and heartbeat.
- 🪵 **DevOps Logging** — Structured frontend logging system with levels (INFO, WARN, ERROR), contextual tags, and production-ready filtering.
- 📊 **Analytics** — Activity charts (Recharts) and real-time system health monitoring (DB/WS status indicators).
- 📅 **Calendar Views** — Monthly and Weekly views with automatic event coloring by the first tag.
-  **Swagger** — Auto-generated API documentation at `/api/docs`
- 🧪 **E2E Testing** — Comprehensive test suite for AI, Events lifecycle, and Groq Cloud connectivity.

### AI Swarm Orchestrator (Multi-Agent Architecture)

The project implements a cutting-edge **Multi-Agent Swarm** architecture for the AI Assistant:
- **Master Orchestrator**: Analyzes user intent and delegates tasks to specialized agents using a router pattern.
- **Specialized Agents**: 
    - `Discovery Scout`: Expert in searching and filtering events.
    - `Event Manager`: Handles creation, updates, and participant management.
    - `Data Insight`: Provides real-time statistics and event analytics.
- **Event Concierge**: Every event details page features a personal AI assistant that knows everything about that specific event (location, organizer, availability).
- **Parallel Tool Calling**: Supports executing multiple tools simultaneously (e.g., "Create a meeting and show my stats").
- **MLOps Resiliency**: 
    - **Model Rotation**: Automatic fallback between a pool of models (`llama-3.3-70b` → `llama-3.1-70b` → `llama-3.1-8b`) when hitting rate limits (Error 429).
    - **Hierarchical Fallback**: If all Groq models are exhausted, the system automatically routes requests to OpenAI (`gpt-4o-mini`).
    - **Real-time Metadata**: The UI displays the active model and current token limit status for full transparency.
- **No Hallucinations**: Uses **Function Calling** to interact with the live PostgreSQL database via WebSockets.

### Ready-Made AI Skills

Need more capabilities for your AI agents? Download ready-made skills from **VibeBaza**:

🔗 **https://vibebaza.com** — A marketplace for AI agent skills and tools.

Simply browse the skill library, download JSON configurations, and register them in your Agent Builder to extend your AI capabilities instantly!

### High-Performance WebSockets

To ensure maximum responsiveness, the application has moved beyond traditional REST for interactive actions:
- **Bi-directional Communication**: Creation, joining, and AI chatting now happen over **Socket.IO**.
- **Low Latency**: Reduced HTTP overhead by reusing the same persistent connection for multiple actions.
- **System Health Monitoring**: Real-time indicators in the Header show the status of the Database and WebSocket connection (Green/Red) with a "System Ready" pulse.
- **Wait-and-Retry**: The frontend service includes a 5-second buffer to handle temporary connection drops without failing user actions.

### Tech Stack

| Frontend | Backend |
|---|---|
| React 18, Vite, TypeScript | NestJS 10, Fastify |
| Zustand, React Router v6 | Prisma ORM, PostgreSQL |
| Tailwind CSS, Framer Motion | Passport JWT, Socket.IO (WS) |
| Recharts, Sonner, Zod | Groq SDK (Llama 3.3 70B) |
| Lucide React, Google Charts | OpenAI SDK (GPT-4o) |
| Radix UI, Lucide | Swagger, class-validator |

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
git clone https://github.com/soewal19/Application_Radency_JS-Personal-Project-April-2026
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

## ⚡ WebSocket Keepalive (Ping)

The frontend includes a built-in Socket.IO keepalive mechanism (`src/services/socket.ts`).
After connecting, the client automatically sends a `ping` event every **25 seconds** to prevent the connection from being dropped by idle timeouts (important for free-tier hosting).

The server responds with a `pong` event confirming the connection is alive.

```
Client ──ping──▶ Server
Client ◀──pong── Server
(every 25 seconds)
```

## 🔄 CI/CD

Deployment scripts are available in the `ci_cd/` folder:

| Script | Description |
|---|---|
| `ci_cd/deploy-render.sh` | Trigger a Render.com service redeploy via API |
| `ci_cd/deploy-github.sh` | Push to GitHub and optionally trigger Render deploys |

See [`ci_cd/README.md`](ci_cd/README.md) for usage instructions.

GitHub Actions workflows are in `.github/workflows/`.

## 📊 SOLID Principles

Applied throughout the architecture. See [docs/](docs/) for details.
