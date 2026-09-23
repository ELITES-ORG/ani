import type { RequestHandler } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../db/schema/index.js';
import { AppError } from '../lib/http-error.js';

/**
 * Requires a signed-in account and loads it onto the request.
 *
 * Suspension is checked per request rather than at sign-in, so suspending an
 * account takes effect on its next call instead of whenever its session
 * happens to expire.
 */
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const userId = req.session.userId;
  if (!userId) {
    next(AppError.unauthorized());
    return;
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });

  if (!user) {
    // The account was deleted while the session lived on.
    req.session.destroy(() => {});
    next(AppError.unauthorized());
    return;
  }

  if (user.suspendedAt) {
    next(AppError.forbidden('This account is suspended.'));
    return;
  }

  req.user = user;
  next();
};

export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (!req.user?.isAdmin) {
    next(AppError.forbidden());
    return;
  }
  next();
};
