export interface Municipality {
  id: string;
  slug: string;
  name: string;
}

export interface Barangay {
  id: string;
  slug: string;
  name: string;
  municipalityId: string;
}

/** The categories a product can be filed under. */
export type ProductCategory =
  | 'vegetables'
  | 'fruits'
  | 'rice_and_grains'
  | 'seafood'
  | 'meat_and_poultry'
  | 'dairy_and_eggs'
  | 'herbs_and_spices'
  | 'processed';

/** How a vendor sells a product. */
export type SellUnit = 'kg' | 'gram' | 'piece' | 'bundle' | 'sack' | 'tray' | 'liter';
