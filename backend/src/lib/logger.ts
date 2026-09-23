import pino from 'pino';
import { env, isDevelopment } from '../config/env.js';

export const logger = pino({
  level: env.LOG_LEVEL,
  // Pretty output locally; newline-delimited JSON in production, which is what
  // Render's log drain expects.
  ...(isDevelopment && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
    },
  }),
});
