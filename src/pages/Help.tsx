/**
 * @module Help Page
 * @description Help and documentation page
 */

import { motion } from 'framer-motion';
import { Book, Code, Server, Shield, Zap, HelpCircle, ExternalLink } from 'lucide-react';

const sections = [
  {
    icon: Zap,
    title: 'Getting Started',
    content: [
      'Sign up or log in to your account',
      'Browse the list of available events',
      'Join an event or create your own',
      'Manage your events in the "My Events" section',
    ],
  },
  {
    icon: Book,
    title: 'Event Management',
    content: [
      'Create: provide title, description, date, location and category',
      'Edit: only the organizer can edit an event',
      'Delete: only the organizer can delete an event',
      'Participate: join or leave any event freely',
    ],
  },
  {
    icon: Server,
    title: 'Architecture',
    content: [
      'Frontend: React 18 + TypeScript + Zustand + Tailwind CSS',
      'Backend: NestJS + PostgreSQL + JWT + Socket.IO',
      'Real-time data exchange via WebSocket',
      'Whitelist of allowed hosts for security',
    ],
  },
  {
    icon: Shield,
    title: 'Security',
    content: [
      'JWT authentication with access/refresh tokens',
      'Input validation on both client and server (Zod / class-validator)',
      'CORS with whitelisted domains',
      'Rate limiting for DDoS protection',
    ],
  },
  {
    icon: Code,
    title: 'API Documentation',
    content: [
      'POST /api/auth/register — registration',
      'POST /api/auth/login — authentication',
      'GET /api/events — list events (pagination, filters)',
      'POST /api/events — create an event',
      'GET /api/events/:id — event details',
      'PATCH /api/events/:id — update an event',
      'DELETE /api/events/:id — delete an event',
      'POST /api/events/:id/join — join an event',
      'POST /api/events/:id/leave — leave an event',
    ],
  },
  {
    icon: HelpCircle,
    title: 'FAQ',
    content: [
      'Q: How many events can I create? — Unlimited',
      'Q: How do I delete an event? — Only the organizer can, via the detail page',
      'Q: How does pagination work? — 15 records per page',
      'Q: Is data updated in real time? — Yes, via Socket.IO',
    ],
  },
];

const Help = () => {
  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Help & Documentation</h1>
        <p className="mt-1 text-sm text-muted-foreground">Everything you need to know about EventHub</p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        {sections.map(({ icon: Icon, title, content }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-2xl border border-border bg-card p-6 shadow-card"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            </div>
            <ul className="space-y-2">
              {content.map((item, j) => (
                <li key={j} className="text-sm text-muted-foreground leading-relaxed">
                  • {item}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8 rounded-2xl border border-border bg-muted/50 p-6 text-center"
      >
        <p className="text-sm text-muted-foreground">
          Swagger documentation is available at{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">
            /api/docs
          </code>
          {' '}when the backend is running
        </p>
        <a href="/api/docs" target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline">
          Open Swagger UI <ExternalLink className="h-3 w-3" />
        </a>
      </motion.div>
    </div>
  );
};

export default Help;
