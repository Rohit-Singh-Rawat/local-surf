import { sql } from 'drizzle-orm';
import type { Request, Response } from 'express';
import { db } from '../../config/db';
import { redis } from '../../config/redis';
import { success } from '../../lib/api-response';

export class HealthController {
  check = async (_req: Request, res: Response) => {
    const [dbResult, redisResult] = await Promise.allSettled([
      db.execute(sql`SELECT 1`),
      redis.ping(),
    ]);

    const isDbUp = dbResult.status === 'fulfilled';
    const isRedisUp = redisResult.status === 'fulfilled';
    const healthy = isDbUp && isRedisUp;

    res.status(healthy ? 200 : 503).json(
      success({
        status: healthy ? 'healthy' : 'degraded',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        services: {
          database: isDbUp ? 'connected' : 'disconnected',
          redis: isRedisUp ? 'connected' : 'disconnected',
        },
      }),
    );
  };
}
