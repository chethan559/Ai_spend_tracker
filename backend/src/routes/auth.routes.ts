import { Router } from 'express';

import { getProfile, login, signup } from '../controllers/auth.controller';
import { authenticateJWT } from '../middleware/auth';

const authRouter = Router();

/**
 * POST /signup
 * Public endpoint to create a new user.
 */
authRouter.post('/signup', signup);

/**
 * POST /login
 * Public endpoint to authenticate a user.
 */
authRouter.post('/login', login);

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

