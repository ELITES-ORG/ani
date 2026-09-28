import { z } from 'zod';

export const reviewBody = z.discriminatedUnion('decision', [
  z.object({ decision: z.literal('approve') }),
  z.object({
    decision: z.literal('reject'),
    // The person reads this and acts on it. Say what to fix.
    note: z.string().trim().min(3).max(300),
  }),
]);

export const pendingQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
