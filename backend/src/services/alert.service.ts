import {
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subWeeks,
} from 'date-fns';

import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import {
  sendBudgetAlert,
  sendWeeklyDigest,
} from './email.service';

// ---------------------------------------------------------------------------
// Slack helper (private)
// ---------------------------------------------------------------------------

interface SlackAlertParams {
  webhookUrl: string;
  featureName: string;
  currentSpend: number;
  budgetLimit: number;
  percentUsed: number;
}

async function sendSlackAlert(params: SlackAlertParams): Promise<void> {
  const { webhookUrl, featureName, currentSpend, budgetLimit, percentUsed } = params;

  const payload = {
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '⚠️ AI Spend Alert', emoji: true },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text:
            `*${featureName}* has used *${percentUsed}%* of its $${budgetLimit.toFixed(2)}/month budget\n` +
            `Current spend: *$${currentSpend.toFixed(2)}*`,
        },
      },
    ],
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      logger.warn('Slack alert returned non-OK status', {
        status: res.status,
        featureName,
      });
    }
  } catch (error) {
    logger.error('Failed to send Slack alert', error as Error);
  }
}

// ---------------------------------------------------------------------------
// checkBudgetThresholds — called after every successful log insert
// ---------------------------------------------------------------------------

export async function checkBudgetThresholds(userId: string): Promise<void> {
  const budgets = await prisma.budget.findMany({
    where: { userId },
    include: { user: true, project: true },
  });

  if (budgets.length === 0) return;

  const now = new Date();

  for (const budget of budgets) {
    try {
      // No alert configured — nothing to do.
      if (!budget.alertThreshold || !budget.alertChannel) continue;

      // Determine spend window: calendar month or Monday-anchored week.
      const periodStart =
        budget.period === 'monthly'
          ? startOfMonth(now)
          : startOfWeek(now, { weekStartsOn: 1 }); // Monday 00:00

      const spendWhere: Prisma.ApiLogWhereInput = {
        userId,
        timestamp: { gte: periodStart },
        ...(budget.projectId ? { projectId: budget.projectId } : {}),
      };

      const agg = await prisma.apiLog.aggregate({
        where: spendWhere,
        _sum: { cost: true },
      });
      const currentSpend = agg._sum.cost ?? 0;
      const percentUsed = (currentSpend / budget.amount) * 100;

      if (percentUsed < budget.alertThreshold) continue;

      // Deduplicate: skip if we already sent this threshold alert today.
      const alreadySentToday = await prisma.budgetAlert.findFirst({
        where: {
          budgetId: budget.id,
          threshold: budget.alertThreshold,
          sentAt: { gte: startOfDay(now) },
        },
      });
      if (alreadySentToday) continue;

      const featureName = budget.project?.name ?? 'Global Budget';
      const roundedPct = Math.round(percentUsed);
      const dashboardUrl = `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/dashboard/budgets`;

      if (budget.alertChannel === 'email' || budget.alertChannel === 'both') {
        await sendBudgetAlert({
          userEmail: budget.user.email,
          userName: budget.user.email.split('@')[0],
          featureName,
          currentSpend,
          budgetLimit: budget.amount,
          percentUsed: roundedPct,
          threshold: budget.alertThreshold,
          dashboardUrl,
        });
      }

      if (
        (budget.alertChannel === 'slack' || budget.alertChannel === 'both') &&
        budget.slackWebhookUrl
      ) {
        await sendSlackAlert({
          webhookUrl: budget.slackWebhookUrl,
          featureName,
          currentSpend,
          budgetLimit: budget.amount,
          percentUsed: roundedPct,
        });
      }

      // Persist a record so we don't re-alert today.
      await prisma.budgetAlert.create({
        data: {
          budgetId: budget.id,
          userId,
          threshold: budget.alertThreshold,
          channel: budget.alertChannel,
          sentAt: now,
        },
      });

      logger.info('Budget alert sent', {
        userId,
        budgetId: budget.id,
        featureName,
        percentUsed: roundedPct,
      });
    } catch (error) {
      // One broken budget must not block the others.
      logger.error('Budget alert check failed', {
        budgetId: budget.id,
        error: (error as Error).message,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// sendWeeklyDigests — called by the Monday cron job
// ---------------------------------------------------------------------------

export async function sendWeeklyDigests(): Promise<void> {
  const users = await prisma.user.findMany({
    select: { id: true, email: true },
  });

  const now = new Date();

  // Report on the full week that just ended (Mon–Sun).
  const reportedWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const reportedWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

  // Comparison: the week before that.
  const prevWeekStart = startOfWeek(subWeeks(now, 2), { weekStartsOn: 1 });
  const prevWeekEnd = endOfWeek(subWeeks(now, 2), { weekStartsOn: 1 });

  let digestsSent = 0;

  for (const user of users) {
    try {
      // Reported week totals.
      const reportedAgg = await prisma.apiLog.aggregate({
        where: { userId: user.id, timestamp: { gte: reportedWeekStart, lte: reportedWeekEnd } },
        _sum: { cost: true },
      });
      const weeklyTotal = reportedAgg._sum.cost ?? 0;

      // Previous week totals (for comparison).
      const prevAgg = await prisma.apiLog.aggregate({
        where: { userId: user.id, timestamp: { gte: prevWeekStart, lte: prevWeekEnd } },
        _sum: { cost: true },
      });
      const previousWeekTotal = prevAgg._sum.cost ?? 0;

      // Skip users with zero activity in both windows.
      if (weeklyTotal === 0 && previousWeekTotal === 0) continue;

      // Top 3 models by cost in the reported week.
      const topModels = await prisma.apiLog.groupBy({
        by: ['provider', 'model'],
        where: {
          userId: user.id,
          timestamp: { gte: reportedWeekStart, lte: reportedWeekEnd },
        },
        _sum: { cost: true },
        _count: { id: true },
        orderBy: { _sum: { cost: 'desc' } },
        take: 3,
      });

      const topFeatures = topModels.map((row) => ({
        name: `${row.provider} / ${row.model}`,
        cost: row._sum.cost ?? 0,
        requests: row._count.id,
      }));

      // Biggest spike: model with highest WoW % cost increase.
      const prevModels = await prisma.apiLog.groupBy({
        by: ['provider', 'model'],
        where: {
          userId: user.id,
          timestamp: { gte: prevWeekStart, lte: prevWeekEnd },
        },
        _sum: { cost: true },
      });

      const prevMap = new Map(
        prevModels.map((r) => [`${r.provider}/${r.model}`, r._sum.cost ?? 0]),
      );

      let biggestSpike: { name: string; percentIncrease: number } | null = null;

      for (const row of topModels) {
        const key = `${row.provider}/${row.model}`;
        const prevCost = prevMap.get(key) ?? 0;
        if (prevCost > 0) {
          const thisCost = row._sum.cost ?? 0;
          const pct = ((thisCost - prevCost) / prevCost) * 100;
          if (pct > 0 && (!biggestSpike || pct > biggestSpike.percentIncrease)) {
            biggestSpike = {
              name: `${row.provider} / ${row.model}`,
              percentIncrease: Math.round(pct),
            };
          }
        }
      }

      await sendWeeklyDigest({
        userEmail: user.email,
        userName: user.email.split('@')[0],
        weeklyTotal,
        previousWeekTotal,
        topFeatures,
        biggestSpike,
        dashboardUrl: `${process.env.FRONTEND_URL ?? 'http://localhost:3000'}/dashboard`,
      });

      digestsSent++;
    } catch (error) {
      logger.error('Weekly digest failed for user', {
        userId: user.id,
        error: (error as Error).message,
      });
    }
  }

  logger.info('Weekly digests sent', { count: digestsSent, total: users.length });
}
