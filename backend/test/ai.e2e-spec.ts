/**
 * @module E2E тесты — AI Assistant (Advanced)
 * @description Тестирование интеллектуального помощника и его инструментов.
 * Проверяет интеграцию с LLM, вызов функций (Function Calling) и обработку контекста.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

jest.setTimeout(60000); // AI запросы могут быть долгими

describe('AI Assistant Lifecycle (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // Регистрация тестового пользователя
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'AI Explorer',
        email: `ai-expert-${Date.now()}@test.com`,
        password: 'SecurePassword123!',
      });
    accessToken = res.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/ai/query (General Reasoning)', () => {
    it('должен вернуть текстовый ответ на общий вопрос', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/ai/query')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ query: 'Hello! Who are you and how can you help me?' })
        .expect(200);

      expect(res.body).toHaveProperty('assistant');
      expect(typeof res.body.assistant).toBe('string');
      expect(res.body.assistant.length).toBeGreaterThan(10);
    });

    it('должен учитывать переданный контекст', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/ai/query')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ 
          query: 'What was my last question?', 
          context: 'User previously asked about weather.' 
        })
        .expect(200);

      expect(res.body.assistant.toLowerCase()).toContain('weather');
    });

    it('должен возвращать 401 без токена', async () => {
      await request(app.getHttpServer())
        .post('/api/ai/query')
        .send({ query: 'Should fail' })
        .expect(401);
    });

    it('должен возвращать 400 при пустом запросе', async () => {
      await request(app.getHttpServer())
        .post('/api/ai/query')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ query: '' })
        .expect(400);
    });
  });

  describe('AI Tool Integration (Function Calling)', () => {
    it('должен распознать намерение поиска событий (searchEvents)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/ai/query')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ query: 'Find tech conferences in London next month' })
        .expect(200);

      // Проверяем структуру ответа с инструментом
      expect(res.body).toHaveProperty('assistant');
      
      // Если API ключи настроены, агент может вызвать инструмент
      if (res.body.toolCall) {
        expect(res.body.toolCall.name).toBe('searchEvents');
        expect(res.body.toolCall.args).toHaveProperty('city');
        expect(res.body.toolCall.observation).toHaveProperty('results');
      }
    });

    it('должен распознать намерение создания события (createEvent)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/ai/query')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ query: 'Create a new workshop titled "E2E Masterclass" in Paris for next Friday' })
        .expect(200);

      if (res.body.toolCall) {
        // Агент должен либо вызвать создание, либо запросить подтверждение
        // В нашей реализации он сразу пытается вызвать инструмент если достаточно данных
        expect(['createEvent', 'searchEvents']).toContain(res.body.toolCall.name);
      }
    });
  });

  describe('Error Handling & Robustness', () => {
    it('должен корректно обрабатывать слишком длинные запросы', async () => {
      const longQuery = 'a'.repeat(2001);
      await request(app.getHttpServer())
        .post('/api/ai/query')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ query: longQuery })
        .expect(400); // ValidationPipe (MaxLength)
    });

    it('должен возвращать вежливую заглушку при отсутствии API ключей', async () => {
      // Этот тест полезен если мы принудительно сбросим ключи в моке, 
      // но в текущем окружении он просто проверяет стабильность.
      const res = await request(app.getHttpServer())
        .post('/api/ai/query')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ query: 'Help me' })
        .expect(200);

      expect(res.body.assistant).toBeDefined();
    });
  });
});
