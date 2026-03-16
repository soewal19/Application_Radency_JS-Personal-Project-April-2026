# Frontend Agent Guide

## Architecture

The frontend is built with React 18 + TypeScript + Vite using:
- **Zustand** for state management
- **React Router v6** with lazy loading via `React.lazy()` + `Suspense`
- **Tailwind CSS** with a design system using CSS variables
- **Socket.IO Client** for real-time updates
- **Zod** for form validation
- **Framer Motion** for animations

## Coding Rules

### 1. Components
- One component per file
- Use functional components with hooks
- Add JSDoc comments to modules
- Type all props via interfaces

### 2. Styling
- **NEVER** use inline colors (`text-white`, `bg-black`)
- Always use semantic tokens from the design system
- Colors are defined in `src/index.css` via CSS variables
- Tailwind classes via `tailwind.config.ts`

```tsx
// ❌ Bad
<div className="text-white bg-purple-500">

// ✅ Good
<div className="text-primary-foreground bg-primary">
```

### 3. State Management
- `useAuthStore` — authentication
- `useEventStore` — events and pagination
- Do not create local state for server data

### 4. API Interaction
- All requests via `src/services/api.ts`
- Whitelist checked in `src/config/whitelist.ts`
- Socket connection via `src/services/socket.ts`

### 5. Pagination
- Page size: **15 records**
- On load, the first 15 records are fetched from the store

### 6. Routing
- All pages are lazy-loaded via `React.lazy()`
- Wrapped in `Suspense` with a spinner fallback
- Layout with navigation via `<Outlet />`

### 7. Validation
- Forms are validated using Zod schemas
- Errors are displayed below fields
- Max length attributes added to inputs

### 8. Testing
```bash
npm run test           # Vitest
```
- Tests alongside components: `Component.test.tsx`
- Use `@testing-library/react`
