import type { NextFunction, Request, Response } from 'express';

import { verifyJWT } from '../utils/auth';
import { findUserByApiKey } from '../services/auth.service';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

type AuthenticatedRequest = Request & {
  user?: { id: string; email: string; apiKey?: string; projectId?: string };
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
 * Accepts project-scoped keys (psk_) or legacy user-level keys (ast_).
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

    if (apiKey.startsWith('psk_')) {
      const project = await prisma.project.findUnique({
        where: { apiKey },
        include: { user: { select: { id: true, email: true } } },
      });
      if (!project) {
        res.status(401).json({ error: 'Invalid project API key' });
        return;
      }
      req.user = { id: project.userId, email: project.user.email, projectId: project.id };
      return next();
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
 * Authenticate using JWT or API key — requires one to succeed, else 401.
 * Accepts project-scoped keys (psk_) or legacy user-level keys (ast_).
 */
export async function authenticateAny(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const decoded = verifyJWT(token);
    if (decoded) {
      req.user = { id: decoded.userId, email: decoded.email };
      return next();
    }

    if (token.startsWith('psk_')) {
      const project = await prisma.project.findUnique({
        where: { apiKey: token },
        include: { user: { select: { id: true, email: true } } },
      });
      if (project) {
        req.user = { id: project.userId, email: project.user.email, projectId: project.id };
        return next();
      }
    } else {
      const user = await findUserByApiKey(token);
      if (user) {
        req.user = { id: user.id, email: user.email, apiKey: user.apiKey };
        return next();
      }
    }

    res.status(401).json({ error: 'Invalid token or API key' });
  } catch (error) {
    logger.error('Authentication failed', error as Error);
    res.status(401).json({ error: 'Authentication failed' });
  }
}

/**
 * Optionally authenticate using JWT or API key, otherwise continue unauthenticated.
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
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

