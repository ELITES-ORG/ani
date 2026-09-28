import { Router } from 'express';
import { z } from 'zod';
import { requireAdmin, requireAuth } from '../../middleware/require-auth.js';
import { writeLimiter } from '../../middleware/rate-limit.js';
import { pendingQuery, reviewBody } from './admin.schema.js';
import {
  listPendingAccounts,
  listPendingFarms,
  reviewAccount,
  reviewFarm,
} from './admin.service.js';

/**
 * The approval queue (ADR 0020, ADR 0011). Every route is admin-only: the
 * queue carries applicants' phone numbers and home addresses.
 */
export const adminRouter: Router = Router();
adminRouter.use(requireAuth, requireAdmin);

const idParam = z.object({ id: z.string().uuid() });

/** Accounts waiting for review, oldest first. */
adminRouter.get('/accounts', async (req, res) => {
  const { page, limit } = pendingQuery.parse(req.query);
  const { data, meta } = await listPendingAccounts(page, limit);
  res.json({ data, meta });
});

adminRouter.patch('/accounts/:id/review', writeLimiter, async (req, res) => {
  const { id } = idParam.parse(req.params);
  const body = reviewBody.parse(req.body);
  res.json({ data: await reviewAccount(req.user!.id, id, body) });
});

/** Farms waiting for review, oldest first. */
adminRouter.get('/farms', async (req, res) => {
  const { page, limit } = pendingQuery.parse(req.query);
  const { data, meta } = await listPendingFarms(page, limit);
  res.json({ data, meta });
});

adminRouter.patch('/farms/:id/review', writeLimiter, async (req, res) => {
  const { id } = idParam.parse(req.params);
  const body = reviewBody.parse(req.body);
  res.json({ data: await reviewFarm(req.user!.id, id, body) });
});
