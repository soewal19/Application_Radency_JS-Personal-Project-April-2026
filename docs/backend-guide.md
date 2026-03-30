# Backend Agent Guide

## Architecture

The backend is built with NestJS 10 using:
- **Fastify** adapter (3x faster than Express — see [DOU article](https://dou.ua/forums/topic/48951/))
- **Prisma ORM** + SQLite (replaces TypeORM)
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
- `GROQ_API_KEY` — Optional Groq API key (primary AI provider). When set, enables the hierarchical fallback system for resilient AI responses.

## AI Service Fallback Strategy

The AI service implements a **Hierarchical Fallback Strategy** for seamless failover when tokens are exhausted or rate limits are reached:

### Provider Tiers

| Tier | Provider | Model | Use Case |
|------|----------|-------|----------|
| 1 (Primary) | Groq | `llama-3.3-70b-versatile` | Best balance of performance/speed |
| 2 | Groq | `llama-3.1-70b-versatile` | High-reasoning tasks fallback |
| 3 | Groq | `llama-3.1-8b-instant` | Extremely fast, high limits |
| 4 | Groq | `llama-3.2-3b-preview` | Small, efficient preview |
| 5 (Fallback) | OpenAI | `gpt-4o-mini` | Final fallback when Groq fails |
| 6 (Demo) | Mock | N/A | Development/demo when all providers fail |

### Automatic Failover Logic

The failover is handled in [`ai.service.ts:66-139`](backend/src/ai/ai.service.ts):

1. **Rate Limit Handling (HTTP 429)**: When Groq returns 429, the system automatically rotates to the next model in the pool:
   ```typescript
   if (err.status === 429) {
     this.logger.warn(`Rate limit (429) for ${model}. Rotating to next in pool...`);
     continue; // Move to next model in pool
   }
   ```

2. **Authentication Errors (HTTP 401)**: If API key is invalid, stops trying Groq and moves to OpenAI fallback.

3. **Complete Failure**: If all providers fail, the system enters **Mock Mode** for demo purposes.

### Configuration

Both API keys are optional — the system gracefully degrades:
- With `GROQ_API_KEY` → Full hierarchical fallback
- With only `OPENAI_API_KEY` → Direct to OpenAI fallback
- Without keys → Mock/Demo mode

## Custom AI Agents & Swarm Architecture

The EventHub backend features a **Custom AI Swarm Architecture** where multiple specialized agents work together to handle user requests.

### Agent Types

| Agent | Role | Tools (Skills) |
|-------|------|----------------|
| **Master Orchestrator** | Router & Supervisor | `delegate_to_agent` |
| **Discovery Scout** | Search Specialist | `searchEvents`, `getEventDetails` |
| **Event Manager** | Operations Specialist | `createEvent`, `updateEvent`, `deleteEvent`, `registerSomeone` |
| **Data Insight** | Analytics Specialist | `getEventsStats` |

### Database Integration

Agents and their skills are persisted in the database, allowing for dynamic updates and user-defined agents.

- **`Agent` Model**: Stores the agent's name, role, system prompt, and associated user (if custom).
- **`Skill` Model**: Stores the available tools (functions) that agents can use. Supports internal and third-party skills with source URLs.
- **`Knowledge` Model**: Stores training data and persistent memory for agents, enabling Retrieval-Augmented Generation (RAG).
- **Dynamic Loading**: The `AiService` dynamically fetches active agents and their associated knowledge from the database to populate the swarm.

### Implementation Details

- **Swarm Handover**: The Orchestrator analyzes the request and uses the `delegate_to_agent` tool to hand over the conversation to the most suitable specialized agent.
- **Tool Execution**: Specialized agents use their assigned skills to interact with the system (e.g., searching the database or creating events).
- **RAG (Retrieval-Augmented Generation)**: Agents receive relevant context from their `Knowledge` base to provide accurate, domain-specific responses without retraining the underlying model.
- **Context Management**: Agents receive relevant context (e.g., current event details, user information) to provide accurate responses.

## Event Tags System

The event tagging system has been enhanced to support both predefined and custom tags.

### Features
- **Normalized Tags**: All tags are stored with a `normalized` field (lowercase) to ensure uniqueness and efficient searching.
- **Connect or Create**: When creating/updating an event, tags are automatically connected if they exist or created if they are new.
- **Searchable Dropdown**: The frontend provides a searchable dropdown for selecting existing tags or adding new ones.
- **Optional Tags**: Events can have up to 5 optional tags.

## AI Agent Builder & MLOps

The platform provides a comprehensive **Agent Builder** and **MLOps** workflow for creating and managing specialized AI workers.

### 1. Agent Assembly
Users can create custom agents by defining:
- **Identity**: Name and specialized role (e.g., "Marketing Specialist").
- **System Prompt**: Core instructions and behavioral guidelines.
- **Skill Assignment**: Linking the agent to specific tools (Skills) from the registry.

### 2. Skill Registry (Tools)
The system features a dynamic **Skill Registry** where new capabilities can be registered:
- **Internal Skills**: Native functions like `createEvent` or `searchEvents`.
- **Third-party Skills**: External tools with source URLs, allowing for a shared ecosystem of agent capabilities.
- **JSON Schema**: Skills are defined using standard JSON Schema for reliable function calling.

### 3. Knowledge Base (RAG Training)
Agents can be "trained" using **Retrieval-Augmented Generation (RAG)**:
- **Persistent Memory**: Users can add text-based knowledge entries to an agent's base.
- **Context Injection**: During a query, the `AiService` automatically fetches relevant knowledge from the database and injects it into the agent's prompt.
- **Zero Retraining**: This approach allows for domain-specific expertise without the need for expensive model fine-tuning.

### 4. Swarm Orchestration
Custom agents are automatically integrated into the **Master Orchestrator's** workflow. When a user submits a query, the Orchestrator:
1. Analyzes the intent.
2. Identifies the most suitable agent (system or custom).
3. Delegates the task via the `delegate_to_agent` tool.
4. The specialist agent then uses its skills and knowledge to fulfill the request.
