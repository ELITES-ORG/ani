import { pgTable, text, uuid, index, unique } from 'drizzle-orm/pg-core';

/**
 * Biliran's municipalities and barangays, seeded once.
 *
 * A lookup table rather than coordinates or PostGIS: there are eight
 * municipalities, and every location question this product has is answered by
 * "which barangay". See docs/explanation/constraints.md.
 */
export const municipalities = pgTable('municipalities', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
});

export const barangays = pgTable(
  'barangays',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    municipalityId: uuid('municipality_id')
      .notNull()
      .references(() => municipalities.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
  },
  (table) => [
    index('barangays_municipality_idx').on(table.municipalityId),
    // Slugs repeat across municipalities; only the pair is unique.
    unique('barangays_municipality_slug_key').on(table.municipalityId, table.slug),
  ],
);
