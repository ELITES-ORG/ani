import { and, count, eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { barangays, municipalities, vendors } from '../../db/schema/index.js';
import { AppError } from '../../lib/http-error.js';
import type { VendorDetail, VendorSummary } from '../../contracts/vendors.js';
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

  const municipality = await db.query.municipalities.findFirst({
    where: eq(municipalities.slug, input.municipalitySlug),
  });
  if (!municipality) {
    throw AppError.badRequest(`Unknown municipality "${input.municipalitySlug}"`);
  }

  const barangay = await db.query.barangays.findFirst({
    where: and(
      eq(barangays.slug, input.barangaySlug),
      eq(barangays.municipalityId, municipality.id),
    ),
  });
  if (!barangay) {
    throw AppError.badRequest(
      `Barangay "${input.barangaySlug}" is not in ${municipality.name}`,
    );
  }

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
