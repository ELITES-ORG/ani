import { Router } from 'express';
import { requireApprovedAccount, requireAuth } from '../../middleware/require-auth.js';
import { writeLimiter } from '../../middleware/rate-limit.js';
import { listVendorsQuery, registerVendorBody } from './vendors.schema.js';
import {
  getOwnFarm,
  listApprovedVendors,
  registerVendor,
  updateOwnFarm,
} from './vendors.service.js';

export const vendorsRouter: Router = Router();

/** Public list of approved farms. */
vendorsRouter.get('/', async (req, res) => {
  const { municipality, page, limit } = listVendorsQuery.parse(req.query);
  const { data, meta } = await listApprovedVendors(municipality, page, limit);
  res.json({ data, meta });
});

/** MVP 2 — register the signed-in account as a vendor. */
vendorsRouter.post('/register', requireAuth, requireApprovedAccount, writeLimiter, async (req, res) => {
  const body = registerVendorBody.parse(req.body);
  res.status(201).json({ data: await registerVendor(req.user!.id, body) });
});

/**
 * The caller's own farm, and fixing it while it is being checked.
 *
 * Declare these before any /:id route, so "mine" is not parsed as an id.
 */
vendorsRouter.get('/mine', requireAuth, async (req, res) => {
  res.json({ data: await getOwnFarm(req.user!.id) });
});

vendorsRouter.patch('/mine', requireAuth, requireApprovedAccount, writeLimiter, async (req, res) => {
  const body = registerVendorBody.parse(req.body);
  res.json({ data: await updateOwnFarm(req.user!.id, body) });
});
