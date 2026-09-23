import { pgTable, text, timestamp, uuid, boolean, index } from 'drizzle-orm/pg-core';

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

    fullName: text('full_name').notNull(),
    // Mobile number in +63 form. The primary way people reach each other here.
    phone: text('phone').notNull(),
    email: text('email'),

    isAdmin: boolean('is_admin').notNull().default(false),
    suspendedAt: timestamp('suspended_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('users_phone_idx').on(table.phone)],
);
