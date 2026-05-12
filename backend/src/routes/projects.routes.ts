import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { subDays } from 'date-fns';
import { Prisma } from '@prisma/client';

import { authenticateJWT } from '../middleware/auth';
import { prisma } from '../config/database';
import { generateProjectApiKey } from '../utils/auth';
import { logger } from '../utils/logger';

export const projectsRouter = Router();

// All project routes require JWT auth.
projectsRouter.use(authenticateJWT);

type AuthedRequest = Request & { user?: { id: string; email: string } };

const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name must be 50 characters or less')
    .trim(),
  description: z
    .string()
    .max(200, 'Description must be 200 characters or less')
    .trim()
    .optional(),
});

const updateProjectSchema = z
  .object({
    name: z.string().min(1).max(50).trim().optional(),
    description: z.string().max(200).trim().optional(),
  })
  .refine(
    (data) => data.name !== undefined || data.description !== undefined,
    { message: 'At least one field must be provided' },
  );

async function buildProjectStats(userId: string, projectId: string) {
  const [agg, lastLog] = await Promise.all([
    prisma.apiLog.aggregate({
      where: { userId, projectId },
      _sum: { cost: true },
      _count: { id: true },
    }),
    prisma.apiLog.findFirst({
      where: { userId, projectId },
      orderBy: { timestamp: 'desc' },
      select: { timestamp: true },
    }),
  ]);

  return {
    totalSpend: agg._sum.cost ?? 0,
    totalRequests: agg._count.id,
    lastActiveAt: lastLog?.timestamp?.toISOString() ?? null,
  };
}

// ---------------------------------------------------------------------------
// GET /api/v1/projects
// ---------------------------------------------------------------------------
projectsRouter.get('/', async (req: AuthedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

  try {
    let projects = await prisma.project.findMany({ where: { userId } });

    // Backfill: generate keys for any existing projects that don't have one yet.
    const needsKey = projects.filter((p) => !p.apiKey);
    if (needsKey.length > 0) {
      await Promise.all(
        needsKey.map((p) =>
          prisma.project.update({ where: { id: p.id }, data: { apiKey: generateProjectApiKey() } }),
        ),
      );
      projects = await prisma.project.findMany({ where: { userId } });
    }

    const withStats = await Promise.all(
      projects.map(async (p) => ({ ...p, ...(await buildProjectStats(userId, p.id)) })),
    );

    withStats.sort((a, b) => b.totalSpend - a.totalSpend);

    res.json({ data: withStats });
  } catch (error) {
    logger.error('Get projects failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/v1/projects
// ---------------------------------------------------------------------------
projectsRouter.post('/', async (req: AuthedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const parsed = createProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
    return;
  }

  try {
    const project = await prisma.project.create({
      data: {
        userId,
        name: parsed.data.name,
        description: parsed.data.description,
        apiKey: generateProjectApiKey(),
      },
    });

    res.status(201).json({
      data: { ...project, totalSpend: 0, totalRequests: 0, lastActiveAt: null },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(409).json({ error: 'A project with this name already exists' });
      return;
    }
    logger.error('Create project failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/v1/projects/:id
// ---------------------------------------------------------------------------
projectsRouter.get('/:id', async (req: AuthedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project) { res.status(404).json({ error: 'Project not found' }); return; }
    if (project.userId !== userId) { res.status(403).json({ error: 'Forbidden' }); return; }

    const thirtyDaysAgo = subDays(new Date(), 30);

    const [stats, byModelRaw, dailyRaw] = await Promise.all([
      buildProjectStats(userId, project.id),
      prisma.apiLog.groupBy({
        by: ['model'],
        where: { userId, projectId: project.id },
        _sum: { cost: true },
        _count: { id: true },
        orderBy: { _sum: { cost: 'desc' } },
      }),
      prisma.$queryRaw<Array<{ date: Date; spend: unknown; requests: bigint }>>`
        SELECT
          DATE_TRUNC('day', timestamp AT TIME ZONE 'UTC') AS date,
          SUM(cost)  AS spend,
          COUNT(*)   AS requests
        FROM "ApiLog"
        WHERE "userId"    = ${userId}
          AND "projectId" = ${project.id}
          AND timestamp   >= ${thirtyDaysAgo}
        GROUP BY 1
        ORDER BY 1 ASC
      `,
    ]);

    res.json({
      data: {
        ...project,
        ...stats,
        byModel: byModelRaw.map((r) => ({
          model: r.model,
          spend: r._sum.cost ?? 0,
          requests: r._count.id,
        })),
        dailySpend: dailyRaw.map((r) => ({
          date: (r.date as Date).toISOString().split('T')[0],
          spend: Number(r.spend),
          requests: Number(r.requests),
        })),
      },
    });
  } catch (error) {
    logger.error('Get project failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/v1/projects/:id
// ---------------------------------------------------------------------------
projectsRouter.put('/:id', async (req: AuthedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const parsed = updateProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  try {
    const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ error: 'Project not found' }); return; }
    if (existing.userId !== userId) { res.status(403).json({ error: 'Forbidden' }); return; }

    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data: parsed.data,
    });

    const stats = await buildProjectStats(userId, updated.id);
    res.json({ data: { ...updated, ...stats } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(409).json({ error: 'A project with this name already exists' });
      return;
    }
    logger.error('Update project failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/v1/projects/:id/rotate-key
// ---------------------------------------------------------------------------
projectsRouter.post('/:id/rotate-key', async (req: AuthedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

  try {
    const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ error: 'Project not found' }); return; }
    if (existing.userId !== userId) { res.status(403).json({ error: 'Forbidden' }); return; }

    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data: { apiKey: generateProjectApiKey() },
    });

    res.json({ apiKey: updated.apiKey });
  } catch (error) {
    logger.error('Rotate project key failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/v1/projects/:id
// ---------------------------------------------------------------------------
projectsRouter.delete('/:id', async (req: AuthedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

  try {
    const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ error: 'Project not found' }); return; }
    if (existing.userId !== userId) { res.status(403).json({ error: 'Forbidden' }); return; }

    // Unlink logs first so the project delete doesn't violate FK constraints.
    const [unlinkResult] = await prisma.$transaction([
      prisma.apiLog.updateMany({
        where: { projectId: req.params.id, userId },
        data: { projectId: null },
      }),
      prisma.project.delete({ where: { id: req.params.id } }),
    ]);

    res.json({
      status: 'success',
      message: `Project deleted. ${unlinkResult.count} logs unlinked.`,
      unlinkedLogs: unlinkResult.count,
    });
  } catch (error) {
    logger.error('Delete project failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
