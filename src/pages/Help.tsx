/**
 * @module Help Page
 * @description Help and documentation page
 */

import { motion } from 'framer-motion';
import { Book, Code, Server, Shield, Zap, HelpCircle, ExternalLink, Bot, Tags } from 'lucide-react';

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
    icon: Tags,
    title: 'Event Tags',
    content: [
      'Select existing tags from a searchable dropdown',
      'Create your own custom tags if they don\'t exist',
      'Tags help other users discover your events',
      'Maximum 5 tags per event',
    ],
  },
  {
    icon: Bot,
    title: 'AI Assistant & Agents',
    content: [
      'Use the AI chat to find events and get statistics',
      'Specialized agents handle search, management, and data insights',
      'The system uses a hierarchical fallback for response reliability',
      'View and manage active agents in the "Agents" tab',
    ],
  },
  {
    icon: Server,
    title: 'Architecture',
    content: [
      'Frontend: React 18 + TypeScript + Zustand + Tailwind CSS',
      'Backend: NestJS + Prisma + SQLite (Local) / PostgreSQL (Prod)',
      'Real-time data updates via Socket.IO',
      'AI Swarm architecture for intelligent request handling',
    ],
  },
  {
    icon: ExternalLink,
    title: 'API Documentation',
    content: [
      'GET /api/events — list events (pagination, filters)',
      'POST /api/events — create a new event',
      'POST /api/events/:id/join — join an event',
      'GET /api/events/tags — get all available tags',
      'POST /api/ai/query — query the AI Assistant',
      'GET /api/agents — list active AI agents',
      'POST /api/agents — create a custom agent',
      'GET /api/agents/skills — list available agent skills',
      'Swagger docs at https://application-backend-54iw.onrender.com/api/docs',
    ],
  },
  {
    icon: ExternalLink,
    title: 'Ready-Made AI Skills',
    content: [
      'Need more capabilities? Visit VibeBaza skill marketplace',
      'Browse ready-made skills at https://vibebaza.com',
      'Download JSON configs and register in Agent Builder',
      'Extend AI capabilities instantly with ready-made tools',
    ],
  },
  {
    icon: Bot,
    title: 'Creating AI Agents',
    content: [
      'Go to Agents tab and click Create Agent',
      'Set name, role, and system prompt for your agent',
      'Assign skills from the skill registry',
      'Agent joins the AI Swarm automatically',
    ],
  },
  {
    icon: Zap,
    title: 'Creating Skills',
    content: [
      'Skills are function definitions agents can call',
      'Define name, description, and JSON Schema parameters',
      'Skills enable agents to interact with external systems',
      'Register skills in Agent Builder to use them',
    ],
  },
  {
    icon: Book,
    title: 'Training Agents',
    content: [
      'Add domain knowledge to make agents smarter',
      'Click Add to Memory on agent detail page',
      'Enter facts, instructions, or domain expertise',
      'Uses RAG pattern for intelligent retrieval',
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
