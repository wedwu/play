/**
 * Authentication utilities.
 *
 * - JWT signing and verification use HS256 (symmetric HMAC). For multi-service
 *   deployments, consider RS256 with a public/private key pair so downstream
 *   services can verify tokens without the signing secret.
 * - Passwords are hashed with bcrypt at cost factor 12 (~250ms on modern
 *   hardware). Increase the factor if hardware improves.
 * - `requireAuth` and `requireRole` are thin guards intended to be called at
 *   the top of resolver functions. They throw `GraphQLError` with the correct
 *   Apollo error code so the client's error link can act on them.
 */
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { GraphQLError } from 'graphql';
import { JwtPayload, Role } from '../types';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-prod';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '7d';

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    throw new GraphQLError('Invalid or expired token', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function requireAuth(userId: string | undefined): asserts userId is string {
  if (!userId) {
    throw new GraphQLError('You must be logged in', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
}

export function requireRole(userRole: Role | undefined, requiredRole: Role): void {
  const hierarchy: Record<Role, number> = {
    [Role.ADMIN]: 3,
    [Role.MEMBER]: 2,
    [Role.VIEWER]: 1,
  };
  if (!userRole || hierarchy[userRole] < hierarchy[requiredRole]) {
    throw new GraphQLError('Insufficient permissions', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
}

export function extractTokenFromHeader(authHeader?: string): string | undefined {
  if (!authHeader?.startsWith('Bearer ')) return undefined;
  return authHeader.slice(7);
}
