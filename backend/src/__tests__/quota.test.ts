import request from 'supertest';

import { app, server } from '../index';
import { prisma } from '../config/database';
import { generateApiKey, generateJWT, hashPassword } from '../utils/auth';

// Cached module reference — spyOn replaces properties on this object at call-time,
// and the middleware's `import * as quotaService` sees the same object.
const quotaServiceModule = require('../services/quota.service') as typeof import('../services/quota.service');

describe('Quota Enforcement', () => {
  let freeUserApiKey: string;
  let growthUserApiKey: string;
  let token: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

    await prisma.apiLog.deleteMany();
    await prisma.budget.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();

    const password = await hashPassword('password123');

    // Free-plan user
    freeUserApiKey = generateApiKey();
    const freeUser = await prisma.user.create({
      data: { email: 'quota-free@example.com', password, apiKey: freeUserApiKey, plan: 'free' },
    });
    token = generateJWT({ userId: freeUser.id, email: freeUser.email });

    // Growth-plan user (limit === -1)
    growthUserApiKey = generateApiKey();
    await prisma.user.create({
      data: { email: 'quota-growth@example.com', password, apiKey: growthUserApiKey, plan: 'growth' },
    });
  });

  beforeEach(async () => {
    jest.restoreAllMocks();
    await prisma.apiLog.deleteMany();
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await prisma.apiLog.deleteMany();
    await prisma.budget.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
    if (server) server.close();
  });

  // -------------------------------------------------------------------------
  describe('checkEventQuota — single log', () => {
    it('should allow requests when under the limit', async () => {
      const res = await request(app)
        .post('/api/v1/log')
        .set('Authorization', `Bearer ${freeUserApiKey}`)
        .send({
          provider: 'openai',
          model: 'gpt-4o',
          inputTokens: 100,
          outputTokens: 50,
          cost: 0.001,
        });

      expect(res.status).toBe(201);
    });

    it('should return 429 when quota is exceeded', async () => {
      jest.spyOn(quotaServiceModule, 'checkEventQuota').mockResolvedValueOnce({
        allowed: false,
        reason: 'Monthly event limit reached (50000/50000). Upgrade your plan to continue logging.',
        current: 50000,
        limit: 50000,
      });

      const res = await request(app)
        .post('/api/v1/log')
        .set('Authorization', `Bearer ${freeUserApiKey}`)
        .send({
          provider: 'openai',
          model: 'gpt-4o',
          inputTokens: 100,
          outputTokens: 50,
          cost: 0.001,
        });

      expect(res.status).toBe(429);
      expect(res.body.code).toBe('QUOTA_EXCEEDED');
      expect(res.body.quota.upgradeUrl).toContain('/dashboard/billing');
    });

    it('should allow the request when the quota check throws', async () => {
      jest.spyOn(quotaServiceModule, 'checkEventQuota').mockRejectedValueOnce(
        new Error('DB timeout'),
      );

      const res = await request(app)
        .post('/api/v1/log')
        .set('Authorization', `Bearer ${freeUserApiKey}`)
        .send({
          provider: 'openai',
          model: 'gpt-4o',
          inputTokens: 100,
          outputTokens: 50,
          cost: 0.001,
        });

      // Must succeed even when quota check throws — never block ingestion.
      expect(res.status).toBe(201);
    });

    it('should allow unlimited events for the growth plan', async () => {
      // No mock — real checkEventQuota sees plan='growth', returns limit=-1, allowed=true.
      const res = await request(app)
        .post('/api/v1/log')
        .set('Authorization', `Bearer ${growthUserApiKey}`)
        .send({
          provider: 'openai',
          model: 'gpt-4o',
          inputTokens: 100,
          outputTokens: 50,
          cost: 0.001,
        });

      expect(res.status).toBe(201);
    });
  });

  // -------------------------------------------------------------------------
  describe('GET /api/v1/stats/quota', () => {
    it('should return quota status for the authenticated user', async () => {
      const res = await request(app)
        .get('/api/v1/stats/quota')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('plan');
      expect(res.body.data).toHaveProperty('current');
      expect(res.body.data).toHaveProperty('limit');
      expect(res.body.data).toHaveProperty('percentUsed');
      expect(res.body.data).toHaveProperty('resetsAt');
    });

    it('should require auth', async () => {
      const res = await request(app).get('/api/v1/stats/quota');
      expect(res.status).toBe(401);
    });
  });

  // -------------------------------------------------------------------------
  describe('Batch quota truncation', () => {
    it('should truncate the batch to the remaining quota and return actual inserted count', async () => {
      // 5 events remaining (49995 used out of 50000 limit)
      jest.spyOn(quotaServiceModule, 'checkEventQuota').mockResolvedValueOnce({
        allowed: true,
        current: 49995,
        limit: 50000,
      });

      const tenEvents = Array(10).fill({
        provider: 'openai',
        model: 'gpt-4o',
        inputTokens: 100,
        outputTokens: 50,
        cost: 0.001,
      });

      const res = await request(app)
        .post('/api/v1/log/batch')
        .set('Authorization', `Bearer ${freeUserApiKey}`)
        .send(tenEvents);

      // Only 5 of the 10 should be inserted.
      expect(res.status).toBe(201);
      expect(res.body.count).toBe(5);
    });
  });
});
