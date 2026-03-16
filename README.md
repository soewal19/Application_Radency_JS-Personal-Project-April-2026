# EventHub — Event Management Platform

## 📋 About

**EventHub** — это full-stack платформа для управления событиями, построенная на React и NestJS. Приложение позволяет создавать, редактировать и находить мероприятия, регистрироваться на них и отслеживать активность в реальном времени через WebSocket.

### Ключевые возможности

- 🎫 **События** — создание, редактирование, удаление с пагинацией (15/стр), поиском и фильтрацией по категориям
- 👥 **Участники** — регистрация/отмена на события с атомарными транзакциями (Prisma)
- 🔐 **Авторизация** — JWT (access 1h + refresh 7d), bcrypt, авто-обновление токенов
- 📊 **Аналитика** — графики активности (Recharts) в личном кабинете
- 🖼 **Профиль** — загрузка аватара, редактирование данных
- ⚡ **Реальное время** — Socket.IO уведомления с JWT-проверкой
- 📱 **Адаптивность** — мобильное меню, skeleton-загрузка, lazy loading
- 📚 **Swagger** — автодокументация API на `/api/docs`

### Технологии

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
- `backend/` — Backend (NestJS + TypeORM + Socket.IO)
- `docs/` — Documentation and agent guides
- `.github/workflows/` — CI/CD pipelines

## 🚀 Quick Start

```bash
# Frontend
npm install && npm run dev

# Backend
cd backend && cp .env.example .env && npm install && npm run start:dev

# Docker (full stack)
docker-compose up -d
```

## 🧪 Testing

```bash
npm run test                          # Frontend unit tests (Vitest)
cd backend && npm test                # Backend unit tests
cd backend && npm run test:e2e        # E2E tests
```

## 🔑 Test Account

| Field    | Value              |
|----------|--------------------|
| Email    | test@eventhub.com  |
| Password | Test123!           |

## 📡 API Documentation

Swagger UI available at `http://localhost:3000/api/docs` when the backend is running.

## 🚀 Deployment (Render.com)

See [docs/render-deploy.md](docs/render-deploy.md) for step-by-step deployment guide.

The project includes a `render.yaml` Blueprint for one-click deployment.

## 🔐 Security

- JWT authentication (access + refresh tokens)
- CORS whitelist for allowed origins
- Input validation on both client (Zod) and server (class-validator)
- Passwords hashed with bcrypt (12 rounds)

## 📊 SOLID Principles

Applied throughout the architecture. See [docs/](docs/) for details.
