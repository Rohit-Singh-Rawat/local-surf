import Redis from 'ioredis';
import { logger } from '../lib/logger';
import { env } from './env';

export const redis = new Redis(env.REDIS_URL, {
	maxRetriesPerRequest: 3,
	retryStrategy(times) {
		if (times > 5) {
			logger.fatal('Redis: max retry attempts reached, giving up');
			return null;
		}
		return Math.min(times * 200, 2000);
	},
});

redis.on('error', (err) => logger.error({ err }, 'Redis connection error'));
redis.on('connect', () => logger.info('Redis connected'));
