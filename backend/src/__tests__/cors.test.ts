import request from 'supertest';
import { app, server } from '../index';
import { prisma } from '../config/database';

describe('CORS', () => {
  afterAll(async () => {
    await prisma.$disconnect();
    if (server) server.close();
  });

  it('should allow requests from localhost in development', async () => {
    const response = await request(app)
      .get('/health')
      .set('Origin', 'http://localhost:3000');

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  it('should allow requests with no origin (SDK/curl)', async () => {
    // No Origin header = server-to-server (SDK logging)
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
  });

  it('should include x-api-key in allowed headers', async () => {
    const response = await request(app)
      .options('/api/v1/log')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'x-api-key');

    expect(response.headers['access-control-allow-headers']).toContain('x-api-key');
  });

  it('should not crash when FRONTEND_URL is not set', async () => {
    // Core bug we fixed — removing FRONTEND_URL must never throw or return wildcard
    const originalUrl = process.env.FRONTEND_URL;
    delete process.env.FRONTEND_URL;

    const response = await request(app)
      .get('/health')
      .set('Origin', 'http://localhost:3000');

    // Should still work — localhost is always allowed in test env
    expect(response.status).toBe(200);

    // Restore
    if (originalUrl !== undefined) {
      process.env.FRONTEND_URL = originalUrl;
    }
  });
});
