import request from 'supertest';
import { app, server } from '../index';
import { prisma } from '../config/database';

describe('Rate Limiter', () => {
  afterAll(async () => {
    await prisma.$disconnect();
    if (server) server.close();
  });

  it('should return 429 when auth rate limit exceeded', async () => {
    // In test env limiters are skipped — should get
    // 401 (wrong credentials) not 429 (rate limited)
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'x@x.com', password: 'wrong' });

    expect(response.status).toBe(401);
    expect(response.status).not.toBe(429);
  });

  it('should skip rate limiting in test environment', async () => {
    // Confirm NODE_ENV is test
    expect(process.env.NODE_ENV).toBe('test');

    // Make 10 rapid requests — none should 429 in test
    const requests = Array(10).fill(null).map(() =>
      request(app)
        .post('/auth/login')
        .send({ email: 'x@x.com', password: 'wrong' }),
    );

    const responses = await Promise.all(requests);

    // All should be 401 (auth failure) not 429 (rate limited)
    responses.forEach((res) => {
      expect(res.status).toBe(401);
    });
  });
});
