import type { ErrorRequestHandler, Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';

import { logger } from '../utils/logger';

/**
 * Global error handler that maps common error types to HTTP responses.
 */
export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const isProduction = process.env.NODE_ENV === 'production';

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({
        error: 'Unique constraint failed',
        meta: err.meta,
      });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({
        error: 'Record not found',
      });
      return;
    }
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation error',
      details: err.errors,
    });
    return;
  }

  if (err instanceof TokenExpiredError) {
    res.status(401).json({ error: 'Token expired' });
    return;
  }

  if (err instanceof JsonWebTokenError) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  const error = err as Error;
  logger.error('Unhandled error', error);
  res.status(500).json({
    error: 'Internal server error',
    ...(isProduction ? {} : { stack: error?.stack }),
  });
};

