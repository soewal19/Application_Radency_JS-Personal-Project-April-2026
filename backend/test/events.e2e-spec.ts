/**
 * @module E2E тесты — Events
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Events (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let eventId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // Регистрация и получение токена
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        name: 'Event Tester',
        email: `events-${Date.now()}@example.com`,
        password: 'password123',
      });
    accessToken = res.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/events (POST) — создать событие', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/events')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Test Event',
        description: 'Тестовое событие для E2E тестов',
        date: '2026-06-15T10:00:00.000Z',
        location: 'Москва',
        category: 'meetup',
        maxParticipants: 50,
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe('Test Event');
    eventId = res.body.id;
  });

  it('/api/events (GET) — список с пагинацией', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/events?page=1&limit=15')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('totalPages');
    expect(res.body.limit).toBe(15);
  });

  it('/api/events/:id (GET) — получить событие', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.id).toBe(eventId);
  });

  it('/api/events/:id/join (POST) — присоединиться', async () => {
    await request(app.getHttpServer())
      .post(`/api/events/${eventId}/join`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);
  });

  it('/api/events/:id/leave (POST) — покинуть', async () => {
    await request(app.getHttpServer())
      .post(`/api/events/${eventId}/leave`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);
  });

  it('/api/events/:id (PATCH) — обновить событие', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Updated Event' })
      .expect(200);

    expect(res.body.title).toBe('Updated Event');
  });

  it('/api/events/:id (DELETE) — удалить событие', async () => {
    await request(app.getHttpServer())
      .delete(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });

  it('/api/events (GET) — без авторизации', async () => {
    await request(app.getHttpServer())
      .get('/api/events')
      .expect(401);
  });
});
