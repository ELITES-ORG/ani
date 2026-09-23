/**
 * Biliran province: eight municipalities.
 *
 * Naval is the capital. This list is fixed — the province is not going to gain
 * a ninth — which is why location is a lookup table and not a free-text field.
 */
export const MUNICIPALITIES = [
  { slug: 'almeria', name: 'Almeria' },
  { slug: 'biliran', name: 'Biliran' },
  { slug: 'cabucgayan', name: 'Cabucgayan' },
  { slug: 'caibiran', name: 'Caibiran' },
  { slug: 'culaba', name: 'Culaba' },
  { slug: 'kawayan', name: 'Kawayan' },
  { slug: 'maripipi', name: 'Maripipi' },
  { slug: 'naval', name: 'Naval' },
] as const;

/**
 * A starter set of barangays per municipality.
 *
 * Deliberately partial: enough to register a farm and place a delivery in
 * every municipality. Completing it is tracked in docs/plans.
 */
export const BARANGAYS: Record<string, { slug: string; name: string }[]> = {
  almeria: [
    { slug: 'poblacion', name: 'Poblacion' },
    { slug: 'talahid', name: 'Talahid' },
    { slug: 'jamorawon', name: 'Jamorawon' },
  ],
  biliran: [
    { slug: 'poblacion', name: 'Poblacion' },
    { slug: 'bato', name: 'Bato' },
    { slug: 'julita', name: 'Julita' },
  ],
  cabucgayan: [
    { slug: 'poblacion', name: 'Poblacion' },
    { slug: 'caanibongan', name: 'Caanibongan' },
    { slug: 'looc', name: 'Looc' },
  ],
  caibiran: [
    { slug: 'poblacion', name: 'Poblacion' },
    { slug: 'kawayanon', name: 'Kawayanon' },
    { slug: 'union', name: 'Union' },
  ],
  culaba: [
    { slug: 'poblacion', name: 'Poblacion' },
    { slug: 'looc', name: 'Looc' },
    { slug: 'marvel', name: 'Marvel' },
  ],
  kawayan: [
    { slug: 'poblacion', name: 'Poblacion' },
    { slug: 'balacson', name: 'Balacson' },
    { slug: 'mapuyo', name: 'Mapuyo' },
  ],
  maripipi: [
    { slug: 'poblacion', name: 'Poblacion' },
    { slug: 'binongtoan', name: 'Binongtoan' },
    { slug: 'ol-og', name: 'Ol-og' },
  ],
  naval: [
    { slug: 'atipolo', name: 'Atipolo' },
    { slug: 'calumpang', name: 'Calumpang' },
    { slug: 'caraycaray', name: 'Caraycaray' },
    { slug: 'larrazabal', name: 'Larrazabal' },
    { slug: 'poblacion', name: 'Poblacion' },
    { slug: 'santo-nino', name: 'Santo Niño' },
  ],
};
