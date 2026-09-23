import type { users } from '../db/schema/index.js';

type UserRow = typeof users.$inferSelect;

declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      /** Set by requireAuth. Absent on public routes. */
      user?: UserRow;
    }
  }
}

export {};
