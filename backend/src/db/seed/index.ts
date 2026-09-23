import { eq } from 'drizzle-orm';
import { closeDatabase, db } from '../index.js';
import { barangays, municipalities } from '../schema/index.js';
import { logger } from '../../lib/logger.js';
import { BARANGAYS, MUNICIPALITIES } from './geography-data.js';

/**
 * Seeds reference data. Idempotent: safe to run against a database that
 * already has some of it, which is what makes it usable after a migration
 * rather than only on a fresh database.
 */
async function seed(): Promise<void> {
  for (const entry of MUNICIPALITIES) {
    const [row] = await db
      .insert(municipalities)
      .values(entry)
      .onConflictDoUpdate({ target: municipalities.slug, set: { name: entry.name } })
      .returning({ id: municipalities.id });

    const municipalityId =
      row?.id ??
      (await db.query.municipalities.findFirst({ where: eq(municipalities.slug, entry.slug) }))?.id;

    if (!municipalityId) {
      throw new Error(`Could not resolve municipality "${entry.slug}"`);
    }

    const children = BARANGAYS[entry.slug] ?? [];
    for (const barangay of children) {
      await db
        .insert(barangays)
        .values({ municipalityId, slug: barangay.slug, name: barangay.name })
        .onConflictDoNothing();
    }

    logger.info(`Seeded ${entry.name} with ${children.length} barangays`);
  }
}

seed()
  .then(async () => {
    logger.info('Seed complete');
    await closeDatabase();
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    logger.error({ err: error }, 'Seed failed');
    await closeDatabase();
    process.exit(1);
  });
