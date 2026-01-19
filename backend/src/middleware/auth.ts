import type { NextFunction, Request, Response } from 'express';

import { verifyJWT } from '../utils/auth';
import { findUserByApiKey } from '../services/auth.service';
import { logger } from '../utils/logger';

type AuthenticatedRequest = Request & {
  user?: { id: string; email: string; apiKey?: string };
};

/**
 * Authenticate requests using a Bearer JWT token.
 */
export function authenticateJWT(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : '';

    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const decoded = verifyJWT(token);
    if (!decoded) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    req.user = { id: decoded.userId, email: decoded.email };
    next();
  } catch (error) {
    logger.error('JWT authentication failed', error as Error);
    res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Authenticate requests using a Bearer API key.
 */
export async function authenticateApiKey(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization || '';
    const apiKey = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : '';

    if (!apiKey) {
      res.status(401).json({ error: 'No API key provided' });
      return;
    }

    const user = await findUserByApiKey(apiKey);
    if (!user) {
      res.status(401).json({ error: 'Invalid API key' });
      return;
    }

    req.user = { id: user.id, email: user.email, apiKey: user.apiKey };
    next();
  } catch (error) {
    logger.error('API key authentication failed', error as Error);
    res.status(401).json({ error: 'Invalid API key' });
  }
}

/**
 * Optionally authenticate using JWT or API key, otherwise continue unauthenticated.
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : '';

    if (!token) {
      return next();
    }

    const decoded = verifyJWT(token);
    if (decoded) {
      req.user = { id: decoded.userId, email: decoded.email };
      return next();
    }

    const user = await findUserByApiKey(token);
    if (user) {
      req.user = { id: user.id, email: user.email, apiKey: user.apiKey };
    }

    return next();
  } catch (error) {
    logger.error('Optional authentication failed', error as Error);
    return next();
  }
}

