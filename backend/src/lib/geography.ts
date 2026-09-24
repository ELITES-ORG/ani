import { and, eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { barangays, municipalities } from '../db/schema/index.js';
import { AppError } from './http-error.js';

type MunicipalityRow = typeof municipalities.$inferSelect;
type BarangayRow = typeof barangays.$inferSelect;

/**
 * Resolve municipality and barangay slugs to rows, checking the barangay
 * belongs to the municipality.
 *
 * Shared by vendor registration and account home address — a second copy of
 * this check would drift, and a mismatched pair is always a 400.
 */
export async function resolveMunicipalityBarangay(
  municipalitySlug: string,
  barangaySlug: string,
): Promise<{ municipality: MunicipalityRow; barangay: BarangayRow }> {
  const municipality = await db.query.municipalities.findFirst({
    where: eq(municipalities.slug, municipalitySlug),
  });
  if (!municipality) {
    throw AppError.badRequest(`Unknown municipality "${municipalitySlug}"`);
  }

  const barangay = await db.query.barangays.findFirst({
    where: and(
      eq(barangays.slug, barangaySlug),
      eq(barangays.municipalityId, municipality.id),
    ),
  });
  if (!barangay) {
    throw AppError.badRequest(
      `Barangay "${barangaySlug}" is not in ${municipality.name}`,
    );
  }

  return { municipality, barangay };
}
