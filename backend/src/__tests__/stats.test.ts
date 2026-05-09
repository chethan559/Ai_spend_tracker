import request from 'supertest';
import { subDays } from 'date-fns';

import { app, server } from '../index';
import { prisma } from '../config/database';
import { generateApiKey, generateJWT, hashPassword } from '../utils/auth';

describe('Stats API', () => {
  let userId: string;
  let jwtToken: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    await prisma.apiLog.deleteMany();
    await prisma.budget.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();

    const apiKey = generateApiKey();
    const password = await hashPassword('password123');
    const user = await prisma.user.create({
      data: {
        email: 'stats@example.com',
        password,
        apiKey,
        plan: 'free',
      },
    });
    userId = user.id;
    jwtToken = generateJWT({ userId, email: user.email });
  });

  beforeEach(async () => {
    await prisma.apiLog.deleteMany();
    await prisma.budget.deleteMany();
    await prisma.project.deleteMany();
  });

  afterAll(async () => {
    await prisma.apiLog.deleteMany();
    await prisma.budget.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
    if (server) {
      server.close();
    }
  });

  describe('GET /api/v1/stats/by-provider', () => {
    it('should return breakdown by provider', async () => {
      await prisma.apiLog.createMany({
        data: [
          {
            userId,
            provider: 'openai',
            model: 'gpt-4o',
            inputTokens: 80,
            outputTokens: 20,
            cost: 1,
            timestamp: new Date(),
          },
          {
            userId,
            provider: 'anthropic',
            model: 'claude-3-sonnet-20240229',
            inputTokens: 80,
            outputTokens: 20,
            cost: 3,
            timestamp: new Date(),
          },
        ],
      });

      const response = await request(app)
        .get('/api/v1/stats/by-provider')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(200);
      expect(response.body.providers.length).toBe(2);
    });

    it('should calculate percentages correctly', async () => {
      await prisma.apiLog.createMany({
        data: [
          {
            userId,
            provider: 'openai',
            model: 'gpt-4o',
            inputTokens: 80,
            outputTokens: 20,
            cost: 1,
            timestamp: new Date(),
          },
          {
            userId,
            provider: 'anthropic',
            model: 'claude-3-sonnet-20240229',
            inputTokens: 80,
            outputTokens: 20,
            cost: 3,
            timestamp: new Date(),
          },
        ],
      });

      const response = await request(app)
        .get('/api/v1/stats/by-provider')
        .set('Authorization', `Bearer ${jwtToken}`);

      const anthropic = response.body.providers.find(
        (p: { provider: string }) => p.provider === 'anthropic',
      );
      expect(anthropic.percentage).toBeCloseTo(75);
    });

    it('should order by spend DESC', async () => {
      await prisma.apiLog.createMany({
        data: [
          {
            userId,
            provider: 'openai',
            model: 'gpt-4o',
            inputTokens: 80,
            outputTokens: 20,
            cost: 1,
            timestamp: new Date(),
          },
          {
            userId,
            provider: 'anthropic',
            model: 'claude-3-sonnet-20240229',
            inputTokens: 80,
            outputTokens: 20,
            cost: 3,
            timestamp: new Date(),
          },
        ],
      });

      const response = await request(app)
        .get('/api/v1/stats/by-provider')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.body.providers[0].provider).toBe('anthropic');
    });

    it('should filter by date range', async () => {
      const filterDate = subDays(new Date(), 20).toISOString().split('T')[0];
      await prisma.apiLog.createMany({
        data: [
          {
            userId,
            provider: 'openai',
            model: 'gpt-4o',
            inputTokens: 80,
            outputTokens: 20,
            cost: 1,
            timestamp: subDays(new Date(), 40),
          },
          {
            userId,
            provider: 'openai',
            model: 'gpt-4o',
            inputTokens: 80,
            outputTokens: 20,
            cost: 2,
            timestamp: new Date(),
          },
        ],
      });

      const response = await request(app)
        .get(`/api/v1/stats/by-provider?startDate=${filterDate}`)
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.body.totalSpend).toBeCloseTo(2);
    });
  });

  describe('GET /api/v1/stats/by-model', () => {
    it('should return breakdown by model', async () => {
      await prisma.apiLog.createMany({
        data: [
          {
            userId,
            provider: 'openai',
            model: 'gpt-4o',
            inputTokens: 80,
            outputTokens: 20,
            cost: 1,
            timestamp: new Date(),
          },
          {
            userId,
            provider: 'openai',
            model: 'gpt-3.5-turbo',
            inputTokens: 80,
            outputTokens: 20,
            cost: 2,
            timestamp: new Date(),
          },
        ],
      });

      const response = await request(app)
        .get('/api/v1/stats/by-model')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(200);
      expect(response.body.models.length).toBe(2);
    });

    it('should include provider context', async () => {
      await prisma.apiLog.create({
        data: {
          userId,
          provider: 'openai',
          model: 'gpt-4o',
          inputTokens: 80,
          outputTokens: 20,
          cost: 1,
          timestamp: new Date(),
        },
      });

      const response = await request(app)
        .get('/api/v1/stats/by-model')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.body.models[0].provider).toBe('openai');
    });

    it('should sum tokens correctly', async () => {
      await prisma.apiLog.createMany({
        data: [
          {
            userId,
            provider: 'openai',
            model: 'gpt-4o',
            inputTokens: 75,
            outputTokens: 25,
            cost: 1,
            timestamp: new Date(),
          },
          {
            userId,
            provider: 'openai',
            model: 'gpt-4o',
            inputTokens: 150,
            outputTokens: 50,
            cost: 2,
            timestamp: new Date(),
          },
        ],
      });

      const response = await request(app)
        .get('/api/v1/stats/by-model')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.body.models[0].totalTokens).toBe(300);
      expect(response.body.models[0].inputTokens).toBe(225);
      expect(response.body.models[0].outputTokens).toBe(75);
    });
  });

  describe('GET /api/v1/stats/by-metadata', () => {
    it('should filter by metadata key', async () => {
      await prisma.apiLog.createMany({
        data: [
          {
            userId,
            provider: 'openai',
            model: 'gpt-4o',
            inputTokens: 80,
            outputTokens: 20,
            cost: 1,
            metadata: { feature: 'chatbot' },
            timestamp: new Date(),
          },
          {
            userId,
            provider: 'openai',
            model: 'gpt-4o',
            inputTokens: 80,
            outputTokens: 20,
            cost: 2,
            metadata: { feature: 'summarizer' },
            timestamp: new Date(),
          },
        ],
      });

      const response = await request(app)
        .get('/api/v1/stats/by-metadata?key=feature')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(200);
      expect(response.body.breakdown.length).toBe(2);
    });

    it('should handle nested JSON paths', async () => {
      await prisma.apiLog.create({
        data: {
          userId,
          provider: 'openai',
          model: 'gpt-4o',
          inputTokens: 80,
          outputTokens: 20,
          cost: 1,
          metadata: { user: { id: 'nested-user' } },
          timestamp: new Date(),
        },
      });

      const response = await request(app)
        .get('/api/v1/stats/by-metadata?key=user.id')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(200);
      expect(response.body.breakdown[0].value).toBe('nested-user');
    });

    it('should return 400 if key not provided', async () => {
      const response = await request(app)
        .get('/api/v1/stats/by-metadata')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(400);
    });
  });
});
