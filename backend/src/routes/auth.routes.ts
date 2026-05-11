import { Router } from 'express';
import type { Request, Response } from 'express';

import { getProfile, login, signup } from '../controllers/auth.controller';
import { authenticateJWT } from '../middleware/auth';
import { keyRegenerationLimiter } from '../middleware/rateLimiter';
import { prisma } from '../config/database';
import { generateApiKey } from '../utils/auth';
import { logger } from '../utils/logger';

const authRouter = Router();

authRouter.post('/signup', signup);
authRouter.post('/login', login);
authRouter.get('/profile', authenticateJWT, getProfile);
authRouter.get('/verify', authenticateJWT, (req, res) => {
  const user = (req as { user?: { id: string; email: string } }).user;
  res.json({ valid: true, user });
});

authRouter.post(
  '/api-key/regenerate',
  keyRegenerationLimiter,
  authenticateJWT,
  async (req: Request, res: Response) => {
    const userId = (req as Request & { user?: { id: string } }).user?.id;
    if (!userId) { res.status(401).json({ status: 'error', message: 'Unauthorized' }); return; }

    try {
      const newApiKey = generateApiKey();

      await prisma.user.update({
        where: { id: userId },
        data: { apiKey: newApiKey },
      });

      logger.info('API key regenerated', { userId });

      res.json({
        status: 'success',
        message: 'API key regenerated. Update your SDK configuration — the old key is now invalid.',
        apiKey: newApiKey,
      });
    } catch (error) {
      logger.error('Failed to regenerate API key', error as Error);
      res.status(500).json({ status: 'error', message: 'Failed to regenerate API key' });
    }
  },
);

export { authRouter };
