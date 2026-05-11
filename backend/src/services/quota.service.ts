import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { PLANS } from '../utils/constants';

export async function checkEventQuota(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  current: number;
  limit: number;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  const plan = user?.plan ?? 'free';
  const planConfig = PLANS[plan as keyof typeof PLANS] ?? PLANS.free;
  const limit = planConfig.requestLimit;

  if (limit === -1) {
    return { allowed: true, current: 0, limit: -1 };
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const currentCount = await prisma.apiLog.count({
    where: { userId, timestamp: { gte: startOfMonth } },
  });

  if (currentCount >= limit) {
    logger.warn('Event quota exceeded', { userId, plan, currentCount, limit });
    return {
      allowed: false,
      reason: `Monthly event limit reached (${currentCount}/${limit}). Upgrade your plan to continue logging.`,
      current: currentCount,
      limit,
    };
  }

  return { allowed: true, current: currentCount, limit };
}

export async function getQuotaStatus(userId: string): Promise<{
  plan: string;
  current: number;
  limit: number;
  percentUsed: number;
  resetsAt: string;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  const plan = user?.plan ?? 'free';
  const planConfig = PLANS[plan as keyof typeof PLANS] ?? PLANS.free;
  const limit = planConfig.requestLimit;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const currentCount =
    limit === -1
      ? 0
      : await prisma.apiLog.count({
          where: { userId, timestamp: { gte: startOfMonth } },
        });

  const percentUsed = limit === -1 ? 0 : Math.round((currentCount / limit) * 10000) / 100;

  // First day of next month at 00:00 UTC
  const now = new Date();
  const resetsAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  return { plan, current: currentCount, limit, percentUsed, resetsAt: resetsAt.toISOString() };
}
