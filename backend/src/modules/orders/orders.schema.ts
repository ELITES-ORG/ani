import { z } from 'zod';

const STATUSES = [
  'pending',
  'confirmed',
  'ready',
  'out_for_delivery',
  'completed',
  'cancelled',
] as const;

export const placeOrderBody = z
  .object({
    items: z
      .array(
        z.object({
          productId: z.string().uuid(),
          amount: z.number().positive().max(100_000),
        }),
      )
      .min(1, 'An order needs at least one item'),
    fulfillment: z.enum(['pickup', 'delivery']),
    deliveryMunicipalitySlug: z.string().trim().min(1).optional(),
    deliveryBarangaySlug: z.string().trim().min(1).optional(),
    deliveryLandmark: z.string().trim().max(200).optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .refine(
    (body) =>
      body.fulfillment !== 'delivery' ||
      (body.deliveryMunicipalitySlug !== undefined && body.deliveryBarangaySlug !== undefined),
    { message: 'A delivery order needs a barangay and municipality', path: ['deliveryBarangaySlug'] },
  );

export const listOrdersQuery = z.object({
  status: z.enum(STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const updateStatusBody = z.object({
  status: z.enum(STATUSES),
});
