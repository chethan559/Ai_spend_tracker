import { Router } from 'express';

import { getProfile, login, signup } from '../controllers/auth.controller';
import { authenticateJWT } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';

const authRouter = Router();

/**
 * POST /signup
 * Public endpoint to create a new user.
 */
authRouter.post('/signup', authRateLimiter, signup);

/**
 * POST /login
 * Public endpoint to authenticate a user.
 */
authRouter.post('/login', authRateLimiter, login);

/**
 * GET /profile
 * Protected endpoint to fetch current user profile.
 */
authRouter.get('/profile', authenticateJWT, getProfile);

/**
 * GET /verify
 * Protected endpoint to verify the current token.
 */
authRouter.get('/verify', authenticateJWT, (req, res) => {
  const user = (req as { user?: { id: string; email: string } }).user;
  res.json({ valid: true, user });
});

export { authRouter };

