import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { redis } from '../config/redis';
import { RateLimitError } from '../lib/app-error';
import { logger } from '../lib/logger';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyPrefix: string;
  keyGenerator?: (req: Request) => string;
}

// Returns [count, pttl_ms] so we can emit X-RateLimit-Reset without a second round-trip.
const LUA_SCRIPT = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
local pttl = redis.call('PTTL', KEYS[1])
return {current, pttl}
`;

/**
 * Redis-based sliding window rate limiter.
 * Uses an atomic Lua script (INCR + conditional PEXPIRE) so the
 * window starts from the first request, not from a fixed clock.
 * Fails open — if Redis is unavailable, requests are allowed through
 * to avoid turning an infrastructure outage into a total service outage.
 */
export function rateLimit(options: RateLimitOptions): RequestHandler {
  const { windowMs, max, keyPrefix } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    const identity = options.keyGenerator?.(req) ?? req.ip ?? 'unknown';
    const key = `rl:${keyPrefix}:${identity}`;

    let current: number;
    let pttl: number;
    try {
      [current, pttl] = (await redis.eval(LUA_SCRIPT, 1, key, windowMs)) as [number, number];
    } catch (err) {
      logger.warn({ err, keyPrefix }, 'Rate limiter Redis error — failing open');
      return next();
    }

    const resetEpochSec = Math.ceil((Date.now() + Math.max(pttl, 0)) / 1000);
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - current));
    res.setHeader('X-RateLimit-Reset', resetEpochSec);

    if (current > max) {
      throw new RateLimitError();
    }

    next();
  };
}
