import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import { AiQueryDto } from './dto/ai-query.dto';
import { AI_TOOL_DEFINITIONS } from './ai.constants';
import { AGENTS, SWARM_TOOLS } from './swarm.constants';
import { EventsService } from '../events/events.service';
import { PrismaService } from '../prisma/prisma.service';

const SYSTEM_PROMPT = `You are a professional Event Assistant AI. Your goal is to help users discover events, answer questions about events, and manage their events (create, update, delete). 
You have access to the event database via tools (functions). 
Rules:
1. Do not hallucinate or invent event data; always use the tool results.
2. ALWAYS ask for user confirmation before performing any mutation (create, update, delete).
3. If a tool returns an error, inform the user clearly.
4. When creating or updating events, ensure the date format is valid ISO 8601.
5. You CAN provide statistics and analytics using the "getEventsStats" tool.`;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly groqClient?: OpenAI;
  private readonly openAiClient?: OpenAI;

  // MLOps: Hierarchical Fallback Strategy
  // Tier 1: Best balance of performance/speed (Primary)
  // Tier 2: Reliable fallback for high-reasoning tasks
  // Tier 3: Extremely fast, high limits (Daily survival)
  // Tier 4: Small, efficient preview models
  private readonly groqModelsPool = [
    'llama-3.3-70b-versatile', // Tier 1
    'llama-3.1-70b-versatile', // Tier 2
    'llama-3.1-8b-instant',    // Tier 3
    'llama-3.2-3b-preview',    // Tier 4
  ];

  constructor(
    private config: ConfigService, 
    private eventsService: EventsService,
    private prisma: PrismaService,
  ) {
    const groqKey = this.config.get<string>('GROQ_API_KEY');
    const openAiKey = this.config.get<string>('OPENAI_API_KEY');

    if (groqKey && groqKey !== 'your_groq_api_key_here') {
      this.logger.log('Groq Swarm initialized');
      this.groqClient = new OpenAI({
        apiKey: groqKey,
        baseURL: 'https://api.groq.com/openai/v1',
      });
    } else {
      this.logger.warn('Groq API Key missing or invalid. AI features may be limited.');
    }

    if (openAiKey && openAiKey !== 'your_openai_api_key_here') {
      this.logger.log('OpenAI Fallback initialized');
      this.openAiClient = new OpenAI({ apiKey: openAiKey });
    } else {
      this.logger.warn('OpenAI API Key missing or invalid. AI features may be limited.');
    }
  }

  /**
   * MLOps: Resilient Completion with Model Rotation & Exponential Backoff
   */
  private async callChatCompletion(messages: any[], tools?: any[]) {
    // 1. Try Groq Pool first
    if (this.groqClient) {
      for (const model of this.groqModelsPool) {
        try {
          this.logger.debug(`Attempting completion with Groq model: ${model}`);
          const response = await this.groqClient.chat.completions.create({
            model,
            messages,
            tools: tools as any,
            tool_choice: tools ? 'auto' : undefined,
            max_tokens: model.includes('70b') || model.includes('mistral-large') || model.includes('deepseek-r1') ? 1024 : 800,
            temperature: 0.3,
          });
          
          return {
            response,
            metadata: {
              model,
              provider: 'Groq',
              latency: 'Ultra-Low',
              limits: model.includes('70b') ? '100k TPD' : 'Higher'
            }
          };
        } catch (err: any) {
          if (err.status === 429 || err.status === 400) {
            this.logger.warn(`Error (${err.status}) for ${model}. Rotating to next in pool...`);
            continue; // Move to next model in pool
          }
          if (err.status === 401) {
            this.logger.error(`Invalid Groq API Key. Falling back...`);
            break; // Stop trying Groq
          }
          this.logger.error(`Groq Error with ${model}: ${err.message}`);
          throw err;
        }
      }
    }

    // 2. Final Fallback to OpenAI (gpt-4o-mini)
    if (this.openAiClient) {
      try {
        const model = 'gpt-4o-mini';
        this.logger.log(`Swarm Fallback: Using OpenAI (${model})`);
        const response = await this.openAiClient.chat.completions.create({
          model,
          messages,
          tools: tools as any,
          tool_choice: tools ? 'auto' : undefined,
          max_tokens: 800,
          temperature: 0.3,
        });

        return {
          response,
          metadata: {
            model,
            provider: 'OpenAI',
            latency: 'High (Fallback)',
            limits: 'Standard'
          }
        };
      } catch (err: any) {
        this.logger.error(`OpenAI Error: ${err.message}`);
        if (err.status === 401) {
          this.logger.error(`Invalid OpenAI API Key.`);
        }
      }
    }

    // 3. Mock Mode for development/demo when keys are missing or invalid
    this.logger.warn('All AI providers failed. Using Mock Mode.');
    return this.callMockCompletion(messages, tools);
  }

  /**
   * Mock completion to keep the app usable for demo purposes
   */
  private callMockCompletion(messages: any[], tools?: any[]) {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';
    const query = lastUserMsg.toLowerCase();

    let mockResponse: any = {
      choices: [{
        message: {
          role: 'assistant',
          content: 'I am currently in Demo Mode. To enable full AI features, please provide a valid GROQ_API_KEY in the .env file.'
        }
      }]
    };

    // Simple rule-based logic for demo
    if (query.includes('find') || query.includes('search') || query.includes('kyiv')) {
      mockResponse.choices[0].message.tool_calls = [{
        id: 'call_mock_search',
        type: 'function', 
        function: {
          name: 'searchEvents',
          arguments: JSON.stringify({ city: query.includes('kyiv') ? 'Kyiv' : 'New York' })
        }
      }];
    } else if (query.includes('stats') || query.includes('statistics')) {
      mockResponse.choices[0].message.tool_calls = [{
        id: 'call_mock_stats',
        type: 'function',
        function: {
          name: 'getEventsStats',
          arguments: JSON.stringify({})
        }
      }];
    } else if (query.includes('create') || query.includes('coffee') || query.includes('meetup')) {
      mockResponse.choices[0].message.tool_calls = [{
        id: 'call_mock_create',
        type: 'function',
        function: {
          name: 'createEvent',
          arguments: JSON.stringify({
            title: 'Coffee Meetup',
            description: 'A casual coffee meetup for friends and acquaintances.',
            date: '2026-03-27T10:00:00',
            location: 'Local Coffee Shop',
            category: 'social',
            maxParticipants: 20,
            tags: ['coffee', 'social']
          })
        }
      }];
    }

    return {
      response: mockResponse,
      metadata: {
        model: 'Mock-Demo-Model',
        provider: 'Trae-Mock',
        latency: 'Zero',
        limits: 'Unlimited'
      }
    };
  }

  private async getActiveAgents(): Promise<Record<string, any>> {
    try {
      const dbAgents = await this.prisma.agent.findMany({
        include: { 
          skills: true,
          // knowledge: true, // removed – not defined in Prisma AgentInclude
        },
      });

      if (dbAgents.length === 0) return AGENTS;

      const mapped: Record<string, any> = { ...AGENTS };
      dbAgents.forEach((agent: any) => {
        const id = agent.name.toUpperCase().replace(/\s+/g, '_');
        mapped[id] = {
          id: agent.id,
          name: agent.name,
          role: agent.role,
          systemPrompt: agent.systemPrompt,
          tools: agent.skills.map((s: any) => s.name),
          knowledge: agent.knowledge.map((k: any) => k.content).join('\n---\n'),
        };
      });
      return mapped;
    } catch {
      return AGENTS;
    }
  }

  async query(userId: string, dto: AiQueryDto) {
    try {
      const { query: userQuery, context: userContext, eventId } = dto as any;
      let context = userContext ? `Context: ${userContext}\n` : '';

      if (eventId) {
        try {
          const event = await this.eventsService.findOne(eventId);
          context += `\nEVENT CONTEXT: ${event.title} at ${event.location}. Desc: ${event.description.slice(0, 150)}. Spots: ${event.currentParticipants}/${event.maxParticipants}.`;
        } catch (err) {
          this.logger.warn(`Failed to fetch event context: ${eventId}`);
        }
      }

      const availableAgents = await this.getActiveAgents();
      let activeAgent = availableAgents.ORCHESTRATOR || Object.values(availableAgents)[0];
      let lastMetadata: any = null;

      // Initial Orchestration Phase
      this.logger.log(`Swarm Orchestrator analyzing request: "${userQuery.slice(0, 50)}..."`);

      const orchestratorPrompt = `You are the Master Orchestrator. Current specialized agents:
${Object.values(availableAgents).map((a: any) => `- "${a.id || a.name}": ${a.role || a.name}`).join('\n')}

Analyze the user request and delegate it to the most suitable agent.`;
      
      let orchestrationResult;
      try {
        orchestrationResult = await this.callChatCompletion(
          [
            { role: 'system', content: orchestratorPrompt },
            { role: 'user', content: `${context}${userQuery}` },
          ],
          SWARM_TOOLS
        );
        lastMetadata = orchestrationResult.metadata;
      } catch (err: any) {
        this.logger.warn(`Orchestration failed: ${err.message}. Using default.`);
      }

      const orchMsg = orchestrationResult?.response?.choices?.[0]?.message;
      if (orchMsg?.tool_calls?.length) {
        const firstCall = orchMsg.tool_calls[0];
        if (firstCall.function?.name === 'delegate_to_agent') {
          try {
            const args = JSON.parse(firstCall.function.arguments);
            const nextAgentId = args.agent_id?.toUpperCase();
            if (nextAgentId && (availableAgents as any)[nextAgentId]) {
              activeAgent = (availableAgents as any)[nextAgentId];
              this.logger.log(`Swarm Handover -> ${activeAgent.name}`);
            }
          } catch (err) {
            this.logger.warn('Delegation parse error');
          }
        }
      }

      // Execution Phase with Active Agent
      let finalPrompt = `${activeAgent.systemPrompt}\nRULES: ${SYSTEM_PROMPT}`;
      if (activeAgent.knowledge) {
        finalPrompt += `\n\nADDITIONAL KNOWLEDGE BASE:\n${activeAgent.knowledge}`;
      }
      
      const executionResult = await this.callChatCompletion(
        [
          { role: 'system', content: finalPrompt },
          { role: 'user', content: `${context}${userQuery}` },
        ],
        AI_TOOL_DEFINITIONS
      );
      lastMetadata = executionResult.metadata;

      const message = executionResult.response.choices?.[0]?.message;
      if (!message) throw new Error('No AI message');

      // If the model decides to call a tool, execute it and return the result
      if (message.tool_calls?.length) {
        const results = [];
        const toolCalls = message.tool_calls;

        for (const call of toolCalls) {
          const toolName = call.function?.name;
          const rawArgs = call.function?.arguments;
          let args: Record<string, unknown> = {};
          try {
            args = rawArgs ? JSON.parse(rawArgs) : {};
          } catch (err) {
            this.logger.warn(`Args parse error for ${toolName}`);
          }

          let observation: unknown;
          this.logger.log(`Swarm Agent (${activeAgent.name}) -> ${toolName}`);

          switch (toolName) {
            case 'searchEvents': observation = await this.handleSearchEvents(args); break;
            case 'getEventDetails': observation = await this.handleGetEventDetails(args); break;
            case 'createEvent': observation = await this.handleCreateEvent(userId, args); break;
            case 'updateEvent': observation = await this.handleUpdateEvent(userId, args); break;
            case 'deleteEvent': observation = await this.handleDeleteEvent(userId, args); break;
            case 'getEventsStats': observation = await this.handleGetEventsStats(userId, args); break;
            default: observation = { error: `Unknown tool: ${toolName}` };
          }

          results.push({
            role: 'tool',
            tool_call_id: call.id,
            content: typeof observation === 'string' ? observation : JSON.stringify(observation),
          });
        }

        // Send all observations back to the model
        let followupResult;
        try {
          followupResult = await this.callChatCompletion([
            { role: 'system', content: finalPrompt },
            { role: 'user', content: `${context}${userQuery}` },
            {
              role: 'assistant',
              content: message.content || null,
              tool_calls: message.tool_calls,
            } as any,
            ...results as any[],
          ]);
          lastMetadata = followupResult.metadata;
        } catch (err: any) {
          this.logger.error(`Followup failed: ${err.message}`);
          return {
            assistant: `Action performed, but summary failed: ${err.message}`,
            toolCall: { 
              name: toolCalls[0].function?.name, 
              args: JSON.parse(toolCalls[0].function?.arguments || '{}'), 
              observation: JSON.parse(results[0].content),
              agent: activeAgent.name 
            },
            metadata: lastMetadata
          };
        }

        const firstCall = toolCalls[0];
        return {
          assistant: followupResult.response.choices?.[0]?.message?.content || 'Done.',
          toolCall: { 
            name: firstCall.function?.name, 
            args: JSON.parse(firstCall.function?.arguments || '{}'), 
            observation: JSON.parse(results[0].content),
            agent: activeAgent.name 
          },
          metadata: lastMetadata
        };
      }

      return { 
        assistant: message.content ?? null, 
        toolCall: null,
        agent: activeAgent.name,
        metadata: lastMetadata
      };
    } catch (error: any) {
      this.logger.error(`AI Query Error: ${error.message}`, error.stack);
      
      let friendlyMessage = 'I apologize, but all AI providers are currently exhausted or unavailable.';
      if (error.status === 429) {
        friendlyMessage = 'I have tried all available models, but the daily limits for the free tier have been reached. Please try again in about 20 minutes.';
      }

      return {
        assistant: `${friendlyMessage} (${error.message || 'Unknown error'})`,
        toolCall: null,
        error: error.message,
      };
    }
  }

  private async handleSearchEvents(args: Record<string, unknown>) {
    const city = String(args.city || '').trim();
    const dateFrom = args.date_from ? new Date(String(args.date_from)) : undefined;
    const dateTo = args.date_to ? new Date(String(args.date_to)) : undefined;
    const category = args.category ? String(args.category) : undefined;
    const limit = Math.min(Math.max(Number(args.limit) || 5, 1), 25);

    const events = await this.eventsService.searchEvents({
      city,
      dateFrom,
      dateTo,
      category,
      limit,
    });

    const result = (events || []).slice(0, limit).map((event) => ({
      id: event.id,
      title: event.title,
      date: event.date.toISOString(),
      location: event.location,
      category: event.category,
      currentParticipants: event.currentParticipants,
      maxParticipants: event.maxParticipants,
    }));

    return { results: result, count: result.length };
  }

  private async handleGetEventDetails(args: Record<string, unknown>) {
    const eventId = String(args.event_id || '').trim();
    if (!eventId) return { error: 'event_id is required' };

    try {
      const event = await this.eventsService.findOne(eventId);
      return {
        id: event.id,
        title: event.title,
        description: event.description,
        date: event.date.toISOString(),
        location: event.location,
        category: event.category,
        maxParticipants: event.maxParticipants,
        currentParticipants: event.currentParticipants,
        organizerName: event.organizerName,
      };
    } catch (e) {
      return { error: 'Event not found' };
    }
  }

  private async handleCreateEvent(userId: string, args: Record<string, unknown>) {
    try {
      const eventData = {
        ...args,
        creatorType: 'ai', // Requirement 4: Mark as created by AI
      };
      const event = await this.eventsService.create(eventData as any, userId);
      return { success: true, event_id: event.id, title: event.title };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Failed to create' };
    }
  }

  private async handleUpdateEvent(userId: string, args: Record<string, unknown>) {
    const { event_id, ...updateData } = args;
    if (!event_id) return { success: false, error: 'event_id is required' };

    try {
      const event = await this.eventsService.update(String(event_id), updateData as any, userId);
      return { success: true, event_id: event.id, title: event.title };
    } catch (error) {
      return { success: false, error: 'Update failed' };
    }
  }

  private async handleDeleteEvent(userId: string, args: Record<string, unknown>) {
    const eventId = String(args.event_id || '').trim();
    if (!eventId) return { success: false, error: 'event_id is required' };

    try {
      await this.eventsService.remove(eventId, userId);
      return { success: true, message: 'Deleted' };
    } catch (error) {
      return { success: false, error: 'Delete failed' };
    }
  }

  private async handleGetEventsStats(userId: string, args: Record<string, unknown>) {
    const scope = String(args.scope || 'all');
    const statsUserId = scope === 'my' ? userId : undefined;

    try {
      const stats = await this.eventsService.getEventsStats(statsUserId);
      return stats;
    } catch (e) {
      return { error: 'Failed to fetch statistics' };
    }
  }
}
