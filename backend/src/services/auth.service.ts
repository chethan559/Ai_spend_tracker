import { prisma } from '../config/database';
import {
  comparePassword,
  generateApiKey,
  generateJWT,
  hashPassword,
} from '../utils/auth';
import { logger } from '../utils/logger';

export interface AuthUser {
  id: string;
  email: string;
  apiKey: string;
  plan: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  subscriptionStatus?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResult {
  user: AuthUser;
  token: string;
}

/**
 * Create a new user with hashed password and generated API key.
 */
export async function createUser(
  email: string,
  password: string,
): Promise<AuthUser> {
  try {
    const normalizedEmail = email.toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      throw new Error('User already exists');
    }

    const hashedPassword = await hashPassword(password);
    const apiKey = generateApiKey();

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        apiKey,
        plan: 'free',
      },
    });

    logger.info('User created', { userId: user.id, email: user.email });

    // Exclude password from response.
    const { password: _password, ...safeUser } = user;
    return safeUser;
  } catch (error) {
    logger.error('Failed to create user', error as Error);
    throw error;
  }
}

/**
 * Authenticate a user and return a JWT token.
 */
export async function authenticateUser(
  email: string,
  password: string,
): Promise<AuthResult> {
  try {
    const normalizedEmail = email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    const token = generateJWT({ userId: user.id, email: user.email });
    logger.info('User authenticated', { userId: user.id, email: user.email });

    const { password: _password, ...safeUser } = user;
    return { user: safeUser, token };
  } catch (error) {
    logger.error('Failed to authenticate user', error as Error);
    throw error;
  }
}

/**
 * Find a user by API key and return a safe user object.
 */
export async function findUserByApiKey(
  apiKey: string,
): Promise<AuthUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { apiKey },
    });
    if (!user) {
      return null;
    }

    const { password: _password, ...safeUser } = user;
    return safeUser;
  } catch (error) {
    logger.error('Failed to find user by API key', error as Error);
    throw error;
  }
}

/**
 * Find a user by id and return a safe user object.
 */
export async function findUserById(
  userId: string,
): Promise<AuthUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return null;
    }

    const { password: _password, ...safeUser } = user;
    return safeUser;
  } catch (error) {
    logger.error('Failed to find user by id', error as Error);
    throw error;
  }
}

