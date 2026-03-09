import { app } from './app';
import { queryClient } from './config/db';
import { env } from './config/env';
import { redis } from './config/redis';
import { logger } from './lib/logger';

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Server started');
});

async function shutdown(signal: string) {
  logger.info({ signal }, 'Shutdown signal received');

  server.close();
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
