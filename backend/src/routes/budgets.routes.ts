import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { startOfMonth, subDays } from 'date-fns';
import { Prisma } from '@prisma/client';

import { prisma } from '../config/database';
import { authenticateJWT } from '../middleware/auth';
import { logger } from '../utils/logger';

const budgetsRouter = Router();

const createBudgetSchema = z.object({
  projectId: z.string().uuid().optional(),
  amount: z.number().positive('Amount must be greater than 0'),
  period: z.enum(['monthly', 'weekly']),
  alertThreshold: z.number().int().min(1).max(100).optional(),
  alertChannel: z.enum(['email', 'slack', 'both']).optional(),
  slackWebhookUrl: z
    .string()
    .refine((url) => url.startsWith('https://hooks.slack.com/'), {
      message: 'slackWebhookUrl must start with https://hooks.slack.com/',
    })
    .optional(),
});

const updateBudgetSchema = createBudgetSchema.partial().omit({ projectId: true });

type AuthedRequest = Request & { user?: { id: string; email: string } };

async function calcCurrentSpend(
  userId: string,
  projectId: string | null,
  period: string,
): Promise<number> {
  const now = new Date();
  const startDate =
    period === 'monthly' ? startOfMonth(now) : subDays(now, 7);

  const where: Prisma.ApiLogWhereInput = {
    userId,
    timestamp: { gte: startDate },
    ...(projectId ? { projectId } : {}),
  };

  const agg = await prisma.apiLog.aggregate({ where, _sum: { cost: true } });
  return agg._sum.cost ?? 0;
}

function buildBudgetResponse(
  budget: {
    id: string;
    projectId: string | null;
    amount: number;
    period: string;
    alertThreshold: number | null;
    alertChannel: string | null;
    slackWebhookUrl: string | null;
  },
  currentSpend: number,
) {
  const now = new Date();
  const daysElapsed = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const percentUsed = budget.amount > 0 ? (currentSpend / budget.amount) * 100 : 0;
  const projectedMonthlySpend =
    daysElapsed > 0 ? (currentSpend / daysElapsed) * daysInMonth : 0;

  return {
    id: budget.id,
    projectId: budget.projectId,
    amount: budget.amount,
    period: budget.period,
    alertThreshold: budget.alertThreshold,
    alertChannel: budget.alertChannel,
    slackWebhookUrl: budget.slackWebhookUrl,
    currentSpend,
    percentUsed,
    isOverBudget: percentUsed >= 100,
    projectedMonthlySpend,
  };
}

/**
 * GET /api/v1/budgets
 * List all budgets for the authenticated user with live spend metrics.
 */
budgetsRouter.get('/', authenticateJWT, async (req: AuthedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

  try {
    const budgets = await prisma.budget.findMany({ where: { userId } });

    const result = await Promise.all(
      budgets.map(async (b) => {
        const spend = await calcCurrentSpend(userId, b.projectId, b.period);
        return buildBudgetResponse(b, spend);
      }),
    );

    res.json(result);
  } catch (error) {
    logger.error('Get budgets failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/v1/budgets
 * Create a new budget for the authenticated user.
 */
budgetsRouter.post('/', authenticateJWT, async (req: AuthedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const parsed = createBudgetSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
    return;
  }

  const { projectId, amount, period, alertThreshold, alertChannel, slackWebhookUrl } = parsed.data;

  try {
    const budget = await prisma.budget.create({
      data: { userId, projectId, amount, period, alertThreshold, alertChannel, slackWebhookUrl },
    });

    const spend = await calcCurrentSpend(userId, budget.projectId, budget.period);
    res.status(201).json(buildBudgetResponse(budget, spend));
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      res.status(409).json({ error: 'A budget for this project already exists' });
      return;
    }
    logger.error('Create budget failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/v1/budgets/:id
 * Update a budget (owner only).
 */
budgetsRouter.put('/:id', authenticateJWT, async (req: AuthedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const parsed = updateBudgetSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
    return;
  }

  try {
    const existing = await prisma.budget.findUnique({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ error: 'Budget not found' }); return; }
    if (existing.userId !== userId) { res.status(403).json({ error: 'Forbidden' }); return; }

    const budget = await prisma.budget.update({
      where: { id: req.params.id },
      data: parsed.data,
    });

    const spend = await calcCurrentSpend(userId, budget.projectId, budget.period);
    res.json(buildBudgetResponse(budget, spend));
  } catch (error) {
    logger.error('Update budget failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/v1/budgets/:id
 * Delete a budget (owner only).
 */
budgetsRouter.delete('/:id', authenticateJWT, async (req: AuthedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }

  try {
    const existing = await prisma.budget.findUnique({ where: { id: req.params.id } });
    if (!existing) { res.status(404).json({ error: 'Budget not found' }); return; }
    if (existing.userId !== userId) { res.status(403).json({ error: 'Forbidden' }); return; }

    await prisma.budget.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    logger.error('Delete budget failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { budgetsRouter };
