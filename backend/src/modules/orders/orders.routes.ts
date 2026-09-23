import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/require-auth.js';
import { writeLimiter } from '../../middleware/rate-limit.js';
import { listOrdersQuery, placeOrderBody, updateStatusBody } from './orders.schema.js';
import {
  getOrderForUser,
  listOrders,
  placeOrder,
  updateOrderStatus,
} from './orders.service.js';

export const ordersRouter: Router = Router();

const idParam = z.object({ id: z.string().uuid() });

/** MVP 1 — checkout. */
ordersRouter.post('/', requireAuth, writeLimiter, async (req, res) => {
  const body = placeOrderBody.parse(req.body);
  res.status(201).json({ data: await placeOrder(req.user!.id, body) });
});

/** The signed-in customer's own orders. */
ordersRouter.get('/', requireAuth, async (req, res) => {
  const { status, page, limit } = listOrdersQuery.parse(req.query);
  const { data, meta } = await listOrders(req.user!.id, 'customer', status, page, limit);
  res.json({ data, meta });
});

/**
 * MVP 2 — the farm's incoming queue.
 *
 * Declared before /:id so "received" is not parsed as an order id.
 */
ordersRouter.get('/received', requireAuth, async (req, res) => {
  const { status, page, limit } = listOrdersQuery.parse(req.query);
  const { data, meta } = await listOrders(req.user!.id, 'vendor', status, page, limit);
  res.json({ data, meta });
});

ordersRouter.get('/:id', requireAuth, async (req, res) => {
  const { id } = idParam.parse(req.params);
  res.json({ data: await getOrderForUser(req.user!.id, id) });
});

ordersRouter.patch('/:id/status', requireAuth, writeLimiter, async (req, res) => {
  const { id } = idParam.parse(req.params);
  const { status } = updateStatusBody.parse(req.body);
  res.json({ data: await updateOrderStatus(req.user!.id, id, status) });
});
