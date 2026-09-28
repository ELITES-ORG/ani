import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth.js';
import { writeLimiter } from '../../middleware/rate-limit.js';
import { updateDetailsBody } from '../auth/auth.schema.js';
import { currentUser, updateOwnDetails } from '../auth/auth.service.js';

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

/** Correct your details while pending, or resubmit them after a rejection (ADR 0020). */
meRouter.patch('/', requireAuth, writeLimiter, async (req, res) => {
  const body = updateDetailsBody.parse(req.body);
  const updated = await updateOwnDetails(req.user!, body);
  res.json({ data: await currentUser(updated) });
});
