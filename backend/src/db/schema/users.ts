import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  index,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { barangays, municipalities } from './geography.js';
import { accountApprovalStatus } from './enums.js';

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

    // Every account is seen by an admin before it can order or sell, so a
    // farm never harvests for a fake order (ADR 0020). Accounts that predate
    // review were approved by the migration that added this.
    approvalStatus: accountApprovalStatus('approval_status').notNull().default('pending'),
    // The admin's reason for rejecting, shown to the person so they can fix
    // it. Cleared when they resubmit. Only the latest decision is kept.
    reviewNote: text('review_note'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    // Kept as null if that admin's account is ever deleted: the decision
    // stands even when the reviewer is gone.
    reviewedBy: uuid('reviewed_by').references((): AnyPgColumn => users.id, {
      onDelete: 'set null',
    }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('users_phone_idx').on(table.phone),
    index('users_approval_status_idx').on(table.approvalStatus),
  ],
);
