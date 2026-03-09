import type { RequestHandler } from 'express';
import { env } from '../config/env';
import { logger } from '../lib/logger';

const isDev = env.NODE_ENV === 'development';

const SENSITIVE_KEYS = new Set(['password', 'token', 'secret', 'authorization', 'refreshToken']);

function sanitiseBody(body: unknown): unknown {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return body;
  return Object.fromEntries(
    Object.entries(body as Record<string, unknown>).map(([k, v]) => [
      k,
      SENSITIVE_KEYS.has(k.toLowerCase()) ? '[redacted]' : v,
    ]),
  );
}

export const requestLogger: RequestHandler = (req, res, next) => {
  if (!isDev) return next();

  const start = process.hrtime.bigint();
  const hitAt = new Date();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;

    logger.info(
      {
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode: res.statusCode,
        durationMs: Math.round(durationMs * 100) / 100,
        hitAt: hitAt.toISOString(),
        ip: req.ip,
        userAgent: req.get('user-agent'),
        body: sanitiseBody(req.body),
      },
      'HTTP request',
    );
  });

  next();
};

