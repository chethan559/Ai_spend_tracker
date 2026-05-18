import request from 'supertest';

import { app, server } from '../index';
import { prisma } from '../config/database';
import { generateApiKey, generateJWT, hashPassword } from '../utils/auth';

describe('Projects API', () => {
  let apiKey: string;
  let token: string;
  let tokenUserA: string;
  let tokenUserB: string;
  let userAId: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

    await prisma.apiLog.deleteMany();
    await prisma.budget.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();

    // User A — main test user
    apiKey = generateApiKey();
    const password = await hashPassword('password123');
    const userA = await prisma.user.create({
      data: { email: 'proj-a@example.com', password, apiKey, plan: 'starter' },
    });
    userAId = userA.id;
    token = generateJWT({ userId: userA.id, email: userA.email });
    tokenUserA = token;

    // User B — for isolation / 403 tests
    const apiKeyB = generateApiKey();
    const userB = await prisma.user.create({
      data: { email: 'proj-b@example.com', password, apiKey: apiKeyB, plan: 'starter' },
    });
    tokenUserB = generateJWT({ userId: userB.id, email: userB.email });
  });

  beforeEach(async () => {
    await prisma.apiLog.deleteMany();
    await prisma.project.deleteMany();
  });

  afterAll(async () => {
    await prisma.apiLog.deleteMany();
    await prisma.budget.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
    if (server) server.close();
  });

  // -------------------------------------------------------------------------
  describe('POST /api/v1/projects', () => {
    it('should create a project', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'My Project', description: 'Test' });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('My Project');
      expect(res.body.data.description).toBe('Test');
      expect(res.body.data.id).toBeDefined();
    });

    it('should reject duplicate project name', async () => {
      await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Duplicate' });

      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Duplicate' });

      expect(res.status).toBe(409);
    });

    it('should reject name longer than 50 chars', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'a'.repeat(51) });

      expect(res.status).toBe(400);
    });

    it('should require auth', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .send({ name: 'No Auth' });

      expect(res.status).toBe(401);
    });
  });

  // -------------------------------------------------------------------------
  describe('GET /api/v1/projects', () => {
    it('should list projects with spend summary', async () => {
      await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Listed Project' });

      const res = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0]).toHaveProperty('totalSpend');
      expect(res.body.data[0]).toHaveProperty('totalRequests');
      expect(res.body.data[0]).toHaveProperty('lastActiveAt');
    });

    it('should only return projects for the authenticated user', async () => {
      await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ name: 'User A Project' });

      const res = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(200);
      const names = res.body.data.map((p: { name: string }) => p.name);
      expect(names).not.toContain('User A Project');
    });
  });

  // -------------------------------------------------------------------------
  describe('GET /api/v1/projects/:id', () => {
    it('should return a single project with full stats', async () => {
      const created = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Detail Project' });

      const res = await request(app)
        .get(`/api/v1/projects/${created.body.data.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Detail Project');
      expect(res.body.data).toHaveProperty('byModel');
      expect(res.body.data).toHaveProperty('dailySpend');
      expect(Array.isArray(res.body.data.byModel)).toBe(true);
      expect(Array.isArray(res.body.data.dailySpend)).toBe(true);
    });

    it('should return 404 for a non-existent project', async () => {
      const res = await request(app)
        .get('/api/v1/projects/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  // -------------------------------------------------------------------------
  describe('PUT /api/v1/projects/:id', () => {
    it('should update project name', async () => {
      const created = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Old Name' });

      const res = await request(app)
        .put(`/api/v1/projects/${created.body.data.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New Name' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('New Name');
    });

    it('should return 403 when updating another user\'s project', async () => {
      const created = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ name: 'User A Only' });

      const res = await request(app)
        .put(`/api/v1/projects/${created.body.data.id}`)
        .set('Authorization', `Bearer ${tokenUserB}`)
        .send({ name: 'Hacked' });

      expect(res.status).toBe(403);
    });

    it('should return 400 when no fields are provided', async () => {
      const created = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Needs Fields' });

      const res = await request(app)
        .put(`/api/v1/projects/${created.body.data.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  // -------------------------------------------------------------------------
  describe('DELETE /api/v1/projects/:id', () => {
    it('should delete a project and unlink its logs', async () => {
      const project = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'To Delete' });

      const projectId = project.body.data.id;

      // Create a log linked to this project via top-level projectId field.
      await request(app)
        .post('/api/v1/log')
        .set('Authorization', `Bearer ${apiKey}`)
        .send({
          provider: 'openai',
          model: 'gpt-4o',
          inputTokens: 100,
          outputTokens: 50,
          cost: 0.001,
          projectId,
        });

      const res = await request(app)
        .delete(`/api/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.unlinkedLogs).toBeGreaterThanOrEqual(1);

      // Project should be gone.
      const check = await request(app)
        .get(`/api/v1/projects/${projectId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(check.status).toBe(404);
    });

    it('should return 403 when deleting another user\'s project', async () => {
      const created = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({ name: 'Protected Project' });

      const res = await request(app)
        .delete(`/api/v1/projects/${created.body.data.id}`)
        .set('Authorization', `Bearer ${tokenUserB}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 for a non-existent project', async () => {
      const res = await request(app)
        .delete('/api/v1/projects/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });
});
