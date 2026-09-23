import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

/**
 * Migrations are generated and committed, never pushed straight to a database.
 * See docs/decisions/0004-migrations-over-db-push.md.
 */
export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
  strict: true,
  verbose: true,
});
