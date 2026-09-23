import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { closeDatabase } from './db/index.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`Ani API listening on http://localhost:${env.PORT} [${env.NODE_ENV}]`);

  // Loud, because the symptom otherwise is "photo upload silently does nothing".
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    logger.warn(
      'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set — product photo upload is disabled. Everything else works.',
    );
  }
});

/**
 * Stop accepting new connections, let in-flight requests finish, then release
 * the Postgres pool. The 10s ceiling keeps a stuck request from blocking a
 * deploy indefinitely.
 */
async function shutdown(signal: string): Promise<void> {
  logger.info(`${signal} received, shutting down`);

  const forceExit = setTimeout(() => {
    logger.error('Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, 10_000);
  forceExit.unref();

  server.close(async () => {
    try {
      await closeDatabase();
      logger.info('Shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error({ err: error }, 'Error during shutdown');
      process.exit(1);
    }
  });
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'Unhandled promise rejection');
  process.exit(1);
});
