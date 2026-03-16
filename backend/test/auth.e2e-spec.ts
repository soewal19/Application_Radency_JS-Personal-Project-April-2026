/**
 * @module E2E тесты — Auth
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const testUser = {
    name: 'Test User',
    email: `test-${Date.now()}@example.com`,
    password: 'password123',
  };

  let accessToken: string;

  it('/api/auth/register (POST) — должен зарегистрировать пользователя', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe(testUser.email);
  });

  it('/api/auth/register (POST) — дублирующий email', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(testUser)
      .expect(409);
  });

  it('/api/auth/login (POST) — успешный вход', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(201);

    expect(res.body).toHaveProperty('accessToken');
    accessToken = res.body.accessToken;
  });

  it('/api/auth/login (POST) — неверный пароль', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'wrong' })
      .expect(401);
  });
});
