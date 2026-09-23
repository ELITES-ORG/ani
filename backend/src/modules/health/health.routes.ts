import { Router } from 'express';
import { sql } from '../../db/index.js';

export const healthRouter: Router = Router();

/**
 * Liveness and database reachability.
 *
 * Also the target for the keep-awake ping: Render's free tier sleeps a service
 * after 15 minutes idle and the next real request then waits about a minute.
 */
healthRouter.get('/', async (_req, res) => {
  let database: 'up' | 'down' = 'up';
  try {
    await sql`select 1`;
  } catch {
    database = 'down';
  }

  res.status(database === 'up' ? 200 : 503).json({
    data: { status: database === 'up' ? 'ok' : 'degraded', database, uptime: process.uptime() },
  });
});
