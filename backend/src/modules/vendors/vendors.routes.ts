import { Router } from 'express';
import { requireAuth } from '../../middleware/require-auth.js';
import { writeLimiter } from '../../middleware/rate-limit.js';
import { listVendorsQuery, registerVendorBody } from './vendors.schema.js';
import { listApprovedVendors, registerVendor } from './vendors.service.js';

export const vendorsRouter: Router = Router();

/** Public list of approved farms. */
vendorsRouter.get('/', async (req, res) => {
  const { municipality, page, limit } = listVendorsQuery.parse(req.query);
  const { data, meta } = await listApprovedVendors(municipality, page, limit);
  res.json({ data, meta });
});

/** MVP 2 — register the signed-in account as a vendor. */
vendorsRouter.post('/register', requireAuth, writeLimiter, async (req, res) => {
  const body = registerVendorBody.parse(req.body);
  res.status(201).json({ data: await registerVendor(req.user!.id, body) });
});
