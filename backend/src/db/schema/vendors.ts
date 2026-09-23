import { pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { barangays, municipalities } from './geography.js';
import { vendorStatus } from './enums.js';

/**
 * A farm selling on Ani. Backs MVP 2 — customers register as vendors.
 *
 * One vendor per user account: a person sells as themselves or as their farm,
 * never as two storefronts.
 */
export const vendors = pgTable(
  'vendors',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),

    farmName: text('farm_name').notNull(),
    description: text('description'),

    municipalityId: uuid('municipality_id')
      .notNull()
      .references(() => municipalities.id),
    barangayId: uuid('barangay_id')
      .notNull()
      .references(() => barangays.id),
    landmark: text('landmark'),

    status: vendorStatus('status').notNull().default('pending'),

    registeredAt: timestamp('registered_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('vendors_status_idx').on(table.status),
    index('vendors_municipality_idx').on(table.municipalityId),
  ],
);
