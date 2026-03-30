# Loom Video Script — EventHub Project Report (English)

## Duration: ~5-7 minutes

---

### 1. Introduction (30 sec)
> "Hi! My name is [Your Name], and this is my report on the Event Management Application — Stage 1 of the Radency JS Personal Project.
> In this video, I'll walk you through the technologies used, database schema, API design, React component communication, and challenges I faced."

---

### 2. Technologies Used (60 sec)
> "For this project I used a full-stack TypeScript setup.
>
> On the **Frontend**:
> - React 18 with TypeScript
> - Vite as the build tool
> - Zustand for state management
> - Tailwind CSS for styling
> - Framer Motion for animations
> - React Router v6 for navigation
> - Recharts for analytics charts
> - Socket.IO client for real-time notifications
> - Zod for form validation
>
> On the **Backend**:
> - NestJS with Fastify adapter
> - Prisma ORM with SQLite
> - Passport.js with JWT strategy (access token 1h + refresh token 7 days)
> - Socket.IO for real-time events
> - Swagger for API documentation
> - bcrypt for password hashing"

---

### 3. Database Schema (60 sec)
> "The database has three main tables:
>
> **Users** — stores id (UUID), email (unique), name, hashed password, and createdAt.
>
> **Events** — stores id, title, description, date, location, category, maxParticipants, currentParticipants, organizerId (foreign key to Users), organizerName, imageUrl, and timestamps.
>
> **EventParticipants** — a join table linking Users and Events with a unique constraint on eventId + userId combination, preventing double registrations.
>
> We use cascading deletes — when an event is deleted, all participant records are automatically removed."

---

### 4. API Implementation (60 sec)
> "The REST API is built with NestJS and organized into modules.
>
> Key endpoints:
> - POST /auth/register — user registration
> - POST /auth/login — returns access + refresh tokens
> - GET /events — paginated list with search and category filter
> - POST /events — create a new event
> - GET /events/:id — full event details with participants
> - PUT /events/:id — update event (owner only)
> - DELETE /events/:id — delete event (owner only)
> - POST /events/:id/join — join an event
> - DELETE /events/:id/leave — leave an event
>
> All protected routes use JWT Guards. Atomic transactions via Prisma ensure no race conditions when joining events."

---

### 5. React Component Communication (60 sec)
> "React components communicate through Zustand stores.
>
> We have three main stores:
> - **useAuthStore** — manages authentication state, JWT tokens, and auto-refresh logic
> - **useEventStore** — handles event list, loading states, pagination, search, and filter params
> - **useUsersStore** — manages user data
>
> Components subscribe to stores directly. For example, the EventsList page reads from useEventStore, and the EventDetails page both reads and dispatches join/leave actions.
>
> For real-time features, Socket.IO connects after login with JWT verification and broadcasts event updates to all connected clients.
>
> API calls are centralized in the services layer using Axios, which automatically attaches the Bearer token and handles 401 errors by refreshing the token."

---

### 6. Problems Encountered (60 sec)
> "The main challenges were:
>
> 1. **Token refresh race conditions** — When multiple requests failed with 401 simultaneously, each tried to refresh the token independently. I solved this with a refresh queue pattern that holds all pending requests until the token is renewed.
>
> 2. **Atomic event join operations** — Preventing race conditions when multiple users join the same event simultaneously. I used Prisma transactions to atomically check capacity and increment the counter.
>
> 3. **Socket.IO authentication** — Passing JWT through WebSocket handshake and verifying it on the server required custom gateway guards in NestJS.
>
> 4. **Calendar view performance** — The My Events calendar rendering many events caused re-renders. I optimized with useMemo and event memoization."

---

### 7. Conclusion (30 sec)
> "The application is fully deployed and running. It includes Docker Compose for easy local setup, a complete README with step-by-step instructions, and Swagger documentation at /api/docs.
>
> Thank you for reviewing my submission! I'm excited about the opportunity and look forward to the feedback."

---

*Replace [Your Name] with your actual name before recording.*
