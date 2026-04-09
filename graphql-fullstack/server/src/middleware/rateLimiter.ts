/**
 * rateLimiter — Express middleware that limits GraphQL requests per IP.
 *
 * Uses a sliding-window token-bucket algorithm:
 *   - Each IP gets a bucket of `maxRequests` tokens.
 *   - One token is consumed per request.
 *   - The bucket refills fully after `windowMs` milliseconds.
 *   - When empty, the request is rejected with HTTP 429.
 *
 * Two separate limiters are exported:
 *   - `defaultLimiter`   — for all GraphQL operations (generous limit)
 *   - `authLimiter`      — stricter limit for login/register mutations
 *     (prevents brute-force credential attacks)
 *
 * No external dependencies — uses an in-process Map. For multi-instance
 * deployments, replace the Map with a Redis-backed store (e.g. ioredis +
 * a sliding-window script) so limits are enforced across all instances.
 */
import { Request, Response, NextFunction } from 'express';

interface BucketEntry {
  count: number;
  resetAt: number;
}

interface RateLimiterOptions {
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum requests allowed per window per IP */
  maxRequests: number;
  /** Message returned in the 429 response */
  message?: string;
}

function createRateLimiter(options: RateLimiterOptions) {
  const { windowMs, maxRequests, message = 'Too many requests, please try again later.' } = options;
  const store = new Map<string, BucketEntry>();

  // Prune expired entries every window to prevent unbounded memory growth
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of store) {
      if (entry.resetAt <= now) store.delete(ip);
    }
  }, windowMs);

  return function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim()
      ?? req.socket.remoteAddress
      ?? 'unknown';

    const now = Date.now();
    const entry = store.get(ip);

    if (!entry || entry.resetAt <= now) {
      // New window
      store.set(ip, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (entry.count >= maxRequests) {
      const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfterSec));
      res.setHeader('X-RateLimit-Limit', String(maxRequests));
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));
      res.status(429).json({ errors: [{ message }] });
      return;
    }

    entry.count++;
    res.setHeader('X-RateLimit-Limit', String(maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(maxRequests - entry.count));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));
    next();
  };
}

/** General-purpose limiter: 120 requests per minute per IP */
export const defaultLimiter = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 120,
});

/** Strict limiter for auth operations: 10 attempts per 15 minutes per IP */
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60_000,
  maxRequests: 10,
  message: 'Too many authentication attempts, please try again in 15 minutes.',
});
