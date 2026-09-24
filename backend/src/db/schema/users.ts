import { pgTable, text, timestamp, uuid, boolean, index } from 'drizzle-orm/pg-core';
import { barangays, municipalities } from './geography.js';

/**
 * One account per person.
 *
 * A buyer and a seller are the same kind of account — selling is a role added
 * to an existing account, not a separate signup. In a farming province the
 * same household routinely does both.
 */
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Lowercased at write time so "JuanCruz" and "juancruz" collide.
    username: text('username').notNull().unique(),
    passwordHash: text('password_hash').notNull(),

    // Parts rather than a single full_name: a farm needs to know who is
    // collecting, and "first last" is how a name is said out loud here.
    // middle_name is often the mother's maiden surname.
    firstName: text('first_name').notNull(),
    middleName: text('middle_name'),
    lastName: text('last_name').notNull(),
    suffix: text('suffix'),

    // Mobile number in +63 form. The primary way people reach each other here.
    phone: text('phone').notNull(),
    email: text('email'),

    // Home address — personal data, returned only on CurrentUser. Stays
    // nullable forever for accounts that predate collecting it.
    municipalityId: uuid('municipality_id').references(() => municipalities.id),
    barangayId: uuid('barangay_id').references(() => barangays.id),
    addressDetail: text('address_detail'),

    isAdmin: boolean('is_admin').notNull().default(false),
    suspendedAt: timestamp('suspended_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('users_phone_idx').on(table.phone)],
);
