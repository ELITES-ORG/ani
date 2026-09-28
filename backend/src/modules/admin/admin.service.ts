import { and, asc, count, eq, inArray } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { barangays, municipalities, users, vendors } from '../../db/schema/index.js';
import { AppError } from '../../lib/http-error.js';
import { composeFullName } from '../../lib/name.js';
import type { PendingAccount, PendingFarm, ReviewResult } from '../../contracts/admin.js';
import type { ListMeta } from '../../contracts/pagination.js';

/** What an admin decided. `note` is the reason on a rejection, required there. */
export type ReviewInput = { decision: 'approve' } | { decision: 'reject'; note: string };

function outcome(input: ReviewInput) {
  return input.decision === 'approve'
    ? { next: 'approved' as const, note: null }
    : { next: 'rejected' as const, note: input.note };
}

/**
 * Accounts waiting for review, oldest first: first come, first served, so
 * nobody waits longer because they registered on a busy day.
 *
 * Carries the applicant's home address. Admins only (ADR 0020).
 */
export async function listPendingAccounts(
  page: number,
  limit: number,
): Promise<{ data: PendingAccount[]; meta: ListMeta }> {
  const where = eq(users.approvalStatus, 'pending');

  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      firstName: users.firstName,
      lastName: users.lastName,
      suffix: users.suffix,
      phone: users.phone,
      email: users.email,
      addressDetail: users.addressDetail,
      municipality: municipalities.name,
      barangay: barangays.name,
      createdAt: users.createdAt,
    })
    .from(users)
    // Left joins: an account that predates collecting an address has none.
    .leftJoin(municipalities, eq(users.municipalityId, municipalities.id))
    .leftJoin(barangays, eq(users.barangayId, barangays.id))
    .where(where)
    .orderBy(asc(users.createdAt), asc(users.id))
    .limit(limit)
    .offset((page - 1) * limit);

  const [totals] = await db.select({ total: count() }).from(users).where(where);

  const data = rows.map(
    (row): PendingAccount => ({
      id: row.id,
      username: row.username,
      fullName: composeFullName(row),
      phone: row.phone,
      email: row.email,
      home:
        row.municipality !== null && row.barangay !== null && row.addressDetail !== null
          ? {
              municipality: row.municipality,
              barangay: row.barangay,
              addressDetail: row.addressDetail,
            }
          : null,
      registeredAt: row.createdAt.toISOString(),
    }),
  );

  return { data, meta: { page, limit, total: totals?.total ?? 0 } };
}

/** Farms waiting for review, oldest first, with who is behind each. */
export async function listPendingFarms(
  page: number,
  limit: number,
): Promise<{ data: PendingFarm[]; meta: ListMeta }> {
  const where = eq(vendors.status, 'pending');

  const rows = await db
    .select({
      id: vendors.id,
      farmName: vendors.farmName,
      description: vendors.description,
      landmark: vendors.landmark,
      registeredAt: vendors.registeredAt,
      municipality: municipalities.name,
      barangay: barangays.name,
      ownerId: users.id,
      ownerUsername: users.username,
      firstName: users.firstName,
      lastName: users.lastName,
      suffix: users.suffix,
      ownerPhone: users.phone,
      ownerApprovalStatus: users.approvalStatus,
    })
    .from(vendors)
    .innerJoin(municipalities, eq(vendors.municipalityId, municipalities.id))
    .innerJoin(barangays, eq(vendors.barangayId, barangays.id))
    .innerJoin(users, eq(vendors.userId, users.id))
    .where(where)
    .orderBy(asc(vendors.registeredAt), asc(vendors.id))
    .limit(limit)
    .offset((page - 1) * limit);

  const [totals] = await db.select({ total: count() }).from(vendors).where(where);

  const data = rows.map(
    (row): PendingFarm => ({
      id: row.id,
      farmName: row.farmName,
      description: row.description,
      municipality: row.municipality,
      barangay: row.barangay,
      landmark: row.landmark,
      registeredAt: row.registeredAt.toISOString(),
      owner: {
        id: row.ownerId,
        username: row.ownerUsername,
        fullName: composeFullName(row),
        phone: row.ownerPhone,
        approvalStatus: row.ownerApprovalStatus,
      },
    }),
  );

  return { data, meta: { page, limit, total: totals?.total ?? 0 } };
}

/**
 * An admin approves an account, or rejects it with a reason the person reads.
 *
 * The legal moves are exactly `pending → approved` and `pending → rejected`.
 * `rejected → pending` happens only when the person corrects their details and
 * resubmits, never by an admin.
 *
 * One conditional update rather than a read then a write, so two admins
 * tapping at once cannot both succeed: the second finds no pending row.
 */
export async function reviewAccount(
  adminId: string,
  userId: string,
  input: ReviewInput,
): Promise<ReviewResult> {
  if (userId === adminId) {
    throw AppError.forbidden('You cannot review your own account.');
  }

  const { next, note } = outcome(input);
  const now = new Date();

  const [row] = await db
    .update(users)
    .set({
      approvalStatus: next,
      reviewNote: note,
      reviewedAt: now,
      reviewedBy: adminId,
      updatedAt: now,
    })
    .where(and(eq(users.id, userId), eq(users.approvalStatus, 'pending')))
    .returning({ id: users.id });

  if (!row) {
    // Tell apart "no such person" from "already reviewed".
    const exists = await db.query.users.findFirst({ where: eq(users.id, userId) });
    if (!exists) throw AppError.notFound('No account with that id.');
    throw AppError.conflict('This account has already been reviewed.');
  }

  return { id: row.id, status: next, reviewedAt: now.toISOString() };
}

/**
 * An admin approves a farm, or rejects it with a reason its owner reads.
 *
 * Same legal moves and the same single conditional update as
 * `reviewAccount`. Only an approved farm's listings reach the catalogue
 * (ADR 0011); a rejected farm is not suspended, and its owner can fix it.
 *
 * The account is reviewed first (ADR 0020): approving needs the owner's
 * account approved, checked inside the same update. Rejecting does not.
 */
export async function reviewFarm(
  adminId: string,
  vendorId: string,
  input: ReviewInput,
): Promise<ReviewResult> {
  const { next, note } = outcome(input);
  const now = new Date();

  const filters = [eq(vendors.id, vendorId), eq(vendors.status, 'pending')];
  if (next === 'approved') {
    filters.push(
      inArray(
        vendors.userId,
        db.select({ id: users.id }).from(users).where(eq(users.approvalStatus, 'approved')),
      ),
    );
  }

  const [row] = await db
    .update(vendors)
    .set({
      status: next,
      reviewNote: note,
      reviewedAt: now,
      reviewedBy: adminId,
      updatedAt: now,
    })
    .where(and(...filters))
    .returning({ id: vendors.id });

  if (!row) {
    const farm = await db.query.vendors.findFirst({ where: eq(vendors.id, vendorId) });
    if (!farm) throw AppError.notFound('No farm with that id.');
    if (farm.status !== 'pending') throw AppError.conflict('This farm has already been reviewed.');
    throw AppError.conflict("Approve the owner's account before their farm.");
  }

  return { id: row.id, status: next, reviewedAt: now.toISOString() };
}
