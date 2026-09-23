import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { users, vendors } from '../../db/schema/index.js';
import { AppError } from '../../lib/http-error.js';
import { hashPassword, verifyPassword } from '../../lib/password.js';
import type { CurrentUser } from '../../contracts/me.js';

type UserRow = typeof users.$inferSelect;

export interface RegisterInput {
  username: string;
  password: string;
  fullName: string;
  phone: string;
  email?: string | undefined;
}

export async function registerUser(input: RegisterInput): Promise<UserRow> {
  const existing = await db.query.users.findFirst({
    where: eq(users.username, input.username),
  });
  if (existing) {
    throw AppError.conflict('That username is already taken.');
  }

  const [created] = await db
    .insert(users)
    .values({
      username: input.username,
      passwordHash: await hashPassword(input.password),
      fullName: input.fullName,
      phone: input.phone,
      email: input.email ?? null,
    })
    .returning();

  if (!created) {
    throw new Error('Insert returned no row');
  }
  return created;
}

export async function authenticate(username: string, password: string): Promise<UserRow> {
  const user = await db.query.users.findFirst({ where: eq(users.username, username) });

  // Same message either way: distinguishing "no such user" from "wrong
  // password" tells an attacker which usernames exist.
  const invalid = AppError.unauthorized('Incorrect username or password.');
  if (!user) throw invalid;
  if (!(await verifyPassword(user.passwordHash, password))) throw invalid;
  if (user.suspendedAt) throw AppError.forbidden('This account is suspended.');

  return user;
}

/** Builds the shape every authenticated screen reads on load. */
export async function currentUser(user: UserRow): Promise<CurrentUser> {
  const vendor = await db.query.vendors.findFirst({ where: eq(vendors.userId, user.id) });

  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    phone: user.phone,
    isAdmin: user.isAdmin,
    vendor: vendor ? { id: vendor.id, farmName: vendor.farmName, status: vendor.status } : null,
  };
}
