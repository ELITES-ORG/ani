import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/require-auth.js';
import { writeLimiter } from '../../middleware/rate-limit.js';
import { createProductBody, listQuery } from './products.schema.js';
import { createProduct, getProduct, listProducts, listVendorProducts } from './products.service.js';

export const productsRouter: Router = Router();

const idParam = z.object({ id: z.string().uuid() });
const pageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/** MVP 1 — the public catalogue. Browsing needs no account. */
productsRouter.get('/', async (req, res) => {
  const query = listQuery.parse(req.query);
  const { data, meta } = await listProducts(query);
  res.json({ data, meta });
});

/**
 * The signed-in vendor's own listings.
 *
 * Declared before /:id so that "mine" is not parsed as a product id.
 */
productsRouter.get('/mine', requireAuth, async (req, res) => {
  const { page, limit } = pageQuery.parse(req.query);
  const { data, meta } = await listVendorProducts(req.user!.id, page, limit);
  res.json({ data, meta });
});

productsRouter.get('/:id', async (req, res) => {
  const { id } = idParam.parse(req.params);
  res.json({ data: await getProduct(id) });
});

/** MVP 2 — an approved vendor lists produce. */
productsRouter.post('/', requireAuth, writeLimiter, async (req, res) => {
  const body = createProductBody.parse(req.body);
  res.status(201).json({ data: await createProduct(req.user!.id, body) });
});
