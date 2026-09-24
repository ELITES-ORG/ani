import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { barangays, municipalities, users, vendors } from '../../db/schema/index.js';
import { AppError } from '../../lib/http-error.js';
import { resolveMunicipalityBarangay } from '../../lib/geography.js';
import { hashPassword, verifyPassword } from '../../lib/password.js';
import { composeFullName } from '../../lib/name.js';
import type { CurrentUser } from '../../contracts/me.js';

type UserRow = typeof users.$inferSelect;

export interface RegisterInput {
  username: string;
  password: string;
  firstName: string;
  middleName?: string | undefined;
  lastName: string;
  suffix?: string | undefined;
  municipalitySlug: string;
  barangaySlug: string;
  addressDetail: string;
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

  const { municipality, barangay } = await resolveMunicipalityBarangay(
    input.municipalitySlug,
    input.barangaySlug,
  );

  const [created] = await db
    .insert(users)
    .values({
      username: input.username,
      passwordHash: await hashPassword(input.password),
      firstName: input.firstName,
      middleName: input.middleName ?? null,
      lastName: input.lastName,
      suffix: input.suffix ?? null,
      municipalityId: municipality.id,
      barangayId: barangay.id,
      addressDetail: input.addressDetail,
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

  let home: CurrentUser['home'] = null;
  if (
    user.municipalityId !== null &&
    user.barangayId !== null &&
    user.addressDetail !== null
  ) {
    const [municipality, barangay] = await Promise.all([
      db.query.municipalities.findFirst({ where: eq(municipalities.id, user.municipalityId) }),
      db.query.barangays.findFirst({ where: eq(barangays.id, user.barangayId) }),
    ]);
    if (municipality && barangay) {
      home = {
        municipality: municipality.name,
        barangay: barangay.name,
        addressDetail: user.addressDetail,
      };
    }
  }

  return {
    id: user.id,
    username: user.username,
    fullName: composeFullName({
      firstName: user.firstName,
      lastName: user.lastName,
      suffix: user.suffix,
    }),
    name: {
      first: user.firstName,
      middle: user.middleName,
      last: user.lastName,
      suffix: user.suffix,
    },
    phone: user.phone,
    home,
    isAdmin: user.isAdmin,
    vendor: vendor ? { id: vendor.id, farmName: vendor.farmName, status: vendor.status } : null,
  };
}
