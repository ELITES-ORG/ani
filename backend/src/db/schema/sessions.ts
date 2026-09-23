import { pgTable, text, timestamp, index } from 'drizzle-orm/pg-core';

/**
 * Server-side session store.
 *
 * Postgres-backed rather than Redis: the API already has a database, and at
 * this scale a table of live sessions is a rounding error. One fewer service
 * to run, and one fewer free tier to outgrow.
 */
export const sessions = pgTable(
  'sessions',
  {
    sid: text('sid').primaryKey(),
    data: text('data').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => [index('sessions_expires_idx').on(table.expiresAt)],
);
