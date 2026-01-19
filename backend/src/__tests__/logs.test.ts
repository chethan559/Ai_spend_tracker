import request from 'supertest';
import { subDays } from 'date-fns';

import { app, server } from '../index';
import { prisma } from '../config/database';
import { generateApiKey, generateJWT, hashPassword } from '../utils/auth';

describe('Logs and Stats API', () => {
  let apiKey: string;
  let userId: string;
  let jwtToken: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    await prisma.apiLog.deleteMany();
    await prisma.budget.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();

    apiKey = generateApiKey();
    const password = await hashPassword('password123');
    const user = await prisma.user.create({
      data: {
        email: 'logs@example.com',
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

  describe('POST /api/v1/log', () => {
    it('should create log with valid API key', async () => {
      const response = await request(app)
        .post('/api/v1/log')
        .set('Authorization', `Bearer ${apiKey}`)
        .send({
          provider: 'openai',
          model: 'gpt-4',
          tokens: 1500,
          cost: 0.045,
          metadata: { feature: 'chatbot' },
        });

      expect(response.status).toBe(201);
      expect(response.body.log.provider).toBe('openai');
    });

    it('should reject log without API key', async () => {
      const response = await request(app)
        .post('/api/v1/log')
        .send({
          provider: 'openai',
          model: 'gpt-4',
          tokens: 1500,
          cost: 0.045,
        });

      expect(response.status).toBe(401);
    });

    it('should reject log with invalid API key', async () => {
      const response = await request(app)
        .post('/api/v1/log')
        .set('Authorization', 'Bearer invalid')
        .send({
          provider: 'openai',
          model: 'gpt-4',
          tokens: 1500,
          cost: 0.045,
        });

      expect(response.status).toBe(401);
    });

    it('should validate log data (missing fields)', async () => {
      const response = await request(app)
        .post('/api/v1/log')
        .set('Authorization', `Bearer ${apiKey}`)
        .send({
          model: 'gpt-4',
          tokens: 1500,
        });

      expect(response.status).toBe(400);
    });

    it('should store metadata as JSON', async () => {
      const response = await request(app)
        .post('/api/v1/log')
        .set('Authorization', `Bearer ${apiKey}`)
        .send({
          provider: 'openai',
          model: 'gpt-4',
          tokens: 1500,
          cost: 0.045,
          metadata: { userId: 'user123', feature: 'chatbot' },
        });

      expect(response.status).toBe(201);
      const log = await prisma.apiLog.findFirst({ where: { userId } });
      expect(log?.metadata).toMatchObject({ userId: 'user123', feature: 'chatbot' });
    });
  });

  describe('POST /api/v1/log/batch', () => {
    it('should create multiple logs in batch', async () => {
      const response = await request(app)
        .post('/api/v1/log/batch')
        .set('Authorization', `Bearer ${apiKey}`)
        .send([
          {
            provider: 'openai',
            model: 'gpt-3.5-turbo',
            tokens: 500,
            cost: 0.001,
          },
          {
            provider: 'anthropic',
            model: 'claude-3-sonnet',
            tokens: 2000,
            cost: 0.012,
          },
        ]);

      expect(response.status).toBe(201);
      expect(response.body.count).toBe(2);
    });

    it('should reject batch with invalid logs', async () => {
      const response = await request(app)
        .post('/api/v1/log/batch')
        .set('Authorization', `Bearer ${apiKey}`)
        .send([{ provider: 'openai' }]);

      expect(response.status).toBe(400);
    });

    it('should enforce max batch size (100)', async () => {
      const payload = Array.from({ length: 101 }, () => ({
        provider: 'openai',
        model: 'gpt-4',
        tokens: 1,
        cost: 0.001,
      }));

      const response = await request(app)
        .post('/api/v1/log/batch')
        .set('Authorization', `Bearer ${apiKey}`)
        .send(payload);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/log', () => {
    it('should return user logs', async () => {
      await prisma.apiLog.create({
        data: {
          userId,
          provider: 'openai',
          model: 'gpt-4',
          tokens: 100,
          cost: 0.01,
          timestamp: new Date(),
        },
      });

      const response = await request(app)
        .get('/api/v1/log')
        .set('Authorization', `Bearer ${apiKey}`);

      expect(response.status).toBe(200);
      expect(response.body.logs.length).toBe(1);
    });

    it('should paginate results', async () => {
      await prisma.apiLog.createMany({
        data: Array.from({ length: 5 }, () => ({
          userId,
          provider: 'openai',
          model: 'gpt-4',
          tokens: 100,
          cost: 0.01,
          timestamp: new Date(),
        })),
      });

      const response = await request(app)
        .get('/api/v1/log?limit=2&skip=1')
        .set('Authorization', `Bearer ${apiKey}`);

      expect(response.status).toBe(200);
      expect(response.body.logs.length).toBe(2);
    });

    it('should filter by provider', async () => {
      await prisma.apiLog.createMany({
        data: [
          {
            userId,
            provider: 'openai',
            model: 'gpt-4',
            tokens: 100,
            cost: 0.01,
            timestamp: new Date(),
          },
          {
            userId,
            provider: 'anthropic',
            model: 'claude-3-sonnet',
            tokens: 100,
            cost: 0.01,
            timestamp: new Date(),
          },
        ],
      });

      const response = await request(app)
        .get('/api/v1/log?provider=openai')
        .set('Authorization', `Bearer ${apiKey}`);

      expect(response.status).toBe(200);
      expect(response.body.logs[0].provider).toBe('openai');
    });

    it('should filter by project', async () => {
      const project = await prisma.project.create({
        data: { userId, name: 'Test Project' },
      });

      await prisma.apiLog.createMany({
        data: [
          {
            userId,
            provider: 'openai',
            model: 'gpt-4',
            tokens: 100,
            cost: 0.01,
            projectId: project.id,
            timestamp: new Date(),
          },
          {
            userId,
            provider: 'openai',
            model: 'gpt-4',
            tokens: 100,
            cost: 0.01,
            timestamp: new Date(),
          },
        ],
      });

      const response = await request(app)
        .get(`/api/v1/log?projectId=${project.id}`)
        .set('Authorization', `Bearer ${apiKey}`);

      expect(response.status).toBe(200);
      expect(response.body.logs.length).toBe(1);
      expect(response.body.logs[0].projectId).toBe(project.id);
    });

    it('should order by timestamp DESC', async () => {
      const older = subDays(new Date(), 2);
      const newer = new Date();

      await prisma.apiLog.createMany({
        data: [
          {
            userId,
            provider: 'openai',
            model: 'gpt-4',
            tokens: 100,
            cost: 0.01,
            timestamp: older,
          },
          {
            userId,
            provider: 'openai',
            model: 'gpt-4',
            tokens: 100,
            cost: 0.01,
            timestamp: newer,
          },
        ],
      });

      const response = await request(app)
        .get('/api/v1/log')
        .set('Authorization', `Bearer ${apiKey}`);

      expect(response.status).toBe(200);
      expect(new Date(response.body.logs[0].timestamp).getTime())
        .toBeGreaterThan(new Date(response.body.logs[1].timestamp).getTime());
    });
  });

  describe('GET /api/v1/stats/overview', () => {
    it('should return total spend and requests', async () => {
      await prisma.apiLog.createMany({
        data: [
          {
            userId,
            provider: 'openai',
            model: 'gpt-4',
            tokens: 100,
            cost: 0.01,
            timestamp: new Date(),
          },
          {
            userId,
            provider: 'openai',
            model: 'gpt-4',
            tokens: 100,
            cost: 0.02,
            timestamp: new Date(),
          },
        ],
      });

      const response = await request(app)
        .get('/api/v1/stats/overview')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(200);
      expect(response.body.totalSpend).toBeCloseTo(0.03);
      expect(response.body.totalRequests).toBe(2);
    });

    it('should calculate average cost', async () => {
      await prisma.apiLog.createMany({
        data: [
          {
            userId,
            provider: 'openai',
            model: 'gpt-4',
            tokens: 100,
            cost: 0.01,
            timestamp: new Date(),
          },
          {
            userId,
            provider: 'openai',
            model: 'gpt-4',
            tokens: 100,
            cost: 0.03,
            timestamp: new Date(),
          },
        ],
      });

      const response = await request(app)
        .get('/api/v1/stats/overview')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(200);
      expect(response.body.avgCost).toBeCloseTo(0.02);
    });

    it('should filter by date range', async () => {
      const past = subDays(new Date(), 40);
      await prisma.apiLog.createMany({
        data: [
          {
            userId,
            provider: 'openai',
            model: 'gpt-4',
            tokens: 100,
            cost: 0.01,
            timestamp: past,
          },
          {
            userId,
            provider: 'openai',
            model: 'gpt-4',
            tokens: 100,
            cost: 0.02,
            timestamp: new Date(),
          },
        ],
      });

      const response = await request(app)
        .get('/api/v1/stats/overview?startDate=2026-01-01')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(200);
      expect(response.body.totalSpend).toBeCloseTo(0.02);
    });

    it('should return 0 for users with no logs', async () => {
      const response = await request(app)
        .get('/api/v1/stats/overview')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(200);
      expect(response.body.totalSpend).toBe(0);
      expect(response.body.totalRequests).toBe(0);
    });
  });

  describe('GET /api/v1/stats/daily', () => {
    it('should return daily breakdown', async () => {
      await prisma.apiLog.create({
        data: {
          userId,
          provider: 'openai',
          model: 'gpt-4',
          tokens: 100,
          cost: 0.01,
          timestamp: new Date(),
        },
      });

      const response = await request(app)
        .get('/api/v1/stats/daily?days=3')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(200);
      expect(response.body.stats.length).toBe(3);
    });

    it('should fill missing dates with 0', async () => {
      await prisma.apiLog.create({
        data: {
          userId,
          provider: 'openai',
          model: 'gpt-4',
          tokens: 100,
          cost: 0.01,
          timestamp: new Date(),
        },
      });

      const response = await request(app)
        .get('/api/v1/stats/daily?days=2')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(200);
      expect(response.body.stats.some((s: { spend: number }) => s.spend === 0))
        .toBe(true);
    });

    it('should respect days parameter', async () => {
      const response = await request(app)
        .get('/api/v1/stats/daily?days=5')
        .set('Authorization', `Bearer ${jwtToken}`);

      expect(response.status).toBe(200);
      expect(response.body.stats.length).toBe(5);
    });
  });
});

