import request from 'supertest';

import { app, server } from '../index';
import { prisma } from '../config/database';

describe('POST /auth/signup', () => {
  const baseEmail = 'user@example.com';

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    if (server) {
      server.close();
    }
  });

  it('should create new user with valid data', async () => {
    const response = await request(app).post('/auth/signup').send({
      email: baseEmail,
      password: 'password123',
    });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe(baseEmail);
  });

  it('should return API key on signup', async () => {
    const response = await request(app).post('/auth/signup').send({
      email: 'api-key@example.com',
      password: 'password123',
    });

    expect(response.status).toBe(201);
    expect(response.body.apiKey).toMatch(/^ast_/);
  });

  it('should reject duplicate email', async () => {
    await request(app).post('/auth/signup').send({
      email: baseEmail,
      password: 'password123',
    });

    const response = await request(app).post('/auth/signup').send({
      email: baseEmail,
      password: 'password123',
    });

    expect(response.status).toBe(409);
  });

  it('should reject invalid email', async () => {
    const response = await request(app).post('/auth/signup').send({
      email: 'not-an-email',
      password: 'password123',
    });

    expect(response.status).toBe(400);
  });

  it('should reject weak password (< 8 chars)', async () => {
    const response = await request(app).post('/auth/signup').send({
      email: 'shortpass@example.com',
      password: 'short',
    });

    expect(response.status).toBe(400);
  });

  it('should hash password (not store plain text)', async () => {
    await request(app).post('/auth/signup').send({
      email: baseEmail,
      password: 'password123',
    });

    const user = await prisma.user.findUnique({ where: { email: baseEmail } });
    expect(user).toBeTruthy();
    expect(user!.password).not.toBe('password123');
  });
});

describe('POST /auth/login', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  it('should login with valid credentials', async () => {
    await request(app).post('/auth/signup').send({
      email: 'login@example.com',
      password: 'password123',
    });

    const response = await request(app).post('/auth/login').send({
      email: 'login@example.com',
      password: 'password123',
    });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Login successful');
  });

  it('should return JWT token', async () => {
    await request(app).post('/auth/signup').send({
      email: 'token@example.com',
      password: 'password123',
    });

    const response = await request(app).post('/auth/login').send({
      email: 'token@example.com',
      password: 'password123',
    });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeTruthy();
  });

  it('should reject invalid email', async () => {
    const response = await request(app).post('/auth/login').send({
      email: 'bad-email',
      password: 'password123',
    });

    expect(response.status).toBe(400);
  });

  it('should reject wrong password', async () => {
    await request(app).post('/auth/signup').send({
      email: 'wrongpass@example.com',
      password: 'password123',
    });

    const response = await request(app).post('/auth/login').send({
      email: 'wrongpass@example.com',
      password: 'wrongpass',
    });

    expect(response.status).toBe(401);
  });

  it('should reject non-existent user', async () => {
    const response = await request(app).post('/auth/login').send({
      email: 'missing@example.com',
      password: 'password123',
    });

    expect(response.status).toBe(401);
  });
});

describe('GET /auth/profile', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  it('should return user profile with valid JWT', async () => {
    await request(app).post('/auth/signup').send({
      email: 'profile@example.com',
      password: 'password123',
    });

    const loginResponse = await request(app).post('/auth/login').send({
      email: 'profile@example.com',
      password: 'password123',
    });

    const response = await request(app)
      .get('/auth/profile')
      .set('Authorization', `Bearer ${loginResponse.body.token}`);

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('profile@example.com');
  });

  it('should reject request without token', async () => {
    const response = await request(app).get('/auth/profile');
    expect(response.status).toBe(401);
  });

  it('should reject request with invalid token', async () => {
    const response = await request(app)
      .get('/auth/profile')
      .set('Authorization', 'Bearer invalid');

    expect(response.status).toBe(401);
  });
});

describe('GET /auth/verify', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  it('should verify valid JWT token', async () => {
    await request(app).post('/auth/signup').send({
      email: 'verify@example.com',
      password: 'password123',
    });

    const loginResponse = await request(app).post('/auth/login').send({
      email: 'verify@example.com',
      password: 'password123',
    });

    const response = await request(app)
      .get('/auth/verify')
      .set('Authorization', `Bearer ${loginResponse.body.token}`);

    expect(response.status).toBe(200);
    expect(response.body.valid).toBe(true);
  });

  it('should reject invalid token', async () => {
    const response = await request(app)
      .get('/auth/verify')
      .set('Authorization', 'Bearer invalid');

    expect(response.status).toBe(401);
  });
});

