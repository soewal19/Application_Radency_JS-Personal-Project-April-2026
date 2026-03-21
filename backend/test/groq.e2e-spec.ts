import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiService } from '../src/ai/ai.service';
import { EventsModule } from '../src/events/events.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { AiQueryDto } from '../src/ai/dto/ai-query.dto';

describe('Groq Connection (e2e)', () => {
  let app: INestApplication;
  let aiService: AiService;
  let configService: ConfigService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PrismaModule,
        EventsModule,
      ],
      providers: [AiService],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    aiService = moduleFixture.get<AiService>(AiService);
    configService = moduleFixture.get<ConfigService>(ConfigService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should verify Groq API connection and return a response', async () => {
    const groqKey = configService.get<string>('GROQ_API_KEY');
    
    if (!groqKey) {
      console.warn('GROQ_API_KEY not found in .env, skipping live connection test');
      return;
    }

    const queryDto: AiQueryDto = {
      query: 'Say "Connection successful" if you can hear me.',
    };

    // We use a dummy userId for testing
    const result = await aiService.query('test-user-id', queryDto);

    expect(result).toHaveProperty('assistant');
    expect(result.assistant?.toLowerCase()).toContain('successful');
    console.log('Groq Response:', result.assistant);
  }, 30000); // Increase timeout for live API call

  it('should have correct Groq base URL configured in service', () => {
    const groqKey = configService.get<string>('GROQ_API_KEY');
    if (!groqKey) return;

    // Accessing private property for test verification
    const client = (aiService as any).client;
    expect(client.baseURL).toBe('https://api.groq.com/openai/v1');
  });

  it('should execute a tool calling loop (ReAct) with Groq for searching events', async () => {
    const groqKey = configService.get<string>('GROQ_API_KEY');
    if (!groqKey) return;

    const queryDto: AiQueryDto = {
      query: 'What events are in London? (Only use the tool)',
    };

    // This will trigger searchEvents tool
    const result = await aiService.query('test-user-id', queryDto);

    expect(result).toHaveProperty('assistant');
    expect(result).toHaveProperty('toolCall');
    
    if (result.toolCall) {
      expect(result.toolCall.name).toBe('searchEvents');
      expect(result.toolCall.args).toHaveProperty('city');
      // The assistant should now summarize the results (even if empty)
      expect(typeof result.assistant).toBe('string');
      console.log('Tool Observation:', JSON.stringify(result.toolCall.observation));
    }
  }, 30000);
});
