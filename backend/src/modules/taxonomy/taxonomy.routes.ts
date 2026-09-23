import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { barangays, municipalities } from '../../db/schema/index.js';
import { AppError } from '../../lib/http-error.js';
import type { Barangay, Municipality } from '../../contracts/taxonomy.js';

export const taxonomyRouter: Router = Router();

/** Reference data. The frontend caches this with staleTime: Infinity. */
taxonomyRouter.get('/municipalities', async (_req, res) => {
  const data: Municipality[] = await db
    .select({ id: municipalities.id, slug: municipalities.slug, name: municipalities.name })
    .from(municipalities)
    .orderBy(municipalities.name);

  res.json({ data });
});

taxonomyRouter.get('/municipalities/:slug/barangays', async (req, res) => {
  const municipality = await db.query.municipalities.findFirst({
    where: eq(municipalities.slug, req.params.slug),
  });

  if (!municipality) {
    throw AppError.notFound(`No municipality with slug "${req.params.slug}"`);
  }

  const data: Barangay[] = await db
    .select({
      id: barangays.id,
      slug: barangays.slug,
      name: barangays.name,
      municipalityId: barangays.municipalityId,
    })
    .from(barangays)
    .where(eq(barangays.municipalityId, municipality.id))
    .orderBy(barangays.name);

  res.json({ data });
});
