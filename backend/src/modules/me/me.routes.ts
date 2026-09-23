import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth.js';
import { currentUser } from '../auth/auth.service.js';

export const meRouter: Router = Router();

/**
 * Who the caller is, and whether they have a farm.
 *
 * Every authenticated screen loads this once and branches on `vendor`, rather
 * than each one asking separately.
 */
meRouter.get('/', requireAuth, async (req, res) => {
  res.json({ data: await currentUser(req.user!) });
});
