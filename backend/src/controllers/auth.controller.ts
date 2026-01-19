import type { Request, Response } from 'express';

import { authenticateUser, createUser, findUserById } from '../services/auth.service';
import { loginSchema, signupSchema, validateRequest } from '../utils/validators';
import { logger } from '../utils/logger';

/**
 * Register a new user and return the API key.
 */
export async function signup(req: Request, res: Response): Promise<void> {
  const validation = validateRequest(signupSchema, req.body);
  if (!validation.success) {
    res.status(400).json({ errors: validation.errors });
    return;
  }

  try {
    const user = await createUser(validation.data.email, validation.data.password);
    res.status(201).json({
      message: 'User created successfully',
      user: { id: user.id, email: user.email, apiKey: user.apiKey },
      apiKey: user.apiKey,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'User already exists') {
      res.status(409).json({ error: 'User already exists' });
      return;
    }

    logger.error('Signup failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Authenticate a user with email/password and return a JWT.
 */
export async function login(req: Request, res: Response): Promise<void> {
  const validation = validateRequest(loginSchema, req.body);
  if (!validation.success) {
    res.status(400).json({ errors: validation.errors });
    return;
  }

  try {
    const result = await authenticateUser(
      validation.data.email,
      validation.data.password,
    );

    res.status(200).json({
      message: 'Login successful',
      token: result.token,
      user: { id: result.user.id, email: result.user.email, apiKey: result.user.apiKey },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid credentials') {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    logger.error('Login failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get the current user's profile.
 */
export async function getProfile(req: Request, res: Response): Promise<void> {
  const userId = (req as { user?: { id: string } }).user?.id;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const user = await findUserById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    logger.error('Get profile failed', error as Error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

