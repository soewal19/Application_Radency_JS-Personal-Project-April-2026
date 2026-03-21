# Backend Agent Guide

## Architecture

The backend is built with NestJS 10 using:
- **Fastify** adapter (3x faster than Express — see [DOU article](https://dou.ua/forums/topic/48951/))
- **Prisma ORM** + PostgreSQL (replaces TypeORM)
- **Passport JWT** for authentication
- **Socket.IO** for WebSocket real-time communication
- **Swagger** for API documentation
- **class-validator** + **class-transformer** for DTO validation
- **Structured logging** via NestJS Logger

## Module Structure

```
backend/
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── seed.ts                 # Database seeding
│   └── migrations/             # Prisma migrations
├── src/
│   ├── main.ts                 # Entry point (Fastify)
│   ├── app.module.ts           # Root module
│   ├── prisma/                 # Prisma module
│   │   ├── prisma.module.ts    # Global module
│   │   └── prisma.service.ts   # PrismaClient lifecycle
│   ├── auth/                   # Authentication module
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── dto/
│   │   ├── strategies/jwt.strategy.ts
│   │   └── guards/jwt-auth.guard.ts
│   ├── events/                 # Events module
│   │   ├── events.module.ts
│   │   ├── events.controller.ts
│   │   ├── events.service.ts
│   │   ├── events.gateway.ts   # WebSocket Gateway
│   │   └── dto/
│   └── common/
│       └── filters/all-exceptions.filter.ts
```

## Prisma ORM

### Migration Workflow
```bash
# Create a new migration
npx prisma migrate dev --name <migration_name>

# Deploy migrations (production)
npx prisma migrate deploy

# Reset database
npx prisma migrate reset

# Generate Prisma client
npx prisma generate

# Open Prisma Studio (DB GUI)
npx prisma studio

# Seed database
npx prisma db seed
```

### Best Practices
- Always use `prisma.$transaction()` for operations that modify multiple records
- Use `findUnique` with compound unique keys for participant lookups
- Use `insensitive` mode for text search
- Add indexes for frequently queried columns (see schema.prisma)

## Coding Rules

### 1. Modules
- One module = one business domain
- PrismaModule is global — inject PrismaService anywhere
- No TypeORM dependencies

### 2. DTOs
- All inputs pass through DTOs with class-validator decorators
- Swagger decorators for API documentation

### 3. Authentication
- JWT tokens (access 24h, refresh 7d)
- `JwtAuthGuard` protects routes
- Passwords hashed with bcrypt (12 rounds)

### 4. WebSocket
- `EventsGateway` broadcasts events to all clients
- Events: `event:created`, `event:updated`, `event:deleted`, `event:joined`, `event:left`

### 5. Performance (from DOU article)
- **Fastify adapter** — 3x faster than Express
- Structured logging with NestJS Logger
- Atomic transactions for join/leave operations
- Database indexes on hot columns

### 6. Swagger
- Available at `/api/docs`
- Enhanced with `@ApiParam`, `@ApiQuery`, `@ApiBody`
- Bearer auth configured as `JWT-auth`
- Persistent authorization in Swagger UI

### 7. Environment Variables
- `DATABASE_URL` — Prisma connection string
- `JWT_SECRET` — JWT signing secret
- `ALLOWED_ORIGINS` — CORS whitelist
- `PORT` — Server port (default 3000)
- `OPENAI_API_KEY` — Optional OpenAI API key. When set, the AI assistant endpoint (`POST /api/ai/query`) uses OpenAI function-calling tools for event discovery. When unset, the endpoint returns a safe stubbed response for local/dev testing.
