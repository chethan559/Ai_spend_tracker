import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client singleton to avoid creating multiple instances during development.
 */
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Use a shared Prisma client in development to prevent exhausting connections.
 */
export const prisma: PrismaClient =
  global.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

