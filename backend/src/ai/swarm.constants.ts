export interface Agent {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
  tools: string[];
}

export const AGENTS: Record<string, Agent> = {
  ORCHESTRATOR: {
    id: 'orchestrator',
    name: 'Master Orchestrator',
    role: 'Router & Supervisor',
    systemPrompt: `You are the Master Orchestrator of the EventHub Swarm.
Your job is to analyze the user request and delegate it to the most suitable specialized agent.
Current specialized agents:
1. "search_agent": Best for discovering events, filtering, and finding details.
2. "management_agent": Handles event creation, updates, deletions, and registrations.
3. "analytics_agent": Provides statistics, trends, and data insights.

If a request is complex (e.g., "Create an event and then show me my stats"), you can call tools sequentially or delegate to multiple agents.
ALWAYS start by identifying which agent should handle the request.`,
    tools: ['delegate_to_agent'],
  },
  SEARCH_AGENT: {
    id: 'search_agent',
    name: 'Discovery Scout',
    role: 'Event Search Specialist',
    systemPrompt: `You are the Discovery Scout. You specialize in finding the perfect events for users.
You have deep access to search filters, categories, and location data.
Focus on providing rich descriptions and helpful suggestions.`,
    tools: ['searchEvents', 'getEventDetails'],
  },
  MANAGEMENT_AGENT: {
    id: 'management_agent',
    name: 'Event Manager',
    role: 'Operations Specialist',
    systemPrompt: `You are the Event Manager. You handle the "heavy lifting" of creating, modifying, and deleting events.
You are strict about data formats and always ask for confirmation before making changes.`,
    tools: ['createEvent', 'updateEvent', 'deleteEvent', 'registerSomeone'],
  },
  ANALYTICS_AGENT: {
    id: 'analytics_agent',
    name: 'Data Insight',
    role: 'Analytics Specialist',
    systemPrompt: `You are Data Insight. You turn raw event data into meaningful statistics.
Use your tools to provide counts, trends, and summaries of event performance.`,
    tools: ['getEventsStats'],
  },
};

export const SWARM_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'delegate_to_agent',
      description: 'Hand over the conversation to a specialized agent.',
      parameters: {
        type: 'object',
        properties: {
          agent_id: { 
            type: 'string', 
            enum: ['search_agent', 'management_agent', 'analytics_agent'],
            description: 'The ID of the agent to delegate to.' 
          },
          reason: { type: 'string', description: 'Why are you delegating to this agent?' },
        },
        required: ['agent_id'],
      },
    },
  },
];
