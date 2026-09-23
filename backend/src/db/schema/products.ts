import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  numeric,
  boolean,
  index,
} from 'drizzle-orm/pg-core';
import { vendors } from './vendors.js';
import { productCategory, sellUnit } from './enums.js';

/** Something a vendor sells. Backs MVP 1 — customers browse and order. */
export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    vendorId: uuid('vendor_id')
      .notNull()
      .references(() => vendors.id, { onDelete: 'cascade' }),

    name: text('name').notNull(),
    description: text('description').notNull().default(''),
    category: productCategory('category').notNull(),

    // Integer centavos. See lib/money.ts for why this is never a float.
    priceCentavos: integer('price_centavos').notNull(),

    // Numeric, not integer: produce sells in fractional kilos. Zero is valid
    // and means sold out, which is why isListed is a separate flag.
    stockAmount: numeric('stock_amount', { precision: 12, scale: 3, mode: 'number' })
      .notNull()
      .default(0),
    unit: sellUnit('unit').notNull(),

    imageUrls: text('image_urls').array().notNull().default([]),

    // Vendor-controlled, independent of stock. A vendor between harvests
    // unlists rather than deleting the product and losing its history.
    isListed: boolean('is_listed').notNull().default(true),
    harvestedAt: timestamp('harvested_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('products_vendor_idx').on(table.vendorId),
    index('products_category_idx').on(table.category),
  ],
);
