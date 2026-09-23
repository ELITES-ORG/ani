import { Store, type SessionData } from 'express-session';
import { eq, lt } from 'drizzle-orm';
import { db } from '../db/index.js';
import { sessions } from '../db/schema/index.js';
import { logger } from './logger.js';

/**
 * express-session store backed by the sessions table.
 *
 * Expired rows are swept periodically rather than on read: a sweep on every
 * request would add a write to each authenticated call for no benefit.
 */
export class DrizzleSessionStore extends Store {
  private readonly sweepIntervalMs: number;

  constructor(sweepIntervalMs = 60 * 60 * 1000) {
    super();
    this.sweepIntervalMs = sweepIntervalMs;
    const timer = setInterval(() => void this.sweep(), this.sweepIntervalMs);
    timer.unref();
  }

  override get(
    sid: string,
    callback: (err?: unknown, session?: SessionData | null) => void,
  ): void {
    void (async () => {
      try {
        const row = await db.query.sessions.findFirst({ where: eq(sessions.sid, sid) });
        if (!row) return callback(null, null);
        if (row.expiresAt.getTime() < Date.now()) {
          await db.delete(sessions).where(eq(sessions.sid, sid));
          return callback(null, null);
        }
        callback(null, JSON.parse(row.data) as SessionData);
      } catch (error) {
        callback(error);
      }
    })();
  }

  override set(sid: string, session: SessionData, callback?: (err?: unknown) => void): void {
    void (async () => {
      try {
        const expiresAt = session.cookie.expires ?? new Date(Date.now() + 24 * 60 * 60 * 1000);
        const data = JSON.stringify(session);
        await db
          .insert(sessions)
          .values({ sid, data, expiresAt })
          .onConflictDoUpdate({ target: sessions.sid, set: { data, expiresAt } });
        callback?.();
      } catch (error) {
        callback?.(error);
      }
    })();
  }

  override destroy(sid: string, callback?: (err?: unknown) => void): void {
    void (async () => {
      try {
        await db.delete(sessions).where(eq(sessions.sid, sid));
        callback?.();
      } catch (error) {
        callback?.(error);
      }
    })();
  }

  override touch(sid: string, session: SessionData, callback?: () => void): void {
    void (async () => {
      try {
        const expiresAt = session.cookie.expires ?? new Date(Date.now() + 24 * 60 * 60 * 1000);
        await db.update(sessions).set({ expiresAt }).where(eq(sessions.sid, sid));
      } catch (error) {
        logger.warn({ err: error }, 'Failed to touch session');
      }
      callback?.();
    })();
  }

  private async sweep(): Promise<void> {
    try {
      await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
    } catch (error) {
      logger.warn({ err: error }, 'Session sweep failed');
    }
  }
}
