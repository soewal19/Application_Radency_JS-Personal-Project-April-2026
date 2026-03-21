/**
 * @module E2E тесты — Events
 * @description Комплексное тестирование жизненного цикла событий (CRUD)
 * Используются лучшие практики: изоляция данных, тестирование прав доступа и валидации.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

jest.setTimeout(60000);

describe('Events Lifecycle (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let otherUserToken: string;
  let testEventId: string;

  const createAuthUser = async (email: string) => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email,
        password: 'Password123!',
      });
    return res.body.accessToken;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ 
      whitelist: true, 
      transform: true,
      forbidNonWhitelisted: true 
    }));
    await app.init();

    // Создаем двух пользователей для тестов прав доступа
    adminToken = await createAuthUser(`admin-${Date.now()}@test.com`);
    otherUserToken = await createAuthUser(`other-${Date.now()}@test.com`);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/events (Creation)', () => {
    it('должен успешно создать событие с валидными данными', async () => {
      const payload = {
        title: 'E2E Best Practices Workshop',
        description: 'Learning how to write better E2E tests for NestJS applications.',
        date: new Date(Date.now() + 86400000).toISOString(), // завтра
        location: 'Remote',
        category: 'workshop',
        maxParticipants: 100,
        tags: ['Testing', 'NestJS', 'E2E']
      };

      const res = await request(app.getHttpServer())
        .post('/api/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload)
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe(payload.title);
      expect(res.body.tags).toContain('Testing');
      testEventId = res.body.id;
    });

    it('должен вернуть 400 при отсутствии обязательных полей', async () => {
      await request(app.getHttpServer())
        .post('/api/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Missing Fields' })
        .expect(400);
    });

    it('должен вернуть 400 при неверном формате даты', async () => {
      await request(app.getHttpServer())
        .post('/api/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Invalid Date Event',
          description: 'This event has an invalid date format.',
          date: 'not-a-date',
          location: 'Earth',
          category: 'meetup',
          maxParticipants: 10
        })
        .expect(400);
    });

    it('должен вернуть 401 при отсутствии токена', async () => {
      await request(app.getHttpServer())
        .post('/api/events')
        .send({ title: 'Unauthorized' })
        .expect(401);
    });
  });

  describe('GET /api/events (Reading)', () => {
    it('должен вернуть список событий с пагинацией', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/events?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.limit).toBe(5);
    });

    it('должен найти событие по ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/events/${testEventId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.id).toBe(testEventId);
    });

    it('должен вернуть 404 для несуществующего события', async () => {
      await request(app.getHttpServer())
        .get('/api/events/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PATCH /api/events/:id (Updating)', () => {
    it('организатор должен иметь возможность обновить свое событие', async () => {
      const newTitle = 'Updated E2E Workshop Title';
      const res = await request(app.getHttpServer())
        .patch(`/api/events/${testEventId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: newTitle })
        .expect(200);

      expect(res.body.title).toBe(newTitle);
    });

    it('НЕорганизатор НЕ должен иметь возможность обновить чужое событие', async () => {
      await request(app.getHttpServer())
        .patch(`/api/events/${testEventId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ title: 'Hacked Title' })
        .expect(403);
    });
  });

  describe('POST /api/events/:id/join (Participation)', () => {
    it('другой пользователь должен иметь возможность присоединиться', async () => {
      await request(app.getHttpServer())
        .post(`/api/events/${testEventId}/join`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(201);
      
      const res = await request(app.getHttpServer())
        .get(`/api/events/${testEventId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.body.currentParticipants).toBe(1);
    });

    it('нельзя присоединиться дважды', async () => {
      await request(app.getHttpServer())
        .post(`/api/events/${testEventId}/join`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(400);
    });
  });

  describe('DELETE /api/events/:id (Deletion)', () => {
    it('НЕорганизатор НЕ может удалить чужое событие', async () => {
      await request(app.getHttpServer())
        .delete(`/api/events/${testEventId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);
    });

    it('организатор может успешно удалить свое событие', async () => {
      await request(app.getHttpServer())
        .delete(`/api/events/${testEventId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Проверяем, что событие действительно удалено
      await request(app.getHttpServer())
        .get(`/api/events/${testEventId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
