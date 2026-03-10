import  app  from './app';
import { queryClient } from './config/db';
import { env } from './config/env';
import { redis } from './config/redis';
import { logger } from './lib/logger';

const server = app.listen(env.PORT, async () => {
	logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Server started');
	try {
		await queryClient`SELECT 1`;
		logger.info('DB pool warmed');
	} catch (err) {
		logger.warn({ err }, 'DB warmup failed — first request may be slow');
	}
});

async function shutdown(signal: string) {
	logger.info({ signal }, 'Shutdown signal received');

	await new Promise<void>((resolve) => server.close(() => resolve()));
	await queryClient.end({ timeout: 5 });
	redis.disconnect();

	logger.info('Shutdown complete');
	process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
	logger.fatal({ reason }, 'Unhandled rejection — shutting down');
	process.exit(1);
});

process.on('uncaughtException', (err) => {
	logger.fatal({ err }, 'Uncaught exception — shutting down');
	process.exit(1);
});
