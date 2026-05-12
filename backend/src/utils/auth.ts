import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

/**
 * Hash a password using bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    return await bcrypt.hash(password, 10);
  } catch (error) {
    console.error('Failed to hash password:', error);
    throw new Error('Failed to hash password');
  }
}

/**
 * Compare a plain password against a bcrypt hash.
 */
export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Failed to compare password:', error);
    return false;
  }
}

/**
 * Generate a signed JWT for a user payload.
 */
export function generateJWT(payload: { userId: string; email: string }): string {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not set');
    }

    const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];
    const options: jwt.SignOptions = { expiresIn };
    return jwt.sign(payload, secret as jwt.Secret, options);
  } catch (error) {
    console.error('Failed to generate JWT:', error);
    throw new Error('Failed to generate JWT');
  }
}

/**
 * Verify a JWT and return the decoded payload if valid.
 */
export function verifyJWT(
  token: string,
): { userId: string; email: string } | null {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not set');
    }

    const decoded = jwt.verify(token, secret) as {
      userId: string;
      email: string;
    };
    return { userId: decoded.userId, email: decoded.email };
  } catch (error) {
    console.error('Failed to verify JWT:', error);
    return null;
  }
}

/**
 * Generate a unique API key with the "ast_" prefix.
 */
export function generateApiKey(): string {
  try {
    return `ast_${uuidv4()}`;
  } catch (error) {
    console.error('Failed to generate API key:', error);
    throw new Error('Failed to generate API key');
  }
}

/**
 * Generate a project-scoped API key with the "psk_" prefix.
 */
export function generateProjectApiKey(): string {
  const { randomBytes } = require('crypto') as typeof import('crypto');
  return 'psk_' + randomBytes(24).toString('hex');
}

