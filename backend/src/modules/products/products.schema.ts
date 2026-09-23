import { z } from 'zod';

const CATEGORIES = [
  'vegetables',
  'fruits',
  'rice_and_grains',
  'seafood',
  'meat_and_poultry',
  'dairy_and_eggs',
  'herbs_and_spices',
  'processed',
] as const;

const UNITS = ['kg', 'gram', 'piece', 'bundle', 'sack', 'tray', 'liter'] as const;

export const listQuery = z.object({
  category: z.enum(CATEGORIES).optional(),
  municipality: z.string().trim().min(1).optional(),
  vendorId: z.string().uuid().optional(),
  search: z.string().trim().min(1).max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  // Always capped. An uncapped page size is a denial-of-service vector and an
  // accidental full-table scan.
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const createProductBody = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).default(''),
  category: z.enum(CATEGORIES),
  pricePesos: z.number().positive().max(1_000_000),
  stockAmount: z.number().nonnegative().max(1_000_000),
  unit: z.enum(UNITS),
  imageUrls: z.array(z.string().url()).max(6).default([]),
  harvestedAt: z.coerce.date().optional(),
});

export const updateProductBody = createProductBody.partial().extend({
  isListed: z.boolean().optional(),
});
