import { z } from 'zod';

export const registerVendorBody = z.object({
  farmName: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional(),
  municipalitySlug: z.string().trim().min(1),
  barangaySlug: z.string().trim().min(1),
  landmark: z.string().trim().max(200).optional(),
});

export const listVendorsQuery = z.object({
  municipality: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
