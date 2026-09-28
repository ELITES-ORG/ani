import { and, count, eq, inArray } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { barangays, municipalities, vendors } from '../../db/schema/index.js';
import { AppError } from '../../lib/http-error.js';
import { resolveMunicipalityBarangay } from '../../lib/geography.js';
import type { OwnFarm, VendorDetail, VendorSummary } from '../../contracts/vendors.js';
import type { ListMeta } from '../../contracts/pagination.js';

export interface RegisterVendorInput {
  farmName: string;
  description?: string | undefined;
  municipalitySlug: string;
  barangaySlug: string;
  landmark?: string | undefined;
}

/**
 * MVP 2 — an existing account registers a farm.
 *
 * The vendor starts `pending`. Nothing they list reaches the catalogue until
 * an admin approves them, because every published listing sits under Ani's
 * name and there is no institution absorbing that risk.
 */
export async function registerVendor(
  userId: string,
  input: RegisterVendorInput,
): Promise<VendorDetail> {
  const existing = await db.query.vendors.findFirst({ where: eq(vendors.userId, userId) });
  if (existing) {
    throw AppError.conflict('This account already has a farm registered.');
  }

  const { municipality, barangay } = await resolveMunicipalityBarangay(
    input.municipalitySlug,
    input.barangaySlug,
  );

  const [created] = await db
    .insert(vendors)
    .values({
      userId,
      farmName: input.farmName,
      description: input.description ?? null,
      municipalityId: municipality.id,
      barangayId: barangay.id,
      landmark: input.landmark ?? null,
    })
    .returning();

  if (!created) {
    throw new Error('Insert returned no row');
  }

  return {
    id: created.id,
    farmName: created.farmName,
    municipality: municipality.name,
    barangay: barangay.name,
    description: created.description,
    landmark: created.landmark,
    status: created.status,
    registeredAt: created.registeredAt.toISOString(),
  };
}

type VendorRow = typeof vendors.$inferSelect;

async function toOwnFarm(row: VendorRow): Promise<OwnFarm> {
  const [municipality, barangay] = await Promise.all([
    db.query.municipalities.findFirst({ where: eq(municipalities.id, row.municipalityId) }),
    db.query.barangays.findFirst({ where: eq(barangays.id, row.barangayId) }),
  ]);
  if (!municipality || !barangay) {
    throw new Error(`Farm ${row.id} points at missing geography`);
  }
  return {
    id: row.id,
    farmName: row.farmName,
    municipality: municipality.name,
    municipalitySlug: municipality.slug,
    barangay: barangay.name,
    barangaySlug: barangay.slug,
    description: row.description,
    landmark: row.landmark,
    status: row.status,
    registeredAt: row.registeredAt.toISOString(),
    reviewNote: row.reviewNote,
  };
}

/** The caller's own farm, whatever its status. */
export async function getOwnFarm(userId: string): Promise<OwnFarm> {
  const row = await db.query.vendors.findFirst({ where: eq(vendors.userId, userId) });
  if (!row) throw AppError.notFound('You have not registered a farm.');
  return toOwnFarm(row);
}

/**
 * The owner corrects their farm while it is being checked, or resubmits it
 * after a rejection (ADR 0011).
 *
 * Only while `pending` or `rejected`: an approved farm's details are what
 * buyers already see. A rejected farm goes back to `pending` with the old
 * reason cleared. The status is part of the update's condition, so an
 * approval landing at the same moment is never overwritten.
 */
export async function updateOwnFarm(userId: string, input: RegisterVendorInput): Promise<OwnFarm> {
  const existing = await db.query.vendors.findFirst({ where: eq(vendors.userId, userId) });
  if (!existing) throw AppError.notFound('You have not registered a farm.');

  const cannot = AppError.conflict('Your farm details cannot be changed here.');
  if (existing.status !== 'pending' && existing.status !== 'rejected') throw cannot;

  const { municipality, barangay } = await resolveMunicipalityBarangay(
    input.municipalitySlug,
    input.barangaySlug,
  );

  const [updated] = await db
    .update(vendors)
    .set({
      farmName: input.farmName,
      description: input.description ?? null,
      municipalityId: municipality.id,
      barangayId: barangay.id,
      landmark: input.landmark ?? null,
      status: 'pending',
      reviewNote: null,
      updatedAt: new Date(),
    })
    .where(and(eq(vendors.id, existing.id), inArray(vendors.status, ['pending', 'rejected'])))
    .returning();

  if (!updated) throw cannot;
  return toOwnFarm(updated);
}

export async function listApprovedVendors(
  municipalitySlug: string | undefined,
  page: number,
  limit: number,
): Promise<{ data: VendorSummary[]; meta: ListMeta }> {
  const filters = [eq(vendors.status, 'approved')];
  if (municipalitySlug) {
    filters.push(eq(municipalities.slug, municipalitySlug));
  }
  const where = and(...filters);

  const rows = await db
    .select({
      id: vendors.id,
      farmName: vendors.farmName,
      municipality: municipalities.name,
      barangay: barangays.name,
    })
    .from(vendors)
    .innerJoin(municipalities, eq(vendors.municipalityId, municipalities.id))
    .innerJoin(barangays, eq(vendors.barangayId, barangays.id))
    .where(where)
    .orderBy(vendors.farmName)
    .limit(limit)
    .offset((page - 1) * limit);

  const [totals] = await db
    .select({ total: count() })
    .from(vendors)
    .innerJoin(municipalities, eq(vendors.municipalityId, municipalities.id))
    .where(where);

  return { data: rows, meta: { page, limit, total: totals?.total ?? 0 } };
}
